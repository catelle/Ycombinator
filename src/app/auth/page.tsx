'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import { useRouter } from 'next/navigation';
import BackgroundImage from '@/components/BackgroundImage';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    code: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, verifyEmail, resendVerification, login } = useAuth();
  const router = useRouter();

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '', code: '' });
    setStep('form');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (step === 'form' && mode === 'signup') {
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters.');
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        const result = await register({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        });
        setStep('verify');
        if (result.emailSent === false) {
          setError('We could not send the verification email. Please use “Resend code”.');
        }
      } else if (step === 'form' && mode === 'login') {
        await login(formData.email, formData.password);
        resetForm();
        router.push('/matches');
      } else if (step === 'verify') {
        await verifyEmail(formData.email, formData.code);
        await login(formData.email, formData.password);
        resetForm();
        router.push('/matches');
      }
    } catch (error: any) {
      if (error?.requiresVerification) {
        setStep('verify');
        setError('Email not verified. We sent a verification code.');
        setLoading(false);
        return;
      }
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundImage imageIndex={2} overlay="dark" overlayOpacity={0.75}>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md relative">
        <div className="glass-card rounded-3xl p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-[var(--text-muted)] text-sm">
              {mode === 'login'
                ? 'Sign in to continue your matchmaking journey.'
                : 'Join the platform to find your cofounder.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && step === 'form' && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-[var(--border)] bg-[var(--surface-muted)] rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-[var(--border)] bg-[var(--surface-muted)] rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            {mode === 'signup' && step === 'form' && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-[var(--border)] bg-[var(--surface-muted)] rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="+237 6XX XXX XXX"
                  required
                />
              </div>
            )}

            {step === 'form' && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-[var(--border)] bg-[var(--surface-muted)] rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            {mode === 'signup' && step === 'form' && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-[var(--border)] bg-[var(--surface-muted)] rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            {step === 'verify' && (
              <div>
                <p className="text-sm text-[var(--text-muted)] mb-2">Check your email for the 6-digit verification code.</p>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Verification Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-3 border border-[var(--border)] bg-[var(--surface-muted)] rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter the code"
                  required
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await resendVerification(formData.email);
                      setError('We sent a new verification code.');
                    } catch (err: any) {
                      setError(err.message || 'Failed to resend code.');
                    }
                  }}
                  className="mt-2 text-yellow-600 hover:text-yellow-700 text-sm font-medium"
                >
                  Resend code
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Loading...' : step === 'verify' ? 'Verify Email' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                resetForm();
              }}
              className="text-yellow-600 hover:text-yellow-700 font-medium"
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-[var(--text-muted)]">
          <Link href="/" className="text-yellow-600 hover:text-yellow-700">Back to home</Link>
        </div>
      </div>
    </div>
    </BackgroundImage>
  );
}
