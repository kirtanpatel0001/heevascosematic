export const runtime = 'nodejs';

import { supabaseServer } from '@/lib/supabaseServer';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await supabaseServer();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: orders } = await supabase
    .from('orders')
    .select('id, user_id, total_amount, status, payment_method, shipping_address, created_at')
    .gte('created_at', startOfMonth)
    .order('created_at', { ascending: false });

  return <DashboardClient initialOrders={orders || []} />;
}
