'use client';

import { useEffect, useState } from 'react';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import { Shield, Users, CheckCircle } from 'lucide-react';
import type { Match, MatchCancellationRequest, VerificationRequest, User } from '@/types';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';
import BackgroundImage from '@/components/BackgroundImage';
import { useTranslations } from 'next-intl';

interface AdminMatchView extends Match {
  userA: { id: string; name: string; email: string; alias?: string };
  userB: { id: string; name: string; email: string; alias?: string };
}

interface CancellationView extends MatchCancellationRequest {
  requesterAlias?: string;
  recipientAlias?: string;
}

interface AdminPayload {
  users: User[];
  matches: AdminMatchView[];
  verificationRequests: VerificationRequest[];
  cancellationRequests: CancellationView[];
}

export default function MatchingAdminPage() {
  const t = useTranslations('adminMatching');
  const common = useTranslations('common');
  const { user, loading } = useAuth();
  const [data, setData] = useState<AdminPayload | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [requester, setRequester] = useState('');
  const [recipient, setRecipient] = useState('');
  const [decisionNote, setDecisionNote] = useState<Record<string, string>>({});

  const loadData = async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/admin/matching');
      if (!response.ok) {
        setStatus('error');
        return;
      }
      const payload = (await response.json()) as AdminPayload;
      setData(payload);
      setStatus('idle');
    } catch (error) {
      console.error('Failed to load admin data', error);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  const suspendUser = async (userId: string, suspended: boolean) => {
    await fetch('/api/admin/users/suspend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, suspended })
    });
    loadData();
  };

  const deleteUser = async (userId: string) => {
    const reason = window.prompt(t('actions.deletePrompt'));
    if (reason === null) return;
    await fetch('/api/admin/users/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, reason })
    });
    loadData();
  };

  const approveVerification = async (requestId: string) => {
    await fetch('/api/admin/verification/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId })
    });
    loadData();
  };

  const cancelMatch = async (matchId: string) => {
    const reason = window.prompt(t('actions.cancelPrompt'));
    if (reason === null) return;
    await fetch('/api/admin/matches/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, reason })
    });
    loadData();
  };

  const decideCancellation = async (requestId: string, decision: 'approved' | 'rejected') => {
    await fetch('/api/admin/match-cancellations/decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, decision, note: decisionNote[requestId] })
    });
    loadData();
  };

  const createMatchRequest = async () => {
    setCreating(true);
    setCreateError('');
    try {
      const response = await fetch('/api/admin/match-requests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester, recipient })
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setCreateError(result.error || t('errors.createMatchRequest'));
        return;
      }
      setRequester('');
      setRecipient('');
      loadData();
    } catch (error) {
      console.error('Failed to create match request', error);
      setCreateError(t('errors.createMatchRequest'));
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <BackgroundImage imageIndex={1} overlay="gradient" overlayOpacity={0.8}>
        <div className="flex items-center justify-center">
          <div className="text-[var(--accent-strong)] text-xl">{common('loading')}</div>
        </div>
      </BackgroundImage>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <BackgroundImage imageIndex={1} overlay="gradient" overlayOpacity={0.8}>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[var(--text)] mb-4">{t('accessDenied.title')}</h1>
            <p className="text-[var(--text-muted)]">{t('accessDenied.subtitle')}</p>
          </div>
        </div>
      </BackgroundImage>
    );
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredMatches = data?.matches.filter(match => {
    if (!normalizedSearch) return true;
    const haystack = [
      match.userA.id,
      match.userA.name,
      match.userA.email,
      match.userA.alias,
      match.userB.id,
      match.userB.name,
      match.userB.email,
      match.userB.alias
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  }) ?? [];

  return (
    <BackgroundImage imageIndex={1} overlay="gradient" overlayOpacity={0.8}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex gap-6">
          <div className="hidden lg:block">
            <AdminSidebar />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl text-white sm:text-4xl font-bold mb-2">
                  {t('title')} <span className="text-yellow-400">{t('titleHighlight')}</span>
                </h1>
                <p className="text-gray-300">{t('subtitle')}</p>
              </div>
              <Link href="/admin" className="text-yellow-600 hover:text-yellow-700 lg:hidden">{t('backToAdmin')}</Link>
            </div>

        {status === 'loading' && <p className="text-[var(--accent-strong)]">{t('loading')}</p>}
        {status === 'error' && <p className="text-red-500">{t('error')}</p>}

        {data && (
          <div className="space-y-8">
            <section className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-5 w-5 text-yellow-400" />
                <h2 className="text-2xl font-bold">{t('sections.createMatch')}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={requester}
                  onChange={(event) => setRequester(event.target.value)}
                  placeholder={t('placeholders.requester')}
                  className="px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text)]"
                />
                <input
                  type="text"
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  placeholder={t('placeholders.recipient')}
                  className="px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text)]"
                />
                <button
                  onClick={createMatchRequest}
                  disabled={creating || !requester.trim() || !recipient.trim()}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-4 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all disabled:opacity-60"
                >
                  {creating ? t('actions.creating') : t('actions.create')}
                </button>
              </div>
              {createError && <p className="text-sm text-red-500 mt-2">{createError}</p>}
            </section>

            <section className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-5 w-5 text-yellow-400" />
                <h2 className="text-2xl font-bold">{t('sections.users')}</h2>
              </div>
              <div className="space-y-3">
                {data.users.map(account => (
                  <div key={account.id} className="rounded-xl p-4 border border-[var(--border)] bg-[var(--surface-muted)] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[var(--text)]">{account.name}</p>
                      <p className="text-[var(--text-muted)] text-sm">{account.email}</p>
                      {account.phone && <p className="text-[var(--text-muted)] text-xs">{account.phone}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      {account.deletedAt && (
                        <span className="bg-gray-500/20 text-gray-300 px-3 py-1 rounded-full text-xs font-bold">{t('badges.deleted')}</span>
                      )}
                      {account.verified && (
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">{t('badges.verified')}</span>
                      )}
                      {account.emailVerified && (
                        <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">{t('badges.emailVerified')}</span>
                      )}
                      <button
                        onClick={() => suspendUser(account.id, !account.suspended)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold transition"
                      >
                        {account.suspended ? t('actions.unsuspend') : t('actions.suspend')}
                      </button>
                      <button
                        onClick={() => deleteUser(account.id)}
                        className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-xl font-bold transition"
                      >
                        {t('actions.softDelete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-5 w-5 text-yellow-400" />
                <h2 className="text-2xl font-bold">{t('sections.verifications')}</h2>
              </div>
              <div className="space-y-3">
                {data.verificationRequests.map(request => (
                  <div key={request.id} className="rounded-xl p-4 border border-[var(--border)] bg-[var(--surface-muted)] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[var(--text)]">{t('verification.user', { id: request.userId })}</p>
                      <p className="text-[var(--text-muted)] text-sm">{t('verification.status', { status: request.status })}</p>
                    </div>
                    {request.status === 'pending' && (
                      <button
                        onClick={() => approveVerification(request.id)}
                        className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-4 py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
                      >
                        {t('actions.approve')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-5 w-5 text-yellow-400" />
                <h2 className="text-2xl font-bold">{t('sections.cancellations')}</h2>
              </div>
              <div className="space-y-3">
                {data.cancellationRequests.length === 0 && (
                  <p className="text-sm text-[var(--text-muted)]">{t('cancellations.empty')}</p>
                )}
                {data.cancellationRequests.map(request => (
                  <div key={request.id} className="rounded-xl p-4 border border-[var(--border)] bg-[var(--surface-muted)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[var(--text)]">
                          {t('cancellations.pair', { a: request.requesterAlias || request.requesterId, b: request.recipientAlias || request.recipientId })}
                        </p>
                        <p className="text-[var(--text-muted)] text-sm">{t('cancellations.status', { status: request.status })}</p>
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">{new Date(request.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">
                      <span className="text-[var(--text)] font-semibold">{t('cancellations.requestReason')}</span> {request.requesterReason}
                    </div>
                    {request.recipientResponse && (
                      <div className="text-sm text-[var(--text-muted)]">
                        <span className="text-[var(--text)] font-semibold">{t('cancellations.response')}</span> {request.recipientResponse}
                      </div>
                    )}
                    {request.status === 'accepted' && (
                      <div className="space-y-2">
                        <textarea
                          value={decisionNote[request.id] || ''}
                          onChange={(event) => setDecisionNote(prev => ({ ...prev, [request.id]: event.target.value }))}
                          placeholder={t('cancellations.adminNote')}
                          className="w-full px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text)]"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => decideCancellation(request.id, 'approved')}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-bold transition-all"
                          >
                            {t('cancellations.approve')}
                          </button>
                          <button
                            onClick={() => decideCancellation(request.id, 'rejected')}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-bold transition-all"
                          >
                            {t('cancellations.reject')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-card rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <h2 className="text-2xl font-bold">{t('sections.matches')}</h2>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('placeholders.search')}
                  className="px-4 py-2 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text)]"
                />
              </div>
              <div className="space-y-3">
                {filteredMatches.map(match => (
                  <div key={match.id} className="rounded-xl p-4 border border-[var(--border)] bg-[var(--surface-muted)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[var(--text)]">
                          {t('matches.pair', { a: match.userA.alias || match.userA.name, b: match.userB.alias || match.userB.name })}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">{match.userA.email} · {match.userB.email}</p>
                      </div>
                      <span className="text-yellow-400 font-bold">{match.score}%</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[var(--text-muted)] text-sm">{t('matches.state', { state: match.state })}</p>
                      {(match.state === 'LOCKED' || match.state === 'VERIFIED') && (
                        <button
                          onClick={() => cancelMatch(match.id)}
                          className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full font-bold"
                        >
                          {t('actions.cancelMatch')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
          </div>
        </div>
      </div>
    </BackgroundImage>
  );
}
