'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import SplashImage from '@/components/SplashImage';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import type { PublicProfile } from '@/types';
import BackgroundImage from '@/components/BackgroundImage';
import { useTranslations } from 'next-intl';

interface MatchTestResult {
  score: number;
  reasons: string[];
  meetsThreshold: boolean;
  threshold?: number;
}

interface RequestSummary {
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled' | 'matched';
  profile: { id: string };
}

const AVATARS = [
  '/images/avatars/anon-1.svg',
  '/images/avatars/anon-2.svg',
  '/images/avatars/anon-3.svg',
  '/images/avatars/anon-4.svg',
  '/images/avatars/anon-5.svg',
  '/images/avatars/anon-6.svg'
];

const USERNAMES = [
  'Stealth Founder',
  'Vision Builder',
  'Growth Architect',
  'Product Alchemist',
  'Market Explorer',
  'Idea Navigator',
  'Startup Spark',
  'Dream Executor'
];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const pickFrom = (value: string, list: string[]) => list[hashString(value) % list.length];
const getDisplayName = (profile: PublicProfile) => profile.alias?.trim() || pickFrom(profile.id, USERNAMES);

export default function ProfileDetailPage() {
  const t = useTranslations('profileDetail');
  const common = useTranslations('common');
  const { user, loading } = useAuth();
  const params = useParams<{ id: string }>();
  const profileId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'error' | 'idle'>('loading');
  const [testResult, setTestResult] = useState<MatchTestResult | null>(null);
  const [message, setMessage] = useState<string>('');
  const [requesting, setRequesting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(`/api/profiles/${profileId}`);
        if (!response.ok) {
          setStatus('error');
          return;
        }
        const data = (await response.json()) as { profile: PublicProfile };
        setProfile(data.profile);
        setStatus('idle');
      } catch (error) {
        console.error('Failed to load profile', error);
        setStatus('error');
      }
    };

    if (profileId) {
      loadProfile();
    }
  }, [profileId]);

  useEffect(() => {
    const loadRequestStatus = async () => {
      if (!user || !profileId) {
        setPendingRequest(false);
        return;
      }
      try {
        const response = await fetch('/api/match-requests');
        if (!response.ok) return;
        const data = (await response.json()) as { outgoing?: RequestSummary[] };
        const isPending = (data.outgoing || []).some(
          request => request.profile?.id === profileId && request.status === 'pending'
        );
        setPendingRequest(isPending);
      } catch (error) {
        console.error('Failed to load request status', error);
      }
    };

    loadRequestStatus();
  }, [user, profileId]);

  const handleTestMatch = async () => {
    setMessage('');
    setShowUpgrade(false);
    setTestResult(null);
    try {
      const response = await fetch('/api/match-requests/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId })
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string; code?: string };
        if (data.code === 'PROFILE_INCOMPLETE') {
          setToast(t('toast.completeProfile'));
          setTimeout(() => setToast(''), 3000);
          return;
        }
        setMessage(data.error || t('errors.calculateMatch'));
        return;
      }
      const data = (await response.json()) as MatchTestResult;
      setTestResult(data);
    } catch (error) {
      console.error('Failed to test match', error);
      setMessage(t('errors.calculateMatch'));
    }
  };

  const handleRequestMatch = async () => {
    if (!profileId) return;
    if (pendingRequest) {
      setMessage(t('errors.requestPending'));
      return;
    }
    setRequesting(true);
    setMessage('');
    setShowUpgrade(false);
    try {
      const response = await fetch('/api/match-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId })
      });

      const data = (await response.json()) as { error?: string; code?: string; upgradePrice?: number; threshold?: number; limit?: number };
      if (!response.ok) {
        if (data.code === 'MATCH_LIMIT') {
          setMessage(t('errors.matchLimit', { price: data.upgradePrice ?? '' }));
          setShowUpgrade(true);
        } else if (data.code === 'REQUEST_EXISTS') {
          setMessage(t('errors.requestExists'));
        } else if (data.code === 'DAILY_LIMIT') {
          setMessage(t('errors.dailyLimit', { limit: data.limit ?? 2 }));
        } else if (data.code === 'LOW_SCORE') {
          setMessage(t('errors.lowScore', { threshold: data.threshold ?? '' }));
        } else {
          setMessage(data.error || t('errors.requestFailed'));
        }
        return;
      }

      setMessage(t('messages.requestSent'));
      setPendingRequest(true);
    } catch (error) {
      console.error('Failed to request match', error);
      setMessage(t('errors.requestFailed'));
    } finally {
      setRequesting(false);
    }
  };

  const handleUpgradeLimit = async () => {
    setUpgrading(true);
    setMessage('');
    setShowUpgrade(false);
    try {
      const response = await fetch('/api/match-limit/upgrade', { method: 'POST' });
      const data = (await response.json()) as { paymentUrl?: string; error?: string };
      if (!response.ok || !data.paymentUrl) {
        setMessage(data.error || t('errors.upgradeFailed'));
        return;
      }
      window.location.href = data.paymentUrl;
    } catch (error) {
      console.error('Failed to upgrade limit', error);
      setMessage(t('errors.upgradeFailed'));
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--accent-strong)] text-xl">{common('loading')}</div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--accent-strong)] text-xl">{t('loadingProfile')}</div>
      </div>
    );
  }

  if (status === 'error' || !profile) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text)] mb-4">{t('notAvailable')}</h1>
          <Link href="/profiles" className="text-yellow-600 hover:text-yellow-700">
            {t('backToProfiles')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <BackgroundImage imageIndex={2} overlay="gradient" overlayOpacity={0.8}>
      <div className="min-h-screen text-[var(--text)] relative overflow-hidden">
        {/* <SplashImage
        index={4}
        size={360}
        className="absolute -top-24 -left-24 w-[360px] h-[360px] opacity-60 pointer-events-none"
      /> */}
        <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-up relative">
          <div className="glass-card rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <Image
                src={pickFrom(profile.id, AVATARS)}
                alt="Anonymous avatar"
                width={72}
                height={72}
                className="rounded-full border border-[var(--border)]"
              />
              <div>
              <h1 className="text-3xl font-bold">{getDisplayName(profile)}</h1>
              <p className="text-[var(--text-muted)] capitalize">{common(`roles.${profile.role}`)}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">{t('startupFocus')}</h2>
            <p className="text-[var(--text-muted)]">{profile.interests}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">{t('skills')}</h2>
            <div className="flex flex-wrap gap-2">
                {profile.skills.map(skill => (
                  <span key={skill} className="bg-yellow-400/20 text-yellow-600 px-3 py-1 rounded-full text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

          {profile.languages.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">{t('languages')}</h2>
              <div className="flex flex-wrap gap-2">
                  {profile.languages.map(language => (
                    <span key={language} className="bg-yellow-400/20 text-yellow-600 px-3 py-1 rounded-full text-xs font-medium">
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {profile.achievements.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">{t('achievements')}</h2>
              <div className="flex flex-wrap gap-2">
                  {profile.achievements.map(achievement => (
                    <span key={achievement} className="bg-yellow-400/20 text-yellow-600 px-3 py-1 rounded-full text-xs font-medium">
                      {achievement}
                    </span>
                  ))}
                </div>
              </div>
            )}

          <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
            <span className="capitalize">{common(`commitment.${profile.commitment}`)}</span>
            <span>{profile.location}</span>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-[var(--border)]">
            <p className="text-sm text-[var(--text-muted)] mb-2">
              {t('privacyNote')}
            </p>
            {user ? (
              <button
                onClick={handleTestMatch}
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-5 py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
              >
                {t('actions.testMatch')}
              </button>
            ) : (
              <Link
                href="/auth"
                className="inline-flex bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-5 py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
              >
                {t('actions.signInToTest')}
              </Link>
            )}
          </div>

            {testResult && (
              <div className="glass-card rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold">{t('compatibilityScore')}</p>
                  <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
                    {testResult.score}%
                  </span>
                </div>
                <ul className="mt-3 text-sm text-[var(--text-muted)]">
                  {testResult.reasons.map(reason => (
                    <li key={reason}>• {reason}</li>
                  ))}
                </ul>
                <button
                  onClick={handleRequestMatch}
                  disabled={requesting || !testResult.meetsThreshold || pendingRequest}
                  className="
    mt-4 w-full 
    bg-black 
    hover:bg-black 
    active:bg-black
    text-yellow-600 
    py-2 
    rounded-xl 
    font-bold 
    transition-all 
    disabled:opacity-60
  "              >
                  {pendingRequest ? t('actions.requestPending') : requesting ? t('actions.sendingRequest') : t('actions.requestMatch')}
                </button>
                {!testResult.meetsThreshold && (
                  <p className="text-sm text-[var(--text-muted)] mt-3">
                    {t('threshold', { threshold: testResult.threshold ?? '' })}
                  </p>
                )}
                {pendingRequest && (
                  <p className="text-sm text-[var(--text-muted)] mt-3">
                    {t('pendingHint')}
                  </p>
                )}
              </div>
            )}

            {message && (
              <div className="text-sm text-[var(--text-muted)]">
                {message}
              </div>
            )}

          {showUpgrade && (
            <button
              onClick={handleUpgradeLimit}
              disabled={upgrading}
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-5 py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all disabled:opacity-60"
              >
                {upgrading ? t('actions.redirecting') : t('actions.upgradeLimit')}
              </button>
            )}
          </div>
        </div>
        {toast && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="glass-card rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--text)] shadow-lg">
              {toast}{' '}
              <Link href="/profile" className="text-yellow-500 hover:text-yellow-400 ml-2">
                {t('actions.updateProfile')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </BackgroundImage>
  );
}
