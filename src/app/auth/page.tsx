'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import Link from 'next/link';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import { useRouter } from 'next/navigation';
import BackgroundImage from '@/components/BackgroundImage';
import { useTranslations } from 'next-intl';

export default function AuthPage() {
  const t = useTranslations('auth');
  const common = useTranslations('common');
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [step, setStep] = useState<'form' | 'verify' | 'reset-request' | 'reset-verify'>('form');
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
  const [notice, setNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, verifyEmail, resendVerification, requestPasswordReset, resetPassword, login } = useAuth();
  const router = useRouter();

  const resetForm = (nextStep: typeof step = 'form') => {
    setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '', code: '' });
    setStep(nextStep);
    setError('');
    setNotice('');
  };

  const goToLogin = () => {
    setMode('login');
    resetForm('form');
  };

  const goToSignup = () => {
    setMode('signup');
    resetForm('form');
  };

  const goToReset = () => {
    setMode('reset');
    setStep('reset-request');
    setError('');
    setNotice('');
    setFormData((prev) => ({ ...prev, password: '', confirmPassword: '', code: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      if (step === 'form' && mode === 'signup') {
        if (formData.password.length < 8) {
          setError(t('errors.passwordLength'));
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError(t('errors.passwordMatch'));
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
          setError(t('errors.verificationEmailFailed'));
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
      } else if (mode === 'reset' && step === 'reset-request') {
        const result = await requestPasswordReset(formData.email);
        setStep('reset-verify');
        if (result.emailSent === false) {
          setNotice(t('notices.resetEmailFailed'));
        } else {
          setNotice(t('notices.resetEmailSent'));
        }
      } else if (mode === 'reset' && step === 'reset-verify') {
        if (formData.password.length < 8) {
          setError(t('errors.passwordLength'));
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError(t('errors.passwordMatch'));
          setLoading(false);
          return;
        }
        await resetPassword(formData.email, formData.code, formData.password);
        setNotice(t('notices.resetSuccess'));
        setMode('login');
        setStep('form');
        setFormData((prev) => ({ ...prev, password: '', confirmPassword: '', code: '' }));
      }
    } catch (error: any) {
      if (error?.requiresVerification) {
        setStep('verify');
        setError(t('errors.emailNotVerified'));
        setLoading(false);
        return;
      }
      setError(error.message || t('errors.generic'));
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
              {mode === 'login' ? t('titles.login') : mode === 'signup' ? t('titles.signup') : t('titles.reset')}
            </h1>
            <p className="text-[var(--text-muted)] text-sm">
              {mode === 'login'
                ? t('subtitles.login')
                : mode === 'signup'
                  ? t('subtitles.signup')
                  : t('subtitles.reset')}
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          {notice && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && step === 'form' && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">{t('labels.fullName')}</label>
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
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">{t('labels.email')}</label>
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
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">{t('labels.phone')}</label>
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

            {(step === 'form' || step === 'reset-verify') && mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">{t('labels.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-[var(--border)] bg-[var(--surface-muted)] rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            {(mode === 'reset' && step === 'reset-verify') && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">{t('labels.newPassword')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-[var(--border)] bg-[var(--surface-muted)] rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            {(mode === 'signup' && step === 'form') || (mode === 'reset' && step === 'reset-verify') ? (
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
                  {mode === 'reset' ? t('labels.confirmNewPassword') : t('labels.confirmPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-[var(--border)] bg-[var(--surface-muted)] rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            ) : null}

            {step === 'verify' && (
              <div>
                <p className="text-sm text-[var(--text-muted)] mb-2">{t('labels.verifyHint')}</p>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">{t('labels.verificationCode')}</label>
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
                      setError(t('notices.verificationResent'));
                    } catch (err: any) {
                      setError(err.message || t('errors.resendFailed'));
                    }
                  }}
                  className="mt-2 text-yellow-600 hover:text-yellow-700 text-sm font-medium"
                >
                  {t('actions.resendCode')}
                </button>
              </div>
            )}

            {mode === 'reset' && step === 'reset-verify' && (
              <div>
                <p className="text-sm text-[var(--text-muted)] mb-2">{t('labels.resetHint')}</p>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">{t('labels.resetCode')}</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-3 border border-[var(--border)] bg-[var(--surface-muted)] rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter the code"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all disabled:opacity-50"
            >
              {loading
                ? common('loading')
                : step === 'verify'
                  ? t('actions.verifyEmail')
                  : mode === 'reset' && step === 'reset-request'
                    ? t('actions.sendResetCode')
                    : mode === 'reset' && step === 'reset-verify'
                      ? t('actions.resetPassword')
                      : mode === 'login'
                        ? t('actions.signIn')
                        : t('actions.createAccount')}
            </button>
          </form>

          {mode === 'login' && step === 'form' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={goToReset}
                className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
              >
                {t('actions.forgotPassword')}
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            {mode === 'reset' ? (
              <button
                type="button"
                onClick={goToLogin}
                className="text-yellow-600 hover:text-yellow-700 font-medium"
              >
                {t('actions.backToSignIn')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (mode === 'login') {
                    goToSignup();
                  } else {
                    goToLogin();
                  }
                }}
                className="text-yellow-600 hover:text-yellow-700 font-medium"
              >
                {mode === 'login' ? t('actions.switchToSignup') : t('actions.switchToLogin')}
              </button>
            )}
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-[var(--text-muted)]">
          <Link href="/" className="text-yellow-600 hover:text-yellow-700">{common('backToHome')}</Link>
        </div>
      </div>
    </div>
    </BackgroundImage>
  );
}
