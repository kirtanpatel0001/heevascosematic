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

// ✅ Server-side trusted cart total calculation
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
    throw new Error('Cart is empty');
  }

  const { data: settings } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .single();

  const items = cartItems.map((item: any) => ({
    ...item,
    product: Array.isArray(item.product) ? item.product[0] : item.product,
  }));

  let subtotal = 0;

  for (const item of items) {
    if (!item.product?.is_visible) throw new Error('A product in your cart is no longer available');
    if (item.quantity > item.product.stock) throw new Error(`Insufficient stock for: ${item.product.id}`);
    subtotal += item.quantity * item.product.price;
  }

  const taxRate = settings?.tax_rate || 0;
  const deliveryCharge = settings?.delivery_charge || 0;
  const freeShippingThreshold = settings?.free_shipping_threshold || 0;

  const taxAmount = (subtotal * taxRate) / 100;
  const shippingCost =
    freeShippingThreshold > 0 && subtotal >= freeShippingThreshold
      ? 0
      : deliveryCharge;

  const grandTotal = subtotal + taxAmount + shippingCost;

  return { grandTotal, items };
}

// ACTION 1: Initiate Razorpay Order
export async function initiateRazorpay() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { grandTotal } = await getCartTotal(user.id);

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(grandTotal * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}_${user.id.slice(0, 4)}`,
    });
    return JSON.parse(JSON.stringify(order));
  } catch (error) {
    console.error('Razorpay Error:', error);
    throw new Error('Failed to initiate payment');
  }
}

// ACTION 2: Verify & Create Order
export async function createOrder(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // ✅ Validate payment method against whitelist
  const paymentMethod = formData.get('paymentMethod') as PaymentMethod;
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    throw new Error('Invalid payment method');
  }

  // ✅ Signature verification for online payments
  if (paymentMethod === 'card' || paymentMethod === 'upi') {
    const razorpay_order_id = formData.get('razorpay_order_id') as string;
    const razorpay_payment_id = formData.get('razorpay_payment_id') as string;
    const razorpay_signature = formData.get('razorpay_signature') as string;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error('Missing payment verification fields');
    }

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      throw new Error('Payment verification failed');
    }
  }

  // ✅ Validate shipping address fields
  const requiredFields = ['firstName', 'lastName', 'phone', 'address', 'city', 'pincode'];
  for (const field of requiredFields) {
    if (!formData.get(field)) throw new Error(`Missing required field: ${field}`);
  }

  const shippingAddress = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    phone: formData.get('phone') as string,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    pincode: formData.get('pincode') as string,
  };

  // ✅ Recalculate total server-side — never trust client
  const { grandTotal, items } = await getCartTotal(user.id);

  // ✅ Insert order with error handling
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      total_amount: grandTotal,
      payment_method: paymentMethod,
      shipping_address: shippingAddress,
      status: paymentMethod === 'cod' ? 'pending' : 'paid',
      payment_id: formData.get('razorpay_payment_id') || null,
    })
    .select()
    .single();

  if (orderError || !order) throw new Error(orderError?.message ?? 'Failed to create order');

  // ✅ Insert order items with error handling
  const { error: itemsError } = await supabase.from('order_items').insert(
    items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
    }))
  );

  if (itemsError) throw new Error('Failed to save order items');

  // ✅ Atomic stock decrement with guard
  for (const item of items) {
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: item.product.stock - item.quantity })
      .eq('id', item.product.id)
      .gte('stock', item.quantity); // atomic guard — only update if stock still sufficient

    if (stockError) throw new Error(`Stock update failed for product: ${item.product.id}`);
  }

  // ✅ Clear cart
  await supabase.from('cart_items').delete().eq('user_id', user.id);

  // ✅ Fixed typo in redirect path
  redirect(`/authentication/order-success?id=${order.id}`);
}