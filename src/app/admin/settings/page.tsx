export const runtime = 'nodejs';

import { supabaseServer } from '@/lib/supabaseServer';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const supabase = await supabaseServer();

  const { data: settings } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .single();

  return <SettingsClient initialSettings={settings} />;
}
