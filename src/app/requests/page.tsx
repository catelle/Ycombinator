'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BackgroundImage from '@/components/BackgroundImage';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import type { PublicProfile, Match, Profile } from '@/types';

interface RequestView {
  id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled' | 'matched';
  score: number;
  createdAt: string;
  expiresAt: string;
  profile: PublicProfile;
  currentUserPaid: boolean;
  otherUserPaid: boolean;
}

interface UnlockedMatch {
  matchId: string;
  state: Match['state'];
  profile: Profile | null;
}

export default function RequestsPage() {
  const { user, loading } = useAuth();
  const [incoming, setIncoming] = useState<RequestView[]>([]);
  const [outgoing, setOutgoing] = useState<RequestView[]>([]);
  const [unlocked, setUnlocked] = useState<UnlockedMatch[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'idle'>('loading');
  const [message, setMessage] = useState('');
  const [upgrading, setUpgrading] = useState(false);

  const loadRequests = async () => {
    try {
      const response = await fetch('/api/match-requests');
      if (!response.ok) {
        setStatus('error');
        return;
      }
      const data = (await response.json()) as { incoming: RequestView[]; outgoing: RequestView[] };
      setIncoming(data.incoming);
      setOutgoing(data.outgoing);
      setStatus('idle');
    } catch (error) {
      console.error('Failed to load requests', error);
      setStatus('error');
    }
  };

  const loadUnlocked = async () => {
    try {
      const response = await fetch('/api/matches/unlocked');
      if (!response.ok) return;
      const data = (await response.json()) as { matches: UnlockedMatch[] };
      setUnlocked(data.matches);
    } catch (error) {
      console.error('Failed to load unlocked matches', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadRequests();
      loadUnlocked();
    }
  }, [user]);

  const handleRespond = async (requestId: string, decision: 'accepted' | 'declined') => {
    setMessage('');
    const response = await fetch('/api/match-requests/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, decision })
    });

    const data = (await response.json()) as { error?: string; code?: string; upgradePrice?: number };
    if (!response.ok) {
      if (data.code === 'MATCH_LIMIT') {
        setMessage(`Match limit reached. Upgrade for ${data.upgradePrice ?? ''} FCFA to accept more matches.`);
      } else {
        setMessage(data.error || 'Unable to respond to request.');
      }
      return;
    }

    await loadRequests();
  };

  const handlePay = async (requestId: string) => {
    setMessage('');
    const response = await fetch('/api/match-requests/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId })
    });

    const data = (await response.json()) as { paymentUrl?: string; error?: string; code?: string; upgradePrice?: number };
    if (!response.ok || !data.paymentUrl) {
      if (data.code === 'MATCH_LIMIT') {
        setMessage(`Match limit reached. Upgrade for ${data.upgradePrice ?? ''} FCFA to pay for more matches.`);
      } else {
        setMessage(data.error || 'Unable to start payment.');
      }
      return;
    }

    window.location.href = data.paymentUrl;
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
      <BackgroundImage imageIndex={2} overlay="dark" overlayOpacity={0.8}>
        <div className="flex items-center justify-center">
          <div className="text-[var(--accent-strong)] text-xl">Loading...</div>
        </div>
      </BackgroundImage>
    );
  }

  if (!user) {
    return (
      <BackgroundImage imageIndex={2} overlay="dark" overlayOpacity={0.8}>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--text)] mb-4">Please sign in to manage requests</h1>
            <Link href="/auth" className="text-yellow-600 hover:text-yellow-700">
              Go to Sign In
            </Link>
          </div>
        </div>
      </BackgroundImage>
    );
  }

  return (
    <BackgroundImage imageIndex={2} overlay="dark" overlayOpacity={0.8}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-fade-up">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl text-white sm:text-4xl font-bold mb-2">
            Match <span className="text-yellow-500">Requests</span>
          </h1>
          <p className="text-gray-500">Requests expire after 3 days if there is no response.</p>
        </div>

        {message && (
          <div className="text-sm text-gray-500 mb-4">
            {message}
            {message.includes('Match limit reached') && (
              <button
                onClick={handleUpgradeLimit}
                disabled={upgrading}
                className="ml-3 inline-flex bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-4 py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all disabled:opacity-60"
              >
                {upgrading ? 'Redirecting...' : 'Upgrade Limit'}
              </button>
            )}
          </div>
        )}

        {status === 'loading' && <div className="text-yellow-500">Loading requests...</div>}
        {status === 'error' && <div className="text-red-500">Unable to load requests.</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <section className="space-y-3 sm:space-y-4">
            <h2 className="text-lg text-white sm:text-xl font-semibold">Incoming Requests</h2>
            <div className="scrollable-list space-y-3 sm:space-y-4">
            {incoming.map(request => (
              <div key={request.id} className="glass-card rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Image
                    src="/images/anon-avatar.svg"
                    alt="Anonymous avatar"
                    width={48}
                    height={48}
                    className="rounded-full border border-[var(--border)]"
                  />
                  <div>
                    <p className="font-semibold">Anonymous Founder</p>
                    <p className="text-sm text-[var(--text-muted)] capitalize">{request.profile.role}</p>
                  </div>
                  <span className="ml-auto bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold">
                    {request.score}%
                  </span>
                </div>
                <p className="text-sm text-[var(--text-muted)] line-clamp-2">{request.profile.interests}</p>
                <div className="flex flex-wrap gap-2">
                  {request.profile.skills.slice(0, 3).map(skill => (
                    <span key={skill} className="bg-yellow-400/20 text-yellow-600 px-2 py-1 rounded-full text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-[var(--text-muted)]">Status: {request.status}</div>
                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespond(request.id, 'accepted')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-bold transition-all"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespond(request.id, 'declined')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-bold transition-all"
                    >
                      Decline
                    </button>
                  </div>
                )}
                {request.status === 'accepted' && !request.currentUserPaid && (
                  <button
                    onClick={() => handlePay(request.id)}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
                  >
                    Pay 500 FCFA to Unlock
                  </button>
                )}
                {request.status === 'accepted' && request.currentUserPaid && (
                  <p className="text-xs text-[var(--text-muted)]">
                    Waiting for the other founder to complete payment.
                  </p>
                )}
              </div>
            ))}
            </div>
            {status === 'idle' && incoming.length === 0 && (
              <div className="text-sm text-[var(--text-muted)]">No incoming requests yet.</div>
            )}
          </section>

          <section className="space-y-3 sm:space-y-4">
            <h2 className="text-lg text-white sm:text-xl font-semibold">Outgoing Requests</h2>
            <div className="scrollable-list space-y-3 sm:space-y-4">
            {outgoing.map(request => (
              <div key={request.id} className="glass-card rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Image
                    src="/images/anon-avatar.svg"
                    alt="Anonymous avatar"
                    width={48}
                    height={48}
                    className="rounded-full border border-[var(--border)]"
                  />
                  <div>
                    <p className="font-semibold">Anonymous Founder</p>
                    <p className="text-sm text-[var(--text-muted)] capitalize">{request.profile.role}</p>
                  </div>
                  <span className="ml-auto bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold">
                    {request.score}%
                  </span>
                </div>
                <p className="text-sm text-[var(--text-muted)] line-clamp-2">{request.profile.interests}</p>
                <div className="flex flex-wrap gap-2">
                  {request.profile.skills.slice(0, 3).map(skill => (
                    <span key={skill} className="bg-yellow-400/20 text-yellow-600 px-2 py-1 rounded-full text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-[var(--text-muted)]">Status: {request.status}</div>
                {request.status === 'accepted' && !request.currentUserPaid && (
                  <button
                    onClick={() => handlePay(request.id)}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
                  >
                    Pay 500 FCFA to Unlock
                  </button>
                )}
                {request.status === 'accepted' && request.currentUserPaid && (
                  <p className="text-xs text-[var(--text-muted)]">
                    Waiting for the other founder to complete payment.
                  </p>
                )}
              </div>
            ))}
            </div>
            {status === 'idle' && outgoing.length === 0 && (
              <div className="text-sm text-[var(--text-muted)]">No outgoing requests yet.</div>
            )}
          </section>
        </div>

        <section className="mt-10">
          <h2 className="text-xl text-white font-semibold mb-4">Unlocked Matches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {unlocked.map(match => (
              <div key={match.matchId} className="glass-card rounded-2xl p-6">
                <p className="text-sm text-[var(--text-muted)] mb-2">Match status: {match.state}</p>
                {match.profile ? (
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">{match.profile.name}</p>
                    <p className="text-sm text-[var(--text-muted)] capitalize">{match.profile.role}</p>
                    <p className="text-sm">{match.profile.contactEmail || 'No email provided'}</p>
                    <p className="text-sm">{match.profile.contactPhone || 'No phone provided'}</p>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">Profile not available.</p>
                )}
              </div>
            ))}
            {unlocked.length === 0 && (
              <div className="text-sm text-[var(--text-muted)]">No unlocked matches yet.</div>
            )}
          </div>
        </section>

        {/* <div className="glass-card rounded-2xl p-6 mt-10">
          <p className="text-[var(--text)] font-semibold mb-1">Verification is optional but recommended.</p>
          <p className="text-[var(--text-muted)] text-sm">
            The platform is not responsible for scams if verification is skipped.
          </p>
        </div> */}
      </div>
    </BackgroundImage>
  );
}
