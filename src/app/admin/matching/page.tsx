'use client';

import { useEffect, useState } from 'react';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import { Shield, Users, CheckCircle } from 'lucide-react';
import type { Match, VerificationRequest, User } from '@/types';
import Link from 'next/link';
import SplashImage from '@/components/SplashImage';

interface AdminPayload {
  users: User[];
  matches: Match[];
  verificationRequests: VerificationRequest[];
}

export default function MatchingAdminPage() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<AdminPayload | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');

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

  const approveVerification = async (requestId: string) => {
    await fetch('/api/admin/verification/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId })
    });
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center relative overflow-hidden">
        <SplashImage
          index={1}
          size={360}
          className="absolute -top-24 -left-24 w-[360px] h-[360px] opacity-50 pointer-events-none"
        />
        <div className="text-[var(--accent-strong)] text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center relative overflow-hidden">
        <SplashImage
          index={1}
          size={360}
          className="absolute -top-24 -left-24 w-[360px] h-[360px] opacity-50 pointer-events-none"
        />
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[var(--text)] mb-4">Access Denied</h1>
          <p className="text-[var(--text-muted)]">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)] relative overflow-hidden">
      <SplashImage
        index={1}
        size={420}
        className="absolute -top-24 -right-24 w-[420px] h-[420px] opacity-60 pointer-events-none"
      />
      <SplashImage
        index={2}
        size={360}
        className="absolute -bottom-24 -left-24 w-[360px] h-[360px] opacity-40 pointer-events-none"
      />
      <div className="max-w-6xl mx-auto px-4 py-10 relative">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Matching <span className="text-yellow-400">Admin</span>
            </h1>
            <p className="text-[var(--text-muted)]">Manage users, matches, and verification requests.</p>
          </div>
          <Link href="/admin" className="text-yellow-600 hover:text-yellow-700">Back to Admin</Link>
        </div>

        {status === 'loading' && <p className="text-[var(--accent-strong)]">Loading data...</p>}
        {status === 'error' && <p className="text-red-500">Failed to load admin data.</p>}

        {data && (
          <div className="space-y-8">
            <section className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-5 w-5 text-yellow-400" />
                <h2 className="text-2xl font-bold">Users</h2>
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
                      {account.verified && (
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">Verified</span>
                      )}
                      {account.emailVerified && (
                        <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">Email Verified</span>
                      )}
                      <button
                        onClick={() => suspendUser(account.id, !account.suspended)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold transition"
                      >
                        {account.suspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-5 w-5 text-yellow-400" />
                <h2 className="text-2xl font-bold">Verification Requests</h2>
              </div>
              <div className="space-y-3">
                {data.verificationRequests.map(request => (
                  <div key={request.id} className="rounded-xl p-4 border border-[var(--border)] bg-[var(--surface-muted)] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[var(--text)]">User {request.userId}</p>
                      <p className="text-[var(--text-muted)] text-sm">Status: {request.status}</p>
                    </div>
                    {request.status === 'pending' && (
                      <button
                        onClick={() => approveVerification(request.id)}
                        className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-4 py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-card rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-4">Matches</h2>
              <div className="space-y-3">
                {data.matches.map(match => (
                  <div key={match.id} className="rounded-xl p-4 border border-[var(--border)] bg-[var(--surface-muted)]">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-[var(--text)]">{match.userId} ↔ {match.matchedUserId}</p>
                      <span className="text-yellow-400 font-bold">{match.score}%</span>
                    </div>
                    <p className="text-[var(--text-muted)] text-sm">State: {match.state}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
