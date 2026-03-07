export const runtime = 'nodejs';

import { supabaseServer } from '@/lib/supabaseServer';
import CouponsClient from './CouponsClient';

export default async function CouponsPage() {
  const supabase = await supabaseServer();

  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  return <CouponsClient initialCoupons={coupons || []} />;
}
