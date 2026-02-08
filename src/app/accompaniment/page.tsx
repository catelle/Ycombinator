'use client';

import { useState } from 'react';
import Link from 'next/link';
import SplashImage from '@/components/SplashImage';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import { useTranslations } from 'next-intl';

const LOCAL_PROGRAMS = [
  { name: 'Silicon Savannah Hub', type: 'incubator', region: 'East Africa' },
  { name: 'Douala Founder Lab', type: 'incubator', region: 'Cameroon' },
  { name: 'Yaoundé Growth Studio', type: 'accelerator', region: 'Cameroon' },
  { name: 'Pan-Africa Launch', type: 'accelerator', region: 'Africa-wide' }
] as const;

export default function AccompanimentPage() {
  const t = useTranslations('accompaniment');
  const { user } = useAuth();
  const [message, setMessage] = useState('');

  const requestAccompaniment = async (type: 'incubator' | 'accelerator' | 'platform', providerName?: string) => {
    setMessage('');
    try {
      const response = await fetch('/api/accompaniment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, providerName })
      });

      if (!response.ok) {
        setMessage(t('errors.signInRequired'));
        return;
      }

      setMessage(t('messages.requestSubmitted'));
    } catch (error) {
      console.error('Failed to request accompaniment', error);
      setMessage(t('errors.submitFailed'));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)] relative overflow-hidden">
      <SplashImage
        index={1}
        size={420}
        className="absolute -top-24 -right-24 w-[420px] h-[420px] opacity-60 pointer-events-none"
      />
      <SplashImage
        index={3}
        size={360}
        className="absolute -bottom-24 -left-24 w-[360px] h-[360px] opacity-40 pointer-events-none"
      />

      <div className="max-w-6xl mx-auto px-4 py-10 animate-fade-up relative">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {t('title')} <span className="text-yellow-500">{t('titleHighlight')}</span>
            </h1>
            <p className="text-[var(--text-muted)]">
              {t('subtitle')}
            </p>
          </div>
          <Link href="/team" className="text-yellow-600 hover:text-yellow-700">
            {t('backToTeam')}
          </Link>
        </div>

        {message && <div className="text-sm text-[var(--text-muted)] mb-6">{message}</div>}

        <section className="glass-card rounded-3xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">{t('local.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LOCAL_PROGRAMS.map(program => (
              <div key={program.name} className="border border-[var(--border)] rounded-2xl p-4 bg-[var(--surface-muted)]">
                <p className="text-lg font-bold text-[var(--text)]">{program.name}</p>
                <p className="text-sm text-[var(--text-muted)]">{t(`local.types.${program.type}`)} · {program.region}</p>
                <button
                  onClick={() => requestAccompaniment(program.type, program.name)}
                  className="mt-4 w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
                >
                  {t('actions.requestProgram')}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-3xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">{t('platform.title')}</h2>
          <p className="text-[var(--text-muted)] mb-4">
            {t('platform.subtitle')}
          </p>
          <button
            onClick={() => requestAccompaniment('platform')}
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
          >
            {t('actions.requestPlatform')}
          </button>
          {!user && (
            <p className="text-xs text-[var(--text-muted)] mt-3">{t('platform.signInHint')}</p>
          )}
        </section>

        <section className="glass-card rounded-3xl p-6">
          <h2 className="text-2xl font-bold mb-4">{t('monetization.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-[var(--border)] rounded-2xl p-4 bg-[var(--surface-muted)]">
              <p className="text-lg font-bold">{t('monetization.fixed.title')}</p>
              <p className="text-sm text-[var(--text-muted)] mt-2">{t('monetization.fixed.detail')}</p>
            </div>
            <div className="border border-[var(--border)] rounded-2xl p-4 bg-[var(--surface-muted)]">
              <p className="text-lg font-bold">{t('monetization.revenue.title')}</p>
              <p className="text-sm text-[var(--text-muted)] mt-2">{t('monetization.revenue.detail')}</p>
            </div>
            <div className="border border-[var(--border)] rounded-2xl p-4 bg-[var(--surface-muted)]">
              <p className="text-lg font-bold">{t('monetization.subscription.title')}</p>
              <p className="text-sm text-[var(--text-muted)] mt-2">{t('monetization.subscription.detail')}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
