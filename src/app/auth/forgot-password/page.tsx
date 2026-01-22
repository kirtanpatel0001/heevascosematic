'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, KeyRound, ArrowRight, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';
export default function ForgotPasswordPage() {
  const supabase = supabaseClient();
  const router = useRouter();

  // --- State Management ---
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Email, 2: OTP, 3: New Pass, 4: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // --- Form Data ---
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // --- HANDLERS ---

  // STEP 1: Send OTP to Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
      });
      if (error) throw error;
      
      setStep(2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP (This logs the user in)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Type 'recovery' is important here
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery',
      });
      if (error) throw error;

      setStep(3); // Move to password reset
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      if (error) throw error;

      setStep(4); // Success
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F9FAFB] px-4 font-sans">
      
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 sm:p-10 relative overflow-hidden">
        
        {/* Error Message Toast (Inline) */}
        {error && (
          <div className="absolute top-0 left-0 w-full bg-red-50 text-red-600 text-xs font-medium p-3 text-center animate-in slide-in-from-top">
            {error}
          </div>
        )}

        {/* --- STEP 1: ENTER EMAIL --- */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-50 mb-4 text-gray-900 border border-gray-100">
                <KeyRound size={20} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Forgot Password?</h1>
              <p className="text-sm text-gray-500 mt-2">
                No worries! Enter your email and we will send you a verification code.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com" 
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400 text-sm" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-black text-white h-11 rounded-lg font-semibold hover:bg-zinc-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 text-sm shadow-lg shadow-black/10"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Send Verification Code'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black transition-colors">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          </div>
        )}

        {/* --- STEP 2: ENTER OTP --- */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-50 mb-4 text-gray-900 border border-gray-100">
                <Mail size={20} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Check your Inbox</h1>
              <p className="text-sm text-gray-500 mt-2">
                We sent a 6-digit code to <span className="font-semibold text-black">{email}</span>.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide ml-1">Verification Code</label>
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456" 
                  maxLength={6}
                  required
                  className="w-full text-center tracking-[1em] font-mono text-lg py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-gray-400 placeholder:text-sm" 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-black text-white h-11 rounded-lg font-semibold hover:bg-zinc-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 text-sm shadow-lg shadow-black/10"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verify Code'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button onClick={() => setStep(1)} className="text-xs text-gray-500 hover:text-black underline underline-offset-4">
                Wrong email? Try again
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 3: NEW PASSWORD --- */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-50 mb-4 text-gray-900 border border-gray-100">
                <Lock size={20} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reset Password</h1>
              <p className="text-sm text-gray-500 mt-2">
                Your code is verified. Please set a new secure password.
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide ml-1">New Password</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••" 
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400 text-sm" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-black text-white h-11 rounded-lg font-semibold hover:bg-zinc-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 text-sm shadow-lg shadow-black/10"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* --- STEP 4: SUCCESS --- */}
        {step === 4 && (
          <div className="text-center py-8 animate-in zoom-in duration-300">
            <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={40} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h1>
            <p className="text-sm text-gray-500 mb-8 max-w-[250px] mx-auto">
              Your password has been successfully updated. You can now log in with your new credentials.
            </p>
            <Link 
              href="/auth/login" 
              className="w-full inline-flex items-center justify-center gap-2 bg-black text-white h-11 rounded-lg font-semibold hover:bg-zinc-800 transition-all active:scale-[0.98] text-sm shadow-lg shadow-black/10"
            >
              Back to Login <ArrowRight size={16} />
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}