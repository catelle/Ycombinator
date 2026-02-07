'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import SplashImage from '@/components/SplashImage';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import type { PublicProfile } from '@/types';
import BackgroundImage from '@/components/BackgroundImage';

interface MatchTestResult {
  score: number;
  reasons: string[];
  meetsThreshold: boolean;
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

export default function ProfileDetailPage() {
  const { user, loading } = useAuth();
  const params = useParams<{ id: string }>();
  const profileId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'error' | 'idle'>('loading');
  const [testResult, setTestResult] = useState<MatchTestResult | null>(null);
  const [message, setMessage] = useState<string>('');
  const [requesting, setRequesting] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
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

  const handleTestMatch = async () => {
    setMessage('');
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
          setToast('Complete your profile first to test match compatibility.');
          setTimeout(() => setToast(''), 3000);
          return;
        }
        setMessage(data.error || 'Unable to calculate match score.');
        return;
      }
      const data = (await response.json()) as MatchTestResult;
      setTestResult(data);
    } catch (error) {
      console.error('Failed to test match', error);
      setMessage('Unable to calculate match score.');
    }
  };

  const handleRequestMatch = async () => {
    if (!profileId) return;
    setRequesting(true);
    setMessage('');
    try {
      const response = await fetch('/api/match-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId })
      });

      const data = (await response.json()) as { error?: string; code?: string; upgradePrice?: number };
      if (!response.ok) {
        if (data.code === 'MATCH_LIMIT') {
          setMessage(`Match limit reached. Upgrade for ${data.upgradePrice ?? ''} FCFA to request more matches.`);
        } else if (data.code === 'REQUEST_EXISTS') {
          setMessage('You already have a request with this founder.');
        } else {
          setMessage(data.error || 'Unable to send request.');
        }
        return;
      }

      setMessage('Match request sent. You can track it in Requests.');
    } catch (error) {
      console.error('Failed to request match', error);
      setMessage('Unable to send request.');
    } finally {
      setRequesting(false);
    }
  };

  const handleUpgradeLimit = async () => {
    setUpgrading(true);
    setMessage('');
    try {
      const response = await fetch('/api/match-limit/upgrade', { method: 'POST' });
      const data = (await response.json()) as { paymentUrl?: string; error?: string };
      if (!response.ok || !data.paymentUrl) {
        setMessage(data.error || 'Unable to start upgrade payment.');
        return;
      }
      window.location.href = data.paymentUrl;
    } catch (error) {
      console.error('Failed to upgrade limit', error);
      setMessage('Unable to start upgrade payment.');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--accent-strong)] text-xl">Loading...</div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--accent-strong)] text-xl">Loading profile...</div>
      </div>
    );
  }

  if (status === 'error' || !profile) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text)] mb-4">Profile not available</h1>
          <Link href="/profiles" className="text-yellow-600 hover:text-yellow-700">
            Back to Profiles
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
              <h1 className="text-3xl font-bold">{pickFrom(profile.id, USERNAMES)}</h1>
              <p className="text-[var(--text-muted)] capitalize">{profile.role}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Startup Focus</h2>
            <p className="text-[var(--text-muted)]">{profile.interests}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Skills</h2>
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
              <h2 className="text-lg font-semibold mb-2">Languages</h2>
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
              <h2 className="text-lg font-semibold mb-2">Achievements</h2>
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
            <span className="capitalize">{profile.commitment}</span>
            <span>{profile.location}</span>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-[var(--border)]">
            <p className="text-sm text-[var(--text-muted)] mb-2">
              Identity and contact details are hidden until both founders accept and complete payment.
            </p>
            {user ? (
              <button
                onClick={handleTestMatch}
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-5 py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
              >
                Test Match Compatibility
              </button>
            ) : (
              <Link
                href="/auth"
                className="inline-flex bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-5 py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
              >
                Sign in to Test Match
              </Link>
            )}
          </div>

          {testResult && (
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">Compatibility Score</p>
                <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
                  {testResult.score}%
                </span>
              </div>
              <ul className="mt-3 text-sm text-[var(--text-muted)]">
                {testResult.reasons.map(reason => (
                  <li key={reason}>• {reason}</li>
                ))}
              </ul>
              {testResult.meetsThreshold && (
                <button
                  onClick={handleRequestMatch}
                  disabled={requesting}
                  className="mt-4 w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all disabled:opacity-60"
                >
                  {requesting ? 'Sending Request...' : 'Request Match'}
                </button>
              )}
              {!testResult.meetsThreshold && (
                <p className="text-sm text-[var(--text-muted)] mt-3">
                  Match request unlocks only for scores above the minimum threshold.
                </p>
              )}
            </div>
          )}

          {message && (
            <div className="text-sm text-[var(--text-muted)]">
              {message}
            </div>
          )}

          {message.includes('Match limit reached') && (
            <button
              onClick={handleUpgradeLimit}
              disabled={upgrading}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-5 py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all disabled:opacity-60"
            >
              {upgrading ? 'Redirecting...' : 'Upgrade Match Limit'}
            </button>
          )}
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="glass-card rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--text)] shadow-lg">
            {toast}{' '}
            <Link href="/profile" className="text-yellow-500 hover:text-yellow-400 ml-2">
              Update profile
            </Link>
          </div>
        </div>
      )}
    </div>
        </BackgroundImage>
  );
}
