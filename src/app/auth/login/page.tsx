'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const supabase = supabaseClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1️⃣ Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const user = data.user;

      // 2️⃣ EMAIL VERIFICATION CHECK (MANDATORY)
      if (!user?.email_confirmed_at) {
        // Re-send verification email
        await supabase.auth.resend({
          type: 'signup',
          email,
        });

        router.push('/auth/verify');
        return;
      }

      // 3️⃣ FETCH ROLE FROM PROFILES (SAFE)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // 4️⃣ ROLE-BASED REDIRECT (NAVIGATION ONLY)
      if (profile.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-[400px] bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
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
          <p className="text-sm text-gray-500 mt-2">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase">
              Email
            </label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-700 uppercase">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-xs text-gray-500 hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-black"
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
            className="w-full bg-black text-white py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold"
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
          Don’t have an account?{' '}
          <Link href="/auth/signup" className="font-semibold text-black hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
