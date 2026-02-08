'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BackgroundImage from '@/components/BackgroundImage';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import type { Profile, MatchState } from '@/types';
import { Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ConfirmedMatch {
  matchId: string;
  state: MatchState;
  score: number;
  profile: Profile | null;
}

export default function MatchesPage() {
  const t = useTranslations('matches');
  const common = useTranslations('common');
  const { user, loading } = useAuth();
  const [matches, setMatches] = useState<ConfirmedMatch[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const loadMatches = async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/matches/confirmed');
      if (!response.ok) {
        setStatus('error');
        return;
      }
      const data = (await response.json()) as { matches: ConfirmedMatch[] };
      setMatches(data.matches);
      setStatus('idle');
    } catch (error) {
      console.error('Failed to load matches', error);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (user) {
      loadMatches();
    }
  }, [user]);

  const handleCancelRequest = async (matchId: string) => {
    const reason = window.prompt(t('cancellation.prompt'));
    if (reason === null) return;
    if (reason.trim().length < 6) {
      setMessage(t('cancellation.reasonTooShort'));
      return;
    }
    try {
      const response = await fetch('/api/match-cancellations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, reason })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(data.error || t('cancellation.failed'));
        return;
      }
      setMessage(t('cancellation.sent'));
    } catch (error) {
      console.error('Failed to request cancellation', error);
      setMessage(t('cancellation.failed'));
    }
  };

  if (loading) {
    return (
      <BackgroundImage imageIndex={4} overlay="dark" overlayOpacity={0.7}>
        <div className="flex items-center justify-center">
          <div className="text-[var(--accent-strong)] text-xl">{common('loading')}</div>
        </div>
      </BackgroundImage>
    );
  }

  if (!user) {
    return (
      <BackgroundImage imageIndex={4} overlay="dark" overlayOpacity={0.7}>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--text)] mb-4">{t('signInTitle')}</h1>
            <Link href="/auth" className="text-yellow-600 hover:text-yellow-700">
              {common('goToSignIn')}
            </Link>
          </div>
        </div>
      </BackgroundImage>
    );
  }

  return (
    <BackgroundImage imageIndex={4} overlay="dark" overlayOpacity={0.7}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-fade-up">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            {t('title')} <span className="text-yellow-500">{t('titleHighlight')}</span>
          </h1>
          <p className="text-[var(--text-muted)]">{t('subtitle')}</p>
        </div>

        {message && <div className="text-sm text-[var(--text-muted)] mb-4">{message}</div>}

        {status === 'loading' && (
          <div className="text-yellow-500">{t('loading')}</div>
        )}

        {status === 'error' && (
          <div className="text-red-500">{t('error')}</div>
        )}

        <div className="scrollable-list">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          {matches.map(match => (
            <div
              key={match.matchId}
              className="glass-card rounded-2xl overflow-hidden hover:-translate-y-1 transition-all"
            >
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-[var(--text)]">
                      {match.profile?.name || 'Founder'}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] capitalize">
                      {match.profile?.role ? common(`roles.${match.profile.role}`) : t('fallbackRole')}
                    </p>
                  </div>
                  <div className="bg-yellow-400 text-black px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold">
                    {match.score}%
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {match.profile?.skills?.slice(0, 4).map(skill => (
                    <span key={skill} className="bg-yellow-400/20 text-yellow-600 px-3 py-1 rounded-full text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>

                <p className="text-[var(--text-muted)] text-sm line-clamp-3">{match.profile?.interests || ''}</p>

                <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
                  <span>{match.profile?.location || t('fallbackLocation')}</span>
                  <span className="capitalize">
                    {match.profile?.commitment ? common(`commitment.${match.profile.commitment}`) : t('fallbackCommitment')}
                  </span>
                </div>

                <div className="rounded-xl p-4 border border-[var(--border)] bg-[var(--surface-muted)]">
                  <p className="text-yellow-400 font-semibold mb-2">{t('contactInfo')}</p>
                  <p>{match.profile?.contactEmail || t('noEmail')}</p>
                  <p>{match.profile?.contactPhone || t('noPhone')}</p>
                </div>

                <button
                  onClick={() => handleCancelRequest(match.matchId)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-bold transition-all"
                >
                  {t('cancellation.request')}
                </button>
              </div>
            </div>
          ))}
        </div>
        </div>

        {status === 'idle' && matches.length === 0 && (
          <div className="text-center text-[var(--text-muted)] mt-8">
            {t('empty')}
          </div>
        )}

        <div className="glass-card rounded-2xl p-4 sm:p-6 mt-8">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-yellow-500 mt-1" />
            <div>
              <p className="text-[var(--text)] font-semibold mb-1">
                {t('verification.title')}
              </p>
              <p className="text-[var(--text-muted)] text-sm">
                {t('verification.disclaimer')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </BackgroundImage>
  );
}
