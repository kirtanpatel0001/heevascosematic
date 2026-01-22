'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';

const OTP_COOLDOWN = 120;

export default function SignUpPage() {
  const router = useRouter();
  const supabase = supabaseClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [otp, setOtp] = useState('');

  /* ---------------- COOLDOWN TIMER ---------------- */
  useEffect(() => {
    if (cooldown <= 0) return;

    const t = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);

    return () => clearInterval(t);
  }, [cooldown]);

  /* ---------------- STEP 1: SIGNUP + SEND OTP ---------------- */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;

    setLoading(true);
    setError('');

    try {
      // 1️⃣ Create user with password
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            phone: formData.phone,
          },
        },
      });

      if (
        signUpError &&
        !signUpError.message.toLowerCase().includes('already registered')
      ) {
        throw signUpError;
      }

      // 2️⃣ Send OTP
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: formData.email,
      });

      /**
       * CRITICAL FIX:
       * If rate-limited, OTP was already sent.
       * We MUST redirect to OTP screen anyway.
       */
      if (otpError) {
        if (
          otpError.message.includes('security purposes') ||
          otpError.message.includes('wait')
        ) {
          setStep(2);
          return;
        }
        throw otpError;
      }

      setStep(2);
      setCooldown(OTP_COOLDOWN);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- STEP 2: VERIFY OTP ---------------- */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (otp.length !== 8) {
        throw new Error('OTP must be 8 digits');
      }

      const { error } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: otp,
        type: 'email',
      });

      if (error) throw error;

      router.push('/auth/login');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-[420px] border border-black rounded-xl p-8">

        {error && (
          <div className="mb-4 border border-black text-black text-xs p-3 text-center">
            {error}
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white mb-4">
            <Sparkles size={18} />
          </div>
          <h1 className="text-2xl font-bold text-black">
            {step === 1 ? 'Create Account' : 'Verify OTP'}
          </h1>
          <p className="text-sm text-black mt-2">
            {step === 1
              ? 'Fill details to receive OTP'
              : `Enter the 8-digit OTP sent to ${formData.email}`}
          </p>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <input
              required
              placeholder="Full Name"
              className="w-full border border-black p-3 text-black"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <input
              required
              type="email"
              placeholder="Email"
              className="w-full border border-black p-3 text-black"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />

            <input
              required
              type="tel"
              placeholder="Phone"
              className="w-full border border-black p-3 text-black"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />

            <input
              required
              type="password"
              minLength={6}
              placeholder="Password"
              className="w-full border border-black p-3 text-black"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />

            <button
              type="submit"
              disabled={loading || cooldown > 0}
              className="w-full bg-black text-white py-3 font-semibold disabled:opacity-50"
            >
              {loading
                ? 'Sending OTP...'
                : cooldown > 0
                ? `Resend OTP in ${cooldown}s`
                : 'Send OTP'}
            </button>
          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              required
              inputMode="numeric"
              pattern="[0-9]{8}"
              maxLength={8}
              placeholder="Enter 8-digit OTP"
              className="w-full border border-black p-3 text-black text-center tracking-widest"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))
              }
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 font-semibold"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Verify OTP'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-black">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-bold underline">
            Log in
          </Link>
        </p>

      </div>
    </div>
  );
}
