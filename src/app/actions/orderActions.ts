'use server';

import { supabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const VALID_PAYMENT_METHODS = ['card', 'upi', 'cod'] as const;
type PaymentMethod = (typeof VALID_PAYMENT_METHODS)[number];

// ─────────────────────────────────────────────
// HELPER: Calculate discount amount from coupon
// Supports both 'percentage' and 'fixed' types
// ─────────────────────────────────────────────
function calcDiscount(
  subtotal: number,
  discountValue: number,
  discountType: string
): number {
  if (discountType === 'percentage') {
    return Math.min((subtotal * discountValue) / 100, subtotal);
  }
  // fixed
  return Math.min(discountValue, subtotal);
}

// ─────────────────────────────────────────────
// HELPER: Server-side trusted cart total
// ─────────────────────────────────────────────
async function getCartTotal(userId: string) {
  const supabase = await supabaseServer();

  const { data: cartItems, error } = await supabase
    .from('cart_items')
    .select(`
      quantity,
      product:products (id, price, stock, is_visible)
    `)
    .eq('user_id', userId);

  if (error || !cartItems || cartItems.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const { data: settings } = await supabase
    .from('store_settings')
    .select('tax_rate, delivery_charge, free_shipping_threshold')
    .eq('id', 1)
    .single();

  const items = cartItems.map((item: any) => ({
    ...item,
    product: Array.isArray(item.product) ? item.product[0] : item.product,
  }));

  let subtotal = 0;
  for (const item of items) {
    if (!item.product?.is_visible) throw new Error('A product in your cart is no longer available.');
    if (item.quantity > item.product.stock) throw new Error(`Insufficient stock for product: ${item.product.id}`);
    subtotal += item.quantity * item.product.price;
  }

  const taxRate             = settings?.tax_rate             || 0;
  const deliveryCharge      = settings?.delivery_charge      || 0;
  const freeShippingThreshold = settings?.free_shipping_threshold || 0;

  const taxAmount   = (subtotal * taxRate) / 100;
  const shippingCost = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold
    ? 0
    : deliveryCharge;

  return { subtotal, taxAmount, shippingCost, items };
}

// ─────────────────────────────────────────────
// HELPER: Validate coupon server-side (trusted)
// ─────────────────────────────────────────────
async function validateCouponServer(
  supabase: any,
  couponCode: string | null,
  userId: string,
  subtotal: number
): Promise<{ discountAmount: number; couponId: string | null; couponCode: string | null }> {
  if (!couponCode?.trim()) return { discountAmount: 0, couponId: null, couponCode: null };

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('id, code, discount_value, discount_type, usage_limit, used_count, is_active')
    .eq('code', couponCode.trim().toUpperCase())
    .single();

  if (error || !coupon)         throw new Error('Invalid coupon code.');
  if (!coupon.is_active)        throw new Error('This coupon is no longer active.');
  if (coupon.used_count >= coupon.usage_limit) throw new Error('Coupon is fully exhausted.');

  const { data: alreadyUsed } = await supabase
    .from('coupon_redemptions')
    .select('id')
    .eq('coupon_id', coupon.id)
    .eq('user_id', userId)
    .single();

  if (alreadyUsed) throw new Error('You have already used this coupon.');

  const discountAmount = calcDiscount(subtotal, coupon.discount_value, coupon.discount_type);

  return {
    discountAmount,
    couponId:   coupon.id,
    couponCode: coupon.code,
  };
}

// ─────────────────────────────────────────────
// ACTION 1: Initiate Razorpay Order
// Accepts optional coupon code to apply discount
// ─────────────────────────────────────────────
export async function initiateRazorpay(couponCode?: string) {
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized. Please login.');

  const { subtotal, taxAmount, shippingCost } = await getCartTotal(user.id);

  const { discountAmount } = await validateCouponServer(supabase, couponCode ?? null, user.id, subtotal);

  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount + shippingCost);

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(grandTotal * 100), // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}_${user.id.slice(0, 4)}`,
    });
    return JSON.parse(JSON.stringify(order));
  } catch (err) {
    console.error('Razorpay Error:', err);
    throw new Error('Failed to initiate payment. Please try again.');
  }
}

// ─────────────────────────────────────────────
// ACTION 2: Verify Signature & Create Order
// ─────────────────────────────────────────────
export async function createOrder(formData: FormData) {
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/authntication/login');

  // Validate payment method
  const paymentMethod = formData.get('paymentMethod') as PaymentMethod;
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) throw new Error('Invalid payment method.');

  // Verify Razorpay signature for online payments
  if (paymentMethod === 'card' || paymentMethod === 'upi') {
    const razorpay_order_id  = formData.get('razorpay_order_id')  as string;
    const razorpay_payment_id = formData.get('razorpay_payment_id') as string;
    const razorpay_signature  = formData.get('razorpay_signature')  as string;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error('Missing payment verification fields.');
    }

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      throw new Error('Payment verification failed. Possible security breach.');
    }
  }

  // Validate shipping fields
  const requiredFields = ['firstName', 'lastName', 'phone', 'address', 'city', 'pincode'];
  for (const field of requiredFields) {
    if (!formData.get(field)?.toString().trim()) throw new Error(`Missing required field: ${field}`);
  }

  const shippingAddress = {
    firstName: formData.get('firstName') as string,
    lastName:  formData.get('lastName')  as string,
    phone:     formData.get('phone')     as string,
    address:   formData.get('address')   as string,
    city:      formData.get('city')      as string,
    pincode:   formData.get('pincode')   as string,
  };

  // Always recalculate server-side — never trust client
  const { subtotal, taxAmount, shippingCost, items } = await getCartTotal(user.id);

  // Validate coupon server-side
  const couponCodeInput = formData.get('couponCode') as string | null;
  const { discountAmount, couponId, couponCode } = await validateCouponServer(
    supabase,
    couponCodeInput,
    user.id,
    subtotal
  );

  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount + shippingCost);

  // Insert order — matches your exact orders schema
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id:          user.id,
      total_amount:     grandTotal,
      discount_amount:  discountAmount,
      coupon_code:      couponCode,       // text column in your orders table
      payment_method:   paymentMethod,
      shipping_address: shippingAddress,
      status:           paymentMethod === 'cod' ? 'pending' : 'paid',
      payment_id:       formData.get('razorpay_payment_id') || null,
    })
    .select()
    .single();

  if (orderError || !order) throw new Error(orderError?.message ?? 'Failed to create order.');

  // Insert order items
  const { error: itemsError } = await supabase.from('order_items').insert(
    items.map((item: any) => ({
      order_id:   order.id,
      product_id: item.product.id,
      quantity:   item.quantity,
      price:      item.product.price,
    }))
  );
  if (itemsError) throw new Error('Failed to save order items.');

  // Atomic stock decrement with guard
  for (const item of items) {
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: item.product.stock - item.quantity })
      .eq('id', item.product.id)
      .gte('stock', item.quantity);
    if (stockError) throw new Error(`Stock update failed for product: ${item.product.id}`);
  }

  // Record redemption + increment coupon used_count
  if (couponId) {
    await supabase.from('coupon_redemptions').insert({
      coupon_id: couponId,
      user_id:   user.id,
      order_id:  order.id,
    });
    await supabase.rpc('increment_coupon_usage', { coupon_id_input: couponId });
  }

  // Clear cart
  await supabase.from('cart_items').delete().eq('user_id', user.id);

  redirect(`/authntication/order-success?id=${order.id}`);
}