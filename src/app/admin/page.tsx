'use client';

import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';
import BackgroundImage from '@/components/BackgroundImage';
import { Shield, Users, CheckCircle, BarChart3 } from 'lucide-react';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import { useTranslations } from 'next-intl';

export default function AdminDashboard() {
  const t = useTranslations('admin');
  const common = useTranslations('common');
  const { user, loading } = useAuth();

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
            <div className="mb-8">
              <h1 className="text-3xl text-white sm:text-4xl font-bold mb-2">
                {t('title')} <span className="text-yellow-400">{t('titleHighlight')}</span>
              </h1>
              <p className="text-gray-300">{t('subtitle')}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Link href="/admin/matching" className="glass-card p-8 rounded-2xl hover:-translate-y-1 transition-all">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <Users className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[var(--text)]">{t('cards.matching.title')}</h3>
            <p className="text-[var(--text-muted)]">{t('cards.matching.body')}</p>
          </Link>

          <Link href="/admin/activity" className="glass-card p-8 rounded-2xl hover:-translate-y-1 transition-all">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <BarChart3 className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[var(--text)]">{t('cards.activity.title')}</h3>
            <p className="text-[var(--text-muted)]">{t('cards.activity.body')}</p>
          </Link>

          <div className="glass-card p-8 rounded-2xl">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[var(--text)]">{t('cards.trust.title')}</h3>
            <p className="text-[var(--text-muted)]">{t('cards.trust.body')}</p>
          </div>
            </div>
          </div>
        </div>
      </div>
    </BackgroundImage>
  );
}
