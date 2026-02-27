export const runtime = 'nodejs';

import { requireAdmin } from '@/lib/requireAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import OrdersClient from './OrdersClient';

export default async function OrdersPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  return <OrdersClient initialOrders={orders || []} />;
}