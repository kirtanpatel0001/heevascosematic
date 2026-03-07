'use server';

import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabaseServer';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Server-side admin client for privileged coupon operations.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VALID_PAYMENT_METHODS = ['card', 'upi', 'cod'] as const;
type PaymentMethod = (typeof VALID_PAYMENT_METHODS)[number];

type NormalizedItem = {
  quantity: number;
  product: {
    id: string;
    price: number;
    stock: number;
    is_visible: boolean;
  };
};

type RawCartItem = {
  quantity: number;
  product: NormalizedItem['product'] | NormalizedItem['product'][];
};

function calcDiscount(subtotal: number, value: number, type: string): number {
  if (type === 'percentage') return Math.min((subtotal * value) / 100, subtotal);
  return Math.min(value, subtotal);
}

function timingSafeHexEqual(expected: string, actual: string): boolean {
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(actual);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

async function getCartTotal(userId: string): Promise<{
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  items: NormalizedItem[];
}> {
  const supabase = await supabaseServer();

  const { data: cartItems, error } = await supabase
    .from('cart_items')
    .select('quantity, product:products(id, price, stock, is_visible)')
    .eq('user_id', userId);

  if (error || !cartItems || cartItems.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const { data: settings } = await supabase
    .from('store_settings')
    .select('tax_rate, delivery_charge, free_shipping_threshold')
    .eq('id', 1)
    .single();

  const items: NormalizedItem[] = (cartItems as RawCartItem[]).map((item) => {
    const product = Array.isArray(item.product) ? item.product[0] : item.product;
    return { quantity: item.quantity, product };
  });

  let subtotal = 0;
  for (const item of items) {
    if (!item.product?.is_visible) throw new Error('A product in your cart is no longer available.');
    if (item.quantity > item.product.stock) {
      throw new Error(`Insufficient stock for product: ${item.product.id}`);
    }
    subtotal += item.quantity * item.product.price;
  }

  const taxRate = settings?.tax_rate || 0;
  const deliveryCharge = settings?.delivery_charge || 0;
  const freeThreshold = settings?.free_shipping_threshold || 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const shippingCost = freeThreshold > 0 && subtotal >= freeThreshold ? 0 : deliveryCharge;

  return { subtotal, taxAmount, shippingCost, items };
}

async function validateCouponServer(
  couponCode: string | null,
  userId: string,
  subtotal: number
): Promise<{ discountAmount: number; couponId: string | null; couponCode: string | null }> {
  if (!couponCode?.trim()) return { discountAmount: 0, couponId: null, couponCode: null };

  const clean = couponCode.replace(/[\s\u200B\u00A0\u2000-\u200A\uFEFF\r\n\t]/g, '').toUpperCase();

  const { data: coupon, error } = await supabaseAdmin
    .from('coupons')
    .select('id, code, discount_value, discount_type, usage_limit, used_count, is_active')
    .ilike('code', clean)
    .maybeSingle();

  if (error) throw new Error('Could not verify coupon.');
  if (!coupon) throw new Error('Invalid coupon code.');
  if (!coupon.is_active) throw new Error('This coupon is no longer active.');
  if (coupon.used_count >= coupon.usage_limit) throw new Error('Coupon is fully exhausted.');

  const { data: alreadyUsed } = await supabaseAdmin
    .from('coupon_redemptions')
    .select('id')
    .eq('coupon_id', coupon.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (alreadyUsed) throw new Error('You have already used this coupon.');

  return {
    discountAmount: calcDiscount(subtotal, coupon.discount_value, coupon.discount_type),
    couponId: coupon.id,
    couponCode: coupon.code,
  };
}

export async function initiateRazorpay(couponCode?: string) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized. Please login.');

  const { subtotal, taxAmount, shippingCost } = await getCartTotal(user.id);
  const { discountAmount } = await validateCouponServer(couponCode ?? null, user.id, subtotal);
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount + shippingCost);

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(grandTotal * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${user.id.slice(0, 8)}`,
    });

    return JSON.parse(JSON.stringify(order));
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    throw new Error('Failed to initiate payment. Please try again.');
  }
}

export async function createOrder(formData: FormData): Promise<{ orderId: string }> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized. Please login.');

  const paymentMethod = formData.get('paymentMethod') as PaymentMethod;
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    throw new Error('Invalid payment method.');
  }

  for (const field of ['firstName', 'lastName', 'phone', 'address', 'city', 'pincode']) {
    if (!formData.get(field)?.toString().trim()) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  const shippingAddress = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    phone: formData.get('phone') as string,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    pincode: formData.get('pincode') as string,
  };

  const { subtotal, taxAmount, shippingCost, items } = await getCartTotal(user.id);
  const couponInput = formData.get('couponCode') as string | null;
  const { discountAmount, couponId, couponCode } = await validateCouponServer(couponInput, user.id, subtotal);
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount + shippingCost);
  const expectedAmountPaise = Math.round(grandTotal * 100);

  if (paymentMethod === 'card' || paymentMethod === 'upi') {
    const rzpOrderId = formData.get('razorpay_order_id') as string;
    const rzpPaymentId = formData.get('razorpay_payment_id') as string;
    const rzpSignature = formData.get('razorpay_signature') as string;

    if (!rzpOrderId || !rzpPaymentId || !rzpSignature) {
      throw new Error('Missing payment verification fields.');
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${rzpOrderId}|${rzpPaymentId}`)
      .digest('hex');

    if (!timingSafeHexEqual(expectedSignature, rzpSignature)) {
      throw new Error('Payment verification failed.');
    }

    const [orderInfo, paymentInfo] = await Promise.all([
      razorpay.orders.fetch(rzpOrderId),
      razorpay.payments.fetch(rzpPaymentId),
    ]);

    if (paymentInfo.order_id !== rzpOrderId) {
      throw new Error('Payment/order mismatch detected.');
    }
    if (!['authorized', 'captured'].includes(paymentInfo.status)) {
      throw new Error('Payment is not completed.');
    }
    if (orderInfo.currency !== 'INR' || paymentInfo.currency !== 'INR') {
      throw new Error('Invalid payment currency.');
    }
    if (orderInfo.amount !== expectedAmountPaise || paymentInfo.amount !== expectedAmountPaise) {
      throw new Error('Payment amount mismatch.');
    }
    const expectedReceiptSuffix = user.id.slice(0, 8);
    if (!orderInfo.receipt?.endsWith(expectedReceiptSuffix)) {
      throw new Error('Invalid payment receipt.');
    }
  }

  let createdOrderId: string | null = null;
  const adjustedStock: Array<{ productId: string; quantity: number }> = [];

  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: grandTotal,
        discount_amount: discountAmount || null,
        coupon_code: couponCode || null,
        payment_method: paymentMethod,
        shipping_address: shippingAddress,
        status: paymentMethod === 'cod' ? 'pending' : 'paid',
        payment_id: formData.get('razorpay_payment_id') || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      throw new Error(orderError?.message ?? 'Failed to create order.');
    }
    createdOrderId = order.id;

    const { error: itemsError } = await supabase.from('order_items').insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }))
    );
    if (itemsError) throw new Error('Failed to save order items.');

    for (const item of items) {
      const { data: updatedRows, error: stockError } = await supabase
        .from('products')
        .update({ stock: item.product.stock - item.quantity })
        .eq('id', item.product.id)
        .gte('stock', item.quantity)
        .select('id');

      if (stockError) throw new Error(`Stock update failed for product: ${item.product.id}`);
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error(`Insufficient stock for product: ${item.product.id}`);
      }

      adjustedStock.push({ productId: item.product.id, quantity: item.quantity });
    }

    if (couponId) {
      const { error: redemptionError } = await supabaseAdmin.from('coupon_redemptions').insert({
        coupon_id: couponId,
        user_id: user.id,
        order_id: order.id,
      });
      if (redemptionError) throw new Error('Failed to record coupon redemption.');

      const { error: couponCountError } = await supabaseAdmin.rpc('increment_coupon_usage', {
        coupon_id_input: couponId,
      });
      if (couponCountError) throw new Error('Failed to update coupon usage.');
    }

    const { error: clearCartError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);
    if (clearCartError) throw new Error('Failed to clear cart.');

    return { orderId: order.id };
  } catch (err) {
    if (createdOrderId) {
      await supabaseAdmin.from('coupon_redemptions').delete().eq('order_id', createdOrderId);
      await supabaseAdmin.from('order_items').delete().eq('order_id', createdOrderId);
      await supabaseAdmin.from('orders').delete().eq('id', createdOrderId);
    }

    for (const row of adjustedStock) {
      const { data: currentStockRow } = await supabaseAdmin
        .from('products')
        .select('stock')
        .eq('id', row.productId)
        .single();

      if (currentStockRow && typeof currentStockRow.stock === 'number') {
        await supabaseAdmin
          .from('products')
          .update({ stock: currentStockRow.stock + row.quantity })
          .eq('id', row.productId);
      }
    }

    throw err instanceof Error ? err : new Error('Checkout failed.');
  }
}
