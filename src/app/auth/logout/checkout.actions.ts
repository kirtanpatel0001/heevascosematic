'use server';

import { supabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// --- HELPER: Securely Calculate Cart Totals ---
async function getCartTotal(userId: string) {
  const supabase = await supabaseServer();
  
  // 1. Fetch Cart Items
  const { data: cartItems, error } = await supabase
    .from('cart_items')
    .select(`
      quantity,
      product:products (id, price, stock, is_visible)
    `)
    .eq('user_id', userId);

  if (error || !cartItems || cartItems.length === 0) throw new Error('Cart empty');

  // 2. Fetch Store Settings for Tax & Shipping
  const { data: settings } = await supabase.from('store_settings').select('*').eq('id', 1).single();
  
  const items = cartItems.map((item: any) => ({
    ...item,
    product: Array.isArray(item.product) ? item.product[0] : item.product,
  }));

  let subtotal = 0;
  for (const item of items) {
    if (!item.product?.is_visible) throw new Error('Product unavailable or removed');
    if (item.quantity > item.product.stock) throw new Error(`Insufficient stock for product ID: ${item.product.id}`);
    subtotal += item.quantity * item.product.price;
  }

  // 3. Apply Tax & Shipping Logic
  const taxRate = settings?.tax_rate || 0;
  const deliveryCharge = settings?.delivery_charge || 0;
  const freeShippingThreshold = settings?.free_shipping_threshold || 0;

  const taxAmount = (subtotal * taxRate) / 100;
  let shippingCost = deliveryCharge;
  
  // Free shipping check
  if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) {
    shippingCost = 0;
  }

  const grandTotal = subtotal + taxAmount + shippingCost;

  return { grandTotal, items };
}

// --- ACTION 1: Initiate Razorpay Order (Called by Client) ---
export async function initiateRazorpay() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { grandTotal } = await getCartTotal(user.id);

  const options = {
    amount: Math.round(grandTotal * 100), // Razorpay accepts amount in paise
    currency: 'INR',
    receipt: `receipt_${Date.now()}_${user.id.slice(0, 4)}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    return JSON.parse(JSON.stringify(order)); // Serialize for client
  } catch (error) {
    console.error('Razorpay Error:', error);
    throw new Error('Failed to initiate payment');
  }
}

// --- ACTION 2: Verify & Create Order (Called after Payment or for COD) ---
export async function createOrder(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const paymentMethod = formData.get('paymentMethod') as 'card' | 'upi' | 'cod';
  
  // --- VERIFICATION GATE ---
  // If payment is online, we MUST verify the signature before doing anything else
  if (paymentMethod === 'card' || paymentMethod === 'upi') {
    const razorpay_order_id = formData.get('razorpay_order_id') as string;
    const razorpay_payment_id = formData.get('razorpay_payment_id') as string;
    const razorpay_signature = formData.get('razorpay_signature') as string;

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      throw new Error('Payment verification failed. Security breach detected.');
    }
  }

  // --- PREPARE DATA ---
  const shippingAddress = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    phone: formData.get('phone') as string,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    pincode: formData.get('pincode') as string,
  };

  // Recalculate total (Don't trust client-side total)
  const { grandTotal, items } = await getCartTotal(user.id);

  // --- DB INSERTION ---
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      total_amount: grandTotal,
      payment_method: paymentMethod,
      shipping_address: shippingAddress,
      // Status logic: COD is 'pending', Online is 'paid' (since we verified signature)
      status: paymentMethod === 'cod' ? 'pending' : 'paid', 
      payment_id: formData.get('razorpay_payment_id') || null, 
    })
    .select()
    .single();

  if(orderError) throw new Error(orderError.message);

  // Insert Order Items
  const orderItemsData = items.map((item: any) => ({
    order_id: order.id,
    product_id: item.product.id,
    quantity: item.quantity,
    price: item.product.price,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);
  if(itemsError) throw new Error('Failed to save order items');

  // Reduce Stock
  for (const item of items) {
    await supabase
      .from('products')
      .update({ stock: item.product.stock - item.quantity })
      .eq('id', item.product.id);
  }

  // Clear Cart
  await supabase.from('cart_items').delete().eq('user_id', user.id);

  // Redirect to success page
  redirect(`/authntication/order-success?id=${order.id}`);
}