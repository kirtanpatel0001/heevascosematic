'use server';

import { supabaseServer } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

// Service role client — bypasses RLS for coupon lookup
// Coupons are public promo codes, safe to read without RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function validateCoupon(rawCode: string) {
  // ── Auth: user must be logged in ──────────────────────
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please login to apply a coupon.');

  // ── Clean: remove ALL invisible/whitespace chars ───────
  const code = rawCode
    .replace(/[\s\u200B\u00A0\u2000-\u200A\uFEFF\r\n\t]/g, '')
    .toUpperCase()
    .trim();

  if (!code) throw new Error('Please enter a coupon code.');

  // ── Fetch using admin client (bypasses RLS) ────────────
  const { data: coupon, error } = await supabaseAdmin
    .from('coupons')
    .select('id, code, discount_value, discount_type, usage_limit, used_count, is_active, description')
    .ilike('code', code)
    .maybeSingle();

  if (error) {
    console.error('Coupon fetch error:', error);
    throw new Error('Could not verify coupon. Please try again.');
  }

  if (!coupon) {
    throw new Error(`Coupon "${code}" not found.`);
  }

  if (!coupon.is_active) {
    throw new Error('This coupon is no longer active.');
  }

  if (coupon.used_count >= coupon.usage_limit) {
    throw new Error('This coupon has reached its usage limit.');
  }

  // ── Check if this user already redeemed it ─────────────
  const { data: alreadyUsed, error: redError } = await supabaseAdmin
    .from('coupon_redemptions')
    .select('id')
    .eq('coupon_id', coupon.id)
    .eq('user_id', user.id)
    .maybeSingle();

  // 42P01 = table doesn't exist yet, skip gracefully
  if (redError && redError.code !== '42P01') {
    console.error('Redemption check error:', redError);
    throw new Error('Could not verify eligibility. Please try again.');
  }

  if (alreadyUsed) throw new Error('You have already used this coupon.');

  return {
    id:             coupon.id,
    code:           coupon.code,
    discount_value: coupon.discount_value,
    discount_type:  coupon.discount_type,
    description:    coupon.description,
  };
}