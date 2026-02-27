export const runtime = 'nodejs';

import { requireAdmin } from '@/lib/requireAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import CustomersClient from './CustomersClient';

export default async function CustomersPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { data: users } = await supabase
    .from('profiles')
    .select('*, addresses(*)')
    .order('created_at', { ascending: false });

  return <CustomersClient initialUsers={users || []} />;
}