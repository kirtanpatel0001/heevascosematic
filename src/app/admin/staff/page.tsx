export const runtime = 'nodejs';

import { supabaseServer } from '@/lib/supabaseServer';
import StaffClient from './StaffClient';

export default async function StaffPage() {
  const supabase = await supabaseServer();

  const { data: staff } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, created_at')
    .in('role', ['admin', 'employee'])
    .order('created_at', { ascending: false });

  return <StaffClient initialStaff={staff || []} />;
}
