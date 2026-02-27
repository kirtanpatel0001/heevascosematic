'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';

export default function ForgotPasswordPage() {
  const supabase = supabaseClient();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // STEP 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email', // ✅ Fixed: was 'recovery', must match signInWithOtp
      });
      if (error) throw error;
      setStep(3);
    } catch (err: any) {
      setError('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      // Sign out after password reset for security
      await supabase.auth.signOut();
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-sm border border-gray-100 p-8 relative overflow-hidden">
        {error && (
          <div className="absolute top-0 left-0 w-full bg-red-50 text-red-600 text-xs font-medium p-3 text-center">
            {error}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-50 mb-4 border border-gray-100">
                <KeyRound size={20} />
              </div>
              <h1 className="text-2xl font-bold">Forgot Password?</h1>
              <p className="text-sm text-gray-500 mt-2">
                Enter your email and we'll send you a verification code.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase">
                  Email Address
                </label>
                <div className="relative mt-1 group">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white h-11 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black"
              >
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-50 mb-4 border border-gray-100">
                <Mail size={20} />
              </div>
              <h1 className="text-2xl font-bold">Check your Inbox</h1>
              <p className="text-sm text-gray-500 mt-2">
                We sent a 6-digit code to{' '}
                <span className="font-semibold text-black">{email}</span>.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="123456"
                  maxLength={6}
                  inputMode="numeric"
                  required
                  className="w-full mt-1 text-center tracking-[1em] font-mono text-lg py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white h-11 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Verify Code'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setStep(1)}
                className="text-xs text-gray-500 hover:text-black underline"
              >
                Wrong email? Try again
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-50 mb-4 border border-gray-100">
                <Lock size={20} />
              </div>
              <h1 className="text-2xl font-bold">Reset Password</h1>
              <p className="text-sm text-gray-500 mt-2">
                Set a new secure password.
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase">
                  New Password
                </label>
                <div className="relative mt-1">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
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
                className="w-full bg-black text-white h-11 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="text-center py-8">
            <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={40} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Password Reset!
            </h1>
            <p className="text-sm text-gray-500 mb-8 max-w-[250px] mx-auto">
              Your password has been updated. Please log in with your new
              credentials.
            </p>
            <Link
              href="/auth/login"
              className="w-full inline-flex items-center justify-center gap-2 bg-black text-white h-11 rounded-lg font-semibold text-sm"
            >
              Back to Login <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}