import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { createClient } from '@supabase/supabase-js';

// ✅ Service role client — bypasses RLS, used only on server
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  // ✅ Verify the caller is an admin
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { email, password, full_name, phone, role } = body;

  // Validate
  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'email, password and full_name are required.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  if (!['admin', 'employee'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }

  // ✅ Create real Supabase Auth user (so they can actually log in)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Skip email verification for staff added by admin
    user_metadata: { full_name },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // ✅ Update profile row (auto-created by trigger) with role + phone
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ full_name, phone: phone || null, role })
    .eq('id', authData.user.id);

  if (profileError) {
    // Clean up auth user if profile update fails
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, userId: authData.user.id });
}