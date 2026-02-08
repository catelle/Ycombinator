'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';
import BackgroundImage from '@/components/BackgroundImage';
import { Shield, BarChart3, ClipboardList } from 'lucide-react';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import { useTranslations } from 'next-intl';

interface StatsPayload {
  users: { total: number; active: number; deleted: number; suspended: number };
  profiles: { total: number; completed: number };
  matches: { total: number; locked: number; cancelled: number };
  requests: { pending: number };
  payments: { total: number; succeeded: number; revenue: Record<string, number> };
  auditLogs: { total: number };
}

interface AuditLogView {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail?: string;
  action: string;
  metadata: Record<string, string | number | boolean>;
  createdAt: string;
}

export default function AdminActivityPage() {
  const t = useTranslations('adminActivity');
  const common = useTranslations('common');
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [logs, setLogs] = useState<AuditLogView[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');

  const loadData = async () => {
    setStatus('loading');
    try {
      const [statsRes, logsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/audit?limit=60')
      ]);

      if (!statsRes.ok || !logsRes.ok) {
        setStatus('error');
        return;
      }

      const statsData = (await statsRes.json()) as StatsPayload;
      const logsData = (await logsRes.json()) as { logs: AuditLogView[] };
      setStats(statsData);
      setLogs(logsData.logs);
      setStatus('idle');
    } catch (error) {
      console.error('Failed to load admin activity', error);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

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

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-5 w-5 text-yellow-400" />
                <p className="text-lg font-semibold">{t('sections.users')}</p>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{t('stats.totalUsers', { value: stats.users.total })}</p>
              <p className="text-sm text-[var(--text-muted)]">{t('stats.activeUsers', { value: stats.users.active })}</p>
              <p className="text-sm text-[var(--text-muted)]">{t('stats.deletedUsers', { value: stats.users.deleted })}</p>
              <p className="text-sm text-[var(--text-muted)]">{t('stats.suspendedUsers', { value: stats.users.suspended })}</p>
              <p className="text-sm text-[var(--text-muted)]">{t('stats.totalProfiles', { value: stats.profiles.total })}</p>
              <p className="text-sm text-[var(--text-muted)]">{t('stats.completedProfiles', { value: stats.profiles.completed })}</p>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="h-5 w-5 text-yellow-400" />
                <p className="text-lg font-semibold">{t('sections.matches')}</p>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{t('stats.totalMatches', { value: stats.matches.total })}</p>
              <p className="text-sm text-[var(--text-muted)]">{t('stats.lockedMatches', { value: stats.matches.locked })}</p>
              <p className="text-sm text-[var(--text-muted)]">{t('stats.cancelledMatches', { value: stats.matches.cancelled })}</p>
              <p className="text-sm text-[var(--text-muted)]">{t('stats.pendingRequests', { value: stats.requests.pending })}</p>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-5 w-5 text-yellow-400" />
                <p className="text-lg font-semibold">{t('sections.revenue')}</p>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{t('stats.totalPayments', { value: stats.payments.total })}</p>
              <p className="text-sm text-[var(--text-muted)]">{t('stats.successPayments', { value: stats.payments.succeeded })}</p>
              <div className="text-sm text-[var(--text-muted)] space-y-1 mt-2">
                {Object.keys(stats.payments.revenue).length === 0 && <div>{t('stats.noRevenue')}</div>}
                {Object.entries(stats.payments.revenue).map(([currency, total]) => (
                  <div key={currency}>{t('stats.revenueLine', { currency, value: total })}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="h-5 w-5 text-yellow-400" />
            <h2 className="text-2xl font-bold">{t('sections.activity')}</h2>
          </div>
          <div className="space-y-3">
            {logs.map(entry => (
              <div key={entry.id} className="rounded-xl p-4 border border-[var(--border)] bg-[var(--surface-muted)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[var(--text)]">{entry.action}</p>
                    <p className="text-xs text-[var(--text-muted)]">{entry.actorName} · {entry.actorEmail || entry.actorId}</p>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-2">
                  {Object.entries(entry.metadata).map(([key, value]) => (
                    <span key={key} className="mr-3">{key}: {String(value)}</span>
                  ))}
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-sm text-[var(--text-muted)]">{t('emptyLogs')}</p>
            )}
          </div>
        </div>
          </div>
        </div>
      </div>
    </BackgroundImage>
  );
}
