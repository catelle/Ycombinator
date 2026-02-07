'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BackgroundImage from '@/components/BackgroundImage';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import type { Profile, MatchState } from '@/types';
import { Shield } from 'lucide-react';

interface ConfirmedMatch {
  matchId: string;
  state: MatchState;
  score: number;
  profile: Profile | null;
}

export default function MatchesPage() {
  const { user, loading } = useAuth();
  const [matches, setMatches] = useState<ConfirmedMatch[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');

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

  if (loading) {
    return (
      <BackgroundImage imageIndex={4} overlay="dark" overlayOpacity={0.7}>
        <div className="flex items-center justify-center">
          <div className="text-[var(--accent-strong)] text-xl">Loading...</div>
        </div>
      </BackgroundImage>
    );
  }

  if (!user) {
    return (
      <BackgroundImage imageIndex={4} overlay="dark" overlayOpacity={0.7}>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--text)] mb-4">Please sign in to view matches</h1>
            <Link href="/auth" className="text-yellow-600 hover:text-yellow-700">
              Go to Sign In
            </Link>
          </div>
        </div>
      </BackgroundImage>
    );
  }

  return (
    <BackgroundImage imageIndex={4} overlay="dark" overlayOpacity={0.7}>
      <div className="fixed right-4 bottom-4 z-50 max-w-sm">
        <div className="glass-card rounded-2xl p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-yellow-600 mt-1" />
            <div>
              <p className="text-[var(--text)] font-semibold mb-1">
                Verification is optional but recommended.
              </p>
              <p className="text-[var(--text-muted)] text-sm">
                The platform is not responsible for scams if verification is skipped.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 animate-fade-up">


        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl text-white sm:text-4xl font-bold mb-2">
            Confirmed <span className="text-yellow-500">Matches</span>
          </h1>
          <p className="text-gray-300">Only matches validated by both founders and locked are shown here.</p>
        </div>

        {status === 'loading' && (
          <div className="text-yellow-500">Loading your matches...</div>
        )}

        {status === 'error' && (
          <div className="text-red-500">Unable to load matches.</div>
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
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] capitalize">{match.profile?.role || 'cofounder'}</p>
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
                  <span>{match.profile?.location || 'Remote'}</span>
                  <span className="capitalize">{match.profile?.commitment || 'exploring'}</span>
                </div>

                <div className="rounded-xl p-4 border border-[var(--border)] bg-[var(--surface-muted)]">
                  <p className="text-yellow-400 font-semibold mb-2">Contact Info</p>
                  <p>{match.profile?.contactEmail || 'No email provided'}</p>
                  <p>{match.profile?.contactPhone || 'No phone provided'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>

        {status === 'idle' && matches.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No confirmed matches yet. Review requests to accept and lock a match.
          </div>
        )}

       
      </div>
    </BackgroundImage>
  );
}
