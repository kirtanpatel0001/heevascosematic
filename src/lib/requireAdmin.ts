import { supabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';

export async function requireAdmin() {
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || profile?.role !== 'admin') redirect('/');

  return user;
}