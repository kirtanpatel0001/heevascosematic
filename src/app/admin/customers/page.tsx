export const runtime = 'nodejs';

import { supabaseServer } from '@/lib/supabaseServer';
import CustomersClient from './CustomersClient';

export default async function CustomersPage() {
  const supabase = await supabaseServer();

  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, role, created_at, is_blocked, addresses(id, user_id, label, house_no, street, city, state, pincode, is_default)')
    .order('created_at', { ascending: false });

  return <CustomersClient initialUsers={users || []} />;
}
