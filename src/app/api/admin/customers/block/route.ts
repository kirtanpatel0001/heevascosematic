import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/requireAdmin';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const userId = body?.userId as string | undefined;
  const isBlocked = body?.isBlocked as boolean | undefined;

  if (!userId || typeof isBlocked !== 'boolean') {
    return NextResponse.json({ error: 'userId and isBlocked are required.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_blocked: isBlocked })
    .eq('id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

