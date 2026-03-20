'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = supabaseClient();
  const redirectTo = useMemo(() => searchParams.get('redirect'), [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    router.prefetch('/');
    router.prefetch('/admin');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      const user = data.user;

      // ── Step 1: Check email verification ──────────────────────────────────
      if (!user?.email_confirmed_at) {
        await supabase.auth.resend({
          type: 'signup',
          email,
        });
        router.replace('/auth/verify');
        return;
      }

      // ── Step 2: Always fetch role FIRST before any redirect ───────────────
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const isAdmin = profile?.role === 'admin';

      // ── Step 3: Admin always goes to /admin ───────────────────────────────
      // Using window.location.href instead of router.replace to force a full
      // page reload — this ensures session cookies are fully written before
      // the middleware runs its role check on the server side.
      if (isAdmin) {
        window.location.href = '/admin';
        return;
      }

      // ── Step 4: Non-admin — honour redirectTo if safe ─────────────────────
      if (
        redirectTo &&
        redirectTo.startsWith('/') &&
        !redirectTo.startsWith('//')
      ) {
        window.location.href = redirectTo;
        return;
      }

      // ── Step 5: Default fallback for regular users ────────────────────────
      window.location.href = '/';

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      setLoading(false); // only reset on error — success navigates away
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-[400px] bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">

        {/* ── Back to Home ── */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-black transition-colors mb-6 group"
        >
          <ArrowLeft
            size={13}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Back to Home
        </Link>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 text-xs p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white mb-4">
            <Sparkles size={18} />
          </div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-sm text-gray-500 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase">
              Email
            </label>
            <div className="relative mt-1">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-700 uppercase">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-gray-500 hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative mt-1">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-70"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/signup"
            className="font-semibold text-black hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9FAFB]" />}>
      <LoginPageContent />
    </Suspense>
  );
}