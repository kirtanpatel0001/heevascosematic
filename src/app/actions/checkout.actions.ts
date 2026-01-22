'use server';

import { supabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';

export async function createOrder(formData: FormData) {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const paymentMethod = formData.get('paymentMethod') as
    | 'card'
    | 'upi'
    | 'cod';

  const shippingAddress = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    phone: formData.get('phone') as string,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    pincode: formData.get('pincode') as string,
  };

  // 🔒 TRUSTED SERVER FETCH
  const { data: cartItems, error } = await supabase
    .from('cart_items')
    .select(`
      quantity,
      product:products (
        id,
        price,
        stock,
        is_visible
      )
    `)
    .eq('user_id', user.id);

  if (error || !cartItems || cartItems.length === 0) {
    throw new Error('Cart empty');
  }

  // Supabase returns related rows as arrays when using nested selects.
  // Normalize `product` to be the single product object for easier access.
  const items = cartItems.map((item: any) => ({
    ...item,
    product: Array.isArray(item.product) ? item.product[0] : item.product,
  }));

  let total = 0;

  for (const item of items) {
    if (!item.product || !item.product.is_visible) {
      throw new Error('Product unavailable');
    }
    if (item.quantity > item.product.stock) {
      throw new Error('Insufficient stock');
    }
    total += item.quantity * item.product.price;
  }

  const { data: order } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      total_amount: total,
      payment_method: paymentMethod,
      shipping_address: shippingAddress,
      status: 'pending',
    })
    .select()
    .single();

  // order items
  await supabase.from('order_items').insert(
    items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
    }))
  );

  // reduce stock
  for (const item of items) {
    await supabase
      .from('products')
      .update({ stock: item.product.stock - item.quantity })
      .eq('id', item.product.id);
  }

  // clear cart
  await supabase.from('cart_items').delete().eq('user_id', user.id);

  redirect(`/authntication/order-success?id=${order.id}`);
}
