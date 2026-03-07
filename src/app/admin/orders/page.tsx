export const runtime = 'nodejs';

import { supabaseServer } from '@/lib/supabaseServer';
import OrdersClient from './OrdersClient';

export default async function OrdersPage() {
  const supabase = await supabaseServer();

  const { data: orders } = await supabase
    .from('orders')
    .select('id, created_at, total_amount, status, payment_method, shipping_address')
    .order('created_at', { ascending: false });

  return <OrdersClient initialOrders={orders || []} />;
}
