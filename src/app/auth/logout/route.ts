import { supabaseServer } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await supabaseServer();

  const { error } = await supabase.auth.signOut();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) throw new Error('NEXT_PUBLIC_SITE_URL is not defined');

  const response = NextResponse.redirect(new URL('/auth/login', siteUrl));

  if (error) {
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
  }

  return response;
}