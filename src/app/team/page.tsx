'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BackgroundImage from '@/components/BackgroundImage';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import type { MatchState, Profile, Team } from '@/types';
import { ShieldCheck, Users, Star } from 'lucide-react';

interface UnlockedMatch {
  matchId: string;
  state: MatchState;
  profile: Profile | null;
}

export default function TeamPage() {
  const { user, loading } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [unlocked, setUnlocked] = useState<UnlockedMatch[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<null | { verified: boolean; requestStatus: string | null }>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');

  const loadTeam = async () => {
    setStatus('loading');
    try {
      const [teamResponse, matchesResponse, verificationResponse] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/matches/unlocked'),
        fetch('/api/verification/status')
      ]);

      if (teamResponse.ok) {
        const teamData = (await teamResponse.json()) as { team: Team | null };
        setTeam(teamData.team);
      }

      if (matchesResponse.ok) {
        const matchData = (await matchesResponse.json()) as { matches: UnlockedMatch[] };
        setUnlocked(matchData.matches);
      }

      if (verificationResponse.ok) {
        const data = (await verificationResponse.json()) as { verified: boolean; requestStatus: string | null };
        setVerificationStatus({ verified: data.verified, requestStatus: data.requestStatus });
      }

      setStatus('idle');
    } catch (error) {
      console.error('Failed to load team info', error);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (user) {
      loadTeam();
    }
  }, [user]);

  const createTeam = async () => {
    await fetch('/api/teams', { method: 'POST' });
    loadTeam();
  };

  const inviteMatch = async (matchId: string) => {
    await fetch('/api/teams/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId })
    });
    loadTeam();
  };

  const lockTeam = async () => {
    await fetch('/api/teams/lock', { method: 'POST' });
    loadTeam();
  };

  const lockMatch = async (matchId: string) => {
    await fetch('/api/matches/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId })
    });
    loadTeam();
  };

  const requestVerification = async () => {
    await fetch('/api/verification/request', { method: 'POST' });
    loadTeam();
  };

  const requestAccompaniment = async (type: 'incubator' | 'accelerator' | 'platform', providerName?: string) => {
    await fetch('/api/accompaniment/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, providerName })
    });
    alert('Request submitted. Our team will contact you soon.');
  };

  if (loading) {
    return (
      <BackgroundImage imageIndex={5} overlay="gradient" overlayOpacity={0.75}>
        <div className="flex items-center justify-center">
          <div className="text-[var(--accent-strong)] text-xl">Loading...</div>
        </div>
      </BackgroundImage>
    );
  }

  if (!user) {
    return (
      <BackgroundImage imageIndex={5} overlay="gradient" overlayOpacity={0.75}>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--text)] mb-4">Please sign in to manage your team</h1>
            <Link href="/auth" className="text-yellow-600 hover:text-yellow-700">
              Go to Sign In
            </Link>
          </div>
        </div>
      </BackgroundImage>
    );
  }

  return (
    <BackgroundImage imageIndex={5} overlay="gradient" overlayOpacity={0.75}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-fade-up">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl text-white sm:text-4xl font-bold mb-2">
            Team <span className="text-yellow-500">Locking</span>
          </h1>
          <p className="text-gray-300">Create a team, invite unlocked matches, and lock your cofounder group.</p>
        </div>

        {status === 'error' && (
          <div className="text-red-500 mb-4">Unable to load team data.</div>
        )}

        {!team && (
          <div className="glass-card rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-2">Create your team</h2>
            <p className="text-[var(--text-muted)] mb-4">Teams can have up to 5 members.</p>
            <button
              onClick={createTeam}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
            >
              Create Team
            </button>
          </div>
        )}

        {team && (
          <div className="glass-card rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-yellow-500" />
                <h2 className="text-2xl font-bold">Your Team</h2>
              </div>
              <span className="bg-yellow-400/20 text-yellow-600 px-3 py-1 rounded-full text-sm font-bold capitalize">
                {team.status}
              </span>
            </div>
            <div className="space-y-3 text-[var(--text-muted)]">
              {team.memberIds.map(memberId => {
                const match = unlocked.find(item => item.profile?.userId === memberId);
                const name = memberId === user.id ? user.name : match?.profile?.name || 'Member (hidden)';
                return (
                  <div key={memberId} className="rounded-xl p-3 border border-[var(--border)] bg-[var(--surface-muted)]">
                    {name}
                  </div>
                );
              })}
            </div>
            {team.status === 'forming' && team.memberIds.length >= 2 && (
              <button
                onClick={lockTeam}
                className="mt-6 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
              >
                Lock Team
              </button>
            )}
          </div>
        )}

        {team?.status === 'forming' && (
          <div className="glass-card rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Invite unlocked matches</h2>
            {unlocked.length === 0 ? (
              <p className="text-[var(--text-muted)]">No unlocked matches yet. Unlock a match to invite them.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {unlocked.map(match => {
                  const alreadyMember = Boolean(match.profile?.userId && team.memberIds.includes(match.profile.userId));
                  return (
                  <div key={match.matchId} className="rounded-2xl p-5 border border-[var(--border)] bg-[var(--surface-muted)]">
                    <h3 className="text-lg font-bold text-[var(--text)]">{match.profile?.name || 'Hidden profile'}</h3>
                    <p className="text-[var(--text-muted)] capitalize">{match.profile?.role}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {match.profile?.skills.slice(0, 3).map(skill => (
                        <span key={skill} className="bg-yellow-400/20 text-yellow-600 px-3 py-1 rounded-full text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => inviteMatch(match.matchId)}
                        disabled={alreadyMember}
                        className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all disabled:opacity-60"
                      >
                        {alreadyMember ? 'Already in Team' : 'Invite to Team'}
                      </button>
                      <button
                        onClick={() => lockMatch(match.matchId)}
                        className="flex-1 bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[var(--text)] py-2 rounded-xl font-bold transition-all"
                      >
                        Lock 1:1
                      </button>
                    </div>
                  </div>
                );
                })}
              </div>
            )}
          </div>
        )}

        {team?.status === 'locked' && (
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="h-5 w-5 text-yellow-400" />
                <h2 className="text-2xl font-bold">Identity Verification (Optional)</h2>
              </div>
              <p className="text-[var(--text-muted)] mb-4">
                Verification is optional but helps build trust between cofounders.
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={requestVerification}
                  disabled={verificationStatus?.verified || verificationStatus?.requestStatus === 'pending'}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all disabled:opacity-60"
                >
                  Request Verification · 2,000 FCFA
                </button>
                {verificationStatus?.verified && (
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold">
                    Verified
                  </span>
                )}
                {verificationStatus?.requestStatus === 'pending' && (
                  <span className="bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold">
                    Pending
                  </span>
                )}
              </div>
              <p className="text-[var(--text-muted)] text-sm mt-4">
                The platform is not responsible for scams if verification is skipped.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Star className="h-5 w-5 text-yellow-400" />
                <h2 className="text-2xl font-bold">Startup Accompaniment</h2>
              </div>
              <p className="text-[var(--text-muted)] mb-6">
                Choose an incubator or accelerator, or request platform accompaniment.
              </p>
              <Link
                href="/accompaniment"
                className="inline-flex mb-6 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-5 py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
              >
                View Accompaniment Options
              </Link>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => requestAccompaniment('incubator', 'Silicon Savannah Hub')}
                  className="bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl p-4 text-left hover:border-yellow-500/40 transition-all"
                >
                  <p className="font-bold text-[var(--text)]">Silicon Savannah Hub</p>
                  <p className="text-sm text-[var(--text-muted)]">Incubator</p>
                </button>
                <button
                  onClick={() => requestAccompaniment('accelerator', 'Pan-Africa Launch')}
                  className="bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl p-4 text-left hover:border-yellow-500/40 transition-all"
                >
                  <p className="font-bold text-[var(--text)]">Pan-Africa Launch</p>
                  <p className="text-sm text-[var(--text-muted)]">Accelerator</p>
                </button>
                <button
                  onClick={() => requestAccompaniment('platform')}
                  className="bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl p-4 text-left hover:border-yellow-500/40 transition-all"
                >
                  <p className="font-bold text-[var(--text)]">Platform Accompaniment</p>
                  <p className="text-sm text-[var(--text-muted)]">Let the platform guide you</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BackgroundImage>
  );
}
