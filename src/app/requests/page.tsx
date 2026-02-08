'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BackgroundImage from '@/components/BackgroundImage';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import type { PublicProfile, Match, Profile } from '@/types';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

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

interface CancellationView {
  id: string;
  status: 'pending' | 'accepted' | 'declined' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
  matchId: string;
  reason: string;
  response?: string;
  profile: PublicProfile;
}

const getDisplayName = (profile: PublicProfile) => profile.alias?.trim() || 'Anonymous Founder';

export default function RequestsPage() {
  const t = useTranslations('requests');
  const common = useTranslations('common');
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'requests' | 'unlocked' | 'cancellations'>('requests');
  const [incoming, setIncoming] = useState<RequestView[]>([]);
  const [outgoing, setOutgoing] = useState<RequestView[]>([]);
  const [unlocked, setUnlocked] = useState<UnlockedMatch[]>([]);
  const [cancelIncoming, setCancelIncoming] = useState<CancellationView[]>([]);
  const [cancelOutgoing, setCancelOutgoing] = useState<CancellationView[]>([]);
  const [cancelResponses, setCancelResponses] = useState<Record<string, string>>({});
  const [cancelStatus, setCancelStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [cancelMessage, setCancelMessage] = useState('');
  const [status, setStatus] = useState<'loading' | 'error' | 'idle'>('loading');
  const [message, setMessage] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

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
      loadCancellations();
    }
  }, [user]);

  const loadCancellations = async () => {
    setCancelStatus('loading');
    try {
      const response = await fetch('/api/match-cancellations');
      if (!response.ok) {
        setCancelStatus('error');
        return;
      }
      const data = (await response.json()) as { incoming: CancellationView[]; outgoing: CancellationView[] };
      setCancelIncoming(data.incoming);
      setCancelOutgoing(data.outgoing);
      setCancelStatus('idle');
    } catch (error) {
      console.error('Failed to load cancellations', error);
      setCancelStatus('error');
    }
  };

  const handleRespond = async (requestId: string, decision: 'accepted' | 'declined') => {
    setMessage('');
    setShowUpgrade(false);
    const response = await fetch('/api/match-requests/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, decision })
    });

    const data = (await response.json()) as { error?: string; code?: string; upgradePrice?: number };
    if (!response.ok) {
      if (data.code === 'MATCH_LIMIT') {
        setMessage(t('errors.matchLimitAccept', { price: data.upgradePrice ?? '' }));
        setShowUpgrade(true);
      } else {
        setMessage(data.error || t('errors.respondFailed'));
      }
      return;
    }

    await loadRequests();
  };

  const handleNavigate = (profileId: string) => (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;
    router.push(`/profiles/${profileId}`);
  };

  const handlePay = async (requestId: string) => {
    setMessage('');
    setShowUpgrade(false);
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setMessage(t('errors.network'));
      return;
    }
    try {
      const response = await fetch('/api/match-requests/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });

      const data = (await response.json()) as { paymentUrl?: string; error?: string; code?: string; upgradePrice?: number };
      if (!response.ok || !data.paymentUrl) {
        if (data.code === 'MATCH_LIMIT') {
          setMessage(t('errors.matchLimitPay', { price: data.upgradePrice ?? '' }));
          setShowUpgrade(true);
        } else {
          setMessage(data.error || t('errors.paymentFailed'));
        }
        return;
      }

      window.location.href = data.paymentUrl;
    } catch (error) {
      console.error('Failed to start payment', error);
      setMessage(t('errors.network'));
    }
  };

  const handleUpgradeLimit = async () => {
    setUpgrading(true);
    setMessage('');
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

  const handleCancelRespond = async (requestId: string, decision: 'accepted' | 'declined') => {
    setCancelMessage('');
    const response = await fetch('/api/match-cancellations/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, decision, response: cancelResponses[requestId] || '' })
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setCancelMessage(data.error || t('cancellations.errors.respondFailed'));
      return;
    }
    await loadCancellations();
  };

  if (loading) {
    return (
      <BackgroundImage imageIndex={2} overlay="dark" overlayOpacity={0.8}>
        <div className="flex items-center justify-center">
          <div className="text-[var(--accent-strong)] text-xl">{common('loading')}</div>
        </div>
      </BackgroundImage>
    );
  }

  if (!user) {
    return (
      <BackgroundImage imageIndex={2} overlay="dark" overlayOpacity={0.8}>
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
    <BackgroundImage imageIndex={2} overlay="dark" overlayOpacity={0.8}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-fade-up">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl text-white sm:text-4xl font-bold mb-2">
            {t('title')} <span className="text-yellow-500">{t('titleHighlight')}</span>
          </h1>
          <p className="text-gray-500">{t('subtitle')}</p>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === 'requests'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
                : 'bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {t('tabs.requests')}
          </button>
          <button
            onClick={() => setActiveTab('unlocked')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === 'unlocked'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
                : 'bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {t('tabs.unlocked')}
          </button>
          <button
            onClick={() => setActiveTab('cancellations')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === 'cancellations'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
                : 'bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {t('tabs.cancellations')}
          </button>
        </div>

        {activeTab === 'requests' && (
          <>
            {message && (
          <div className="text-sm text-gray-500 mb-4">
            {message}
            {showUpgrade && (
              <button
                onClick={handleUpgradeLimit}
                disabled={upgrading}
                className="ml-3 inline-flex bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-4 py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all disabled:opacity-60"
              >
                {upgrading ? t('actions.redirecting') : t('actions.upgradeLimit')}
              </button>
            )}
          </div>
        )}
        {cancelMessage && <div className="text-sm text-red-400 mb-4">{cancelMessage}</div>}

        {status === 'loading' && <div className="text-yellow-500">{t('loading')}</div>}
        {status === 'error' && <div className="text-red-500">{t('error')}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <section className="space-y-3 sm:space-y-4">
            <h2 className="text-lg text-white sm:text-xl font-semibold">{t('incoming.title')}</h2>
            <div className="scrollable-list space-y-3 sm:space-y-4">
            {incoming.map(request => (
              <div
                key={request.id}
                onClick={handleNavigate(request.profile.id)}
                className="glass-card rounded-2xl p-5 space-y-3 cursor-pointer hover:-translate-y-0.5 transition-transform"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src="/images/anon-avatar.svg"
                    alt="Anonymous avatar"
                    width={48}
                    height={48}
                    className="rounded-full border border-[var(--border)]"
                  />
                  <div>
                    <p className="font-semibold">{getDisplayName(request.profile)}</p>
                    <p className="text-sm text-[var(--text-muted)] capitalize">{common(`roles.${request.profile.role}`)}</p>
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
                <div className="text-xs text-[var(--text-muted)]">{t('status', { status: request.status })}</div>
                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespond(request.id, 'accepted')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-bold transition-all"
                    >
                      {t('actions.accept')}
                    </button>
                    <button
                      onClick={() => handleRespond(request.id, 'declined')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-bold transition-all"
                    >
                      {t('actions.decline')}
                    </button>
                  </div>
                )}
                {request.status === 'accepted' && !request.currentUserPaid && (
                  <button
                    onClick={() => handlePay(request.id)}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
                  >
                    {t('actions.payUnlock')}
                  </button>
                )}
                {request.status === 'accepted' && request.currentUserPaid && (
                  <p className="text-xs text-[var(--text-muted)]">
                    {t('waitingOther')}
                  </p>
                )}
              </div>
            ))}
            </div>
            {status === 'idle' && incoming.length === 0 && (
              <div className="text-sm text-[var(--text-muted)]">{t('incoming.empty')}</div>
            )}
          </section>

          <section className="space-y-3 sm:space-y-4">
            <h2 className="text-lg text-white sm:text-xl font-semibold">{t('outgoing.title')}</h2>
            <div className="scrollable-list space-y-3 sm:space-y-4">
            {outgoing.map(request => (
              <div
                key={request.id}
                onClick={handleNavigate(request.profile.id)}
                className="glass-card rounded-2xl p-5 space-y-3 cursor-pointer hover:-translate-y-0.5 transition-transform"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src="/images/anon-avatar.svg"
                    alt="Anonymous avatar"
                    width={48}
                    height={48}
                    className="rounded-full border border-[var(--border)]"
                  />
                  <div>
                    <p className="font-semibold">{getDisplayName(request.profile)}</p>
                    <p className="text-sm text-[var(--text-muted)] capitalize">{common(`roles.${request.profile.role}`)}</p>
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
                <div className="text-xs text-[var(--text-muted)]">{t('status', { status: request.status })}</div>
                {request.status === 'accepted' && !request.currentUserPaid && (
                  <button
                    onClick={() => handlePay(request.id)}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
                  >
                    {t('actions.payUnlock')}
                  </button>
                )}
                {request.status === 'accepted' && request.currentUserPaid && (
                  <p className="text-xs text-[var(--text-muted)]">
                    {t('waitingOther')}
                  </p>
                )}
              </div>
            ))}
            </div>
            {status === 'idle' && outgoing.length === 0 && (
              <div className="text-sm text-[var(--text-muted)]">{t('outgoing.empty')}</div>
            )}
          </section>
        </div>
          </>
        )}

        {activeTab === 'unlocked' && (
        <section>
          <h2 className="text-xl text-white font-semibold mb-4">{t('unlocked.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {unlocked.map(match => (
              <div key={match.matchId} className="glass-card rounded-2xl p-6">
                <p className="text-sm text-[var(--text-muted)] mb-2">{t('unlocked.status', { state: match.state })}</p>
                {match.profile ? (
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">{match.profile.name}</p>
                    <p className="text-sm text-[var(--text-muted)] capitalize">{common(`roles.${match.profile.role}`)}</p>
                    <p className="text-sm">{match.profile.contactEmail || t('unlocked.noEmail')}</p>
                    <p className="text-sm">{match.profile.contactPhone || t('unlocked.noPhone')}</p>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">{t('unlocked.noProfile')}</p>
                )}
              </div>
            ))}
            {unlocked.length === 0 && (
              <div className="text-sm text-[var(--text-muted)]">{t('unlocked.empty')}</div>
            )}
          </div>
        </section>
        )}

        {activeTab === 'cancellations' && (
          <>
          {cancelMessage && <div className="text-sm text-red-400 mb-4">{cancelMessage}</div>}
        <section>
          {/* <h2 className="text-xl text-white font-semibold mb-4">{t('cancellations.title')}</h2> */}
          {cancelStatus === 'loading' && <div className="text-yellow-500">{t('cancellations.loading')}</div>}
          {cancelStatus === 'error' && <div className="text-red-500">{t('cancellations.error')}</div>}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            <section className="space-y-3 sm:space-y-4">
              <h3 className="text-lg text-white font-semibold">{t('cancellations.incoming')}</h3>
              <div className="space-y-3">
                {cancelIncoming.map(request => (
                  <div key={request.id} className="glass-card rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{getDisplayName(request.profile)}</p>
                      <span className="text-xs text-[var(--text-muted)]">{t('cancellations.status', { status: request.status })}</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">{request.reason}</p>
                    {request.status === 'pending' && (
                      <div className="space-y-2">
                        <textarea
                          value={cancelResponses[request.id] || ''}
                          onChange={(event) => setCancelResponses(prev => ({ ...prev, [request.id]: event.target.value }))}
                          placeholder={t('cancellations.responsePlaceholder')}
                          className="w-full px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text)]"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCancelRespond(request.id, 'accepted')}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-bold transition-all"
                          >
                            {t('actions.accept')}
                          </button>
                          <button
                            onClick={() => handleCancelRespond(request.id, 'declined')}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-bold transition-all"
                          >
                            {t('actions.decline')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {cancelIncoming.length === 0 && (
                  <div className="text-sm text-[var(--text-muted)]">{t('cancellations.emptyIncoming')}</div>
                )}
              </div>
            </section>

            <section className="space-y-3 sm:space-y-4">
              <h3 className="text-lg text-white font-semibold">{t('cancellations.outgoing')}</h3>
              <div className="space-y-3">
                {cancelOutgoing.map(request => (
                  <div key={request.id} className="glass-card rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{getDisplayName(request.profile)}</p>
                      <span className="text-xs text-[var(--text-muted)]">{t('cancellations.status', { status: request.status })}</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">{request.reason}</p>
                    {request.response && (
                      <p className="text-xs text-[var(--text-muted)]">{t('cancellations.responseLabel')}: {request.response}</p>
                    )}
                  </div>
                ))}
                {cancelOutgoing.length === 0 && (
                  <div className="text-sm text-[var(--text-muted)]">{t('cancellations.emptyOutgoing')}</div>
                )}
              </div>
            </section>
          </div>
        </section>
          </>
        )}

      </div>
    </BackgroundImage>
  );
}
