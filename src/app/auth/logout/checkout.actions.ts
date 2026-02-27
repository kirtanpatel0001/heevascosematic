'use server';

import { supabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const razorpay = new Razorpay({
  key_id:     process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Admin client — bypasses RLS for coupon lookup
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VALID_PAYMENT_METHODS = ['card', 'upi', 'cod'] as const;
type PaymentMethod = (typeof VALID_PAYMENT_METHODS)[number];

// ── Discount calculator ───────────────────────────────────
function calcDiscount(subtotal: number, value: number, type: string): number {
  if (type === 'percentage') return Math.min((subtotal * value) / 100, subtotal);
  return Math.min(value, subtotal);
}

// ── Trusted cart total from DB ────────────────────────────
async function getCartTotal(userId: string) {
  const supabase = await supabaseServer();

  const { data: cartItems, error } = await supabase
    .from('cart_items')
    .select('quantity, product:products(id, price, stock, is_visible)')
    .eq('user_id', userId);

  if (error || !cartItems || cartItems.length === 0) throw new Error('Your cart is empty.');

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
    if (item.quantity > item.product.stock) throw new Error('Insufficient stock for a product in your cart.');
    subtotal += item.quantity * item.product.price;
  }

  const taxRate            = settings?.tax_rate || 0;
  const deliveryCharge     = settings?.delivery_charge || 0;
  const freeThreshold      = settings?.free_shipping_threshold || 0;
  const taxAmount          = (subtotal * taxRate) / 100;
  const shippingCost       = freeThreshold > 0 && subtotal >= freeThreshold ? 0 : deliveryCharge;

  return { subtotal, taxAmount, shippingCost, items };
}

// ── Coupon validation (uses admin client to bypass RLS) ───
async function validateCouponServer(
  couponCode: string | null,
  userId: string,
  subtotal: number
): Promise<{ discountAmount: number; couponId: string | null; couponCode: string | null }> {
  if (!couponCode?.trim()) return { discountAmount: 0, couponId: null, couponCode: null };

  const clean = couponCode.replace(/\s+/g, '').toUpperCase();

  const { data: coupon, error } = await supabaseAdmin
    .from('coupons')
    .select('id, code, discount_value, discount_type, usage_limit, used_count, is_active')
    .ilike('code', clean)
    .maybeSingle(); // safe — no throw if not found

  if (error)   throw new Error('Could not verify coupon.');
  if (!coupon) throw new Error('Invalid coupon code.');
  if (!coupon.is_active) throw new Error('This coupon is no longer active.');
  if (coupon.used_count >= coupon.usage_limit) throw new Error('Coupon is fully exhausted.');

  // Check if user already used it
  const { data: alreadyUsed } = await supabaseAdmin
    .from('coupon_redemptions')
    .select('id')
    .eq('coupon_id', coupon.id)
    .eq('user_id', userId)
    .maybeSingle(); // safe — no throw if not found

  if (alreadyUsed) throw new Error('You have already used this coupon.');

  return {
    discountAmount: calcDiscount(subtotal, coupon.discount_value, coupon.discount_type),
    couponId:       coupon.id,
    couponCode:     coupon.code,
  };
}

// ── ACTION 1: Create Razorpay order ───────────────────────
export async function initiateRazorpay(couponCode?: string) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized. Please login.');

  const { subtotal, taxAmount, shippingCost } = await getCartTotal(user.id);
  const { discountAmount } = await validateCouponServer(couponCode ?? null, user.id, subtotal);
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount + shippingCost);

  try {
    const order = await razorpay.orders.create({
      amount:   Math.round(grandTotal * 100), // paise
      currency: 'INR',
      receipt:  `rcpt_${Date.now()}_${user.id.slice(0, 4)}`,
    });
    return JSON.parse(JSON.stringify(order));
  } catch (err) {
    console.error('Razorpay Error:', err);
    throw new Error('Failed to initiate payment. Please try again.');
  }
}

// ── ACTION 2: Verify & save order ────────────────────────
export async function createOrder(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/authntication/login');

  // Validate payment method
  const paymentMethod = formData.get('paymentMethod') as PaymentMethod;
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) throw new Error('Invalid payment method.');

  // Verify Razorpay signature for online payments
  if (paymentMethod === 'card' || paymentMethod === 'upi') {
    const rzp_order_id   = formData.get('razorpay_order_id')   as string;
    const rzp_payment_id = formData.get('razorpay_payment_id') as string;
    const rzp_signature  = formData.get('razorpay_signature')  as string;

    if (!rzp_order_id || !rzp_payment_id || !rzp_signature) {
      throw new Error('Missing payment verification fields.');
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${rzp_order_id}|${rzp_payment_id}`)
      .digest('hex');

    if (expected !== rzp_signature) throw new Error('Payment verification failed.');
  }

  // Validate shipping fields
  for (const field of ['firstName', 'lastName', 'phone', 'address', 'city', 'pincode']) {
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

  // Recalculate server-side — never trust client amounts
  const { subtotal, taxAmount, shippingCost, items } = await getCartTotal(user.id);
  const couponInput = formData.get('couponCode') as string | null;
  const { discountAmount, couponId, couponCode } = await validateCouponServer(couponInput, user.id, subtotal);
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount + shippingCost);

  // Insert order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id:          user.id,
      total_amount:     grandTotal,
      discount_amount:  discountAmount || null,
      coupon_code:      couponCode     || null,
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

  // Atomic stock decrement
  for (const item of items) {
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: item.product.stock - item.quantity })
      .eq('id', item.product.id)
      .gte('stock', item.quantity);
    if (stockError) throw new Error('Stock update failed.');
  }

  // Record coupon redemption
  if (couponId) {
    await supabaseAdmin.from('coupon_redemptions').insert({
      coupon_id: couponId,
      user_id:   user.id,
      order_id:  order.id,
    });
    await supabaseAdmin.rpc('increment_coupon_usage', { coupon_id_input: couponId });
  }

  // Clear cart
  await supabase.from('cart_items').delete().eq('user_id', user.id);

  redirect(`/authntication/order-success?id=${order.id}`);
}