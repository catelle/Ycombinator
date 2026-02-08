'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BackgroundImage from '@/components/BackgroundImage';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import type { Notification } from '@/types';
import { useTranslations } from 'next-intl';

interface NotificationView extends Notification {}

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const common = useTranslations('common');
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationView[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'idle'>('loading');

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        setStatus('error');
        return;
      }
      const data = (await response.json()) as { notifications: NotificationView[] };
      setNotifications(data.notifications);
      setStatus('idle');
    } catch (error) {
      console.error('Failed to load notifications', error);
      setStatus('error');
    }
  };

  const markAllRead = async () => {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true })
    });
    loadNotifications();
  };

  const markRead = async (id: string) => {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    loadNotifications();
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl text-white sm:text-4xl font-bold mb-2">{t('title')}</h1>
            <p className="text-gray-500">{t('subtitle')}</p>
          </div>
          <button
            onClick={markAllRead}
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-4 py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
          >
            {t('actions.markAllRead')}
          </button>
        </div>

        {status === 'loading' && <div className="text-yellow-500">{t('loading')}</div>}
        {status === 'error' && <div className="text-red-500">{t('error')}</div>}

        <div className="space-y-3">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`glass-card rounded-2xl p-5 border ${notification.readAt ? 'border-transparent' : 'border-yellow-500/60'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-[var(--text)]">{notification.title}</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{notification.message}</p>
                  {notification.actionUrl && (
                    <Link href={notification.actionUrl} className="text-yellow-500 text-sm font-medium mt-2 inline-block">
                      {t('actions.viewDetails')}
                    </Link>
                  )}
                </div>
                {!notification.readAt && (
                  <button
                    onClick={() => markRead(notification.id)}
                    className="text-xs text-yellow-600 hover:text-yellow-700 font-semibold"
                  >
                    {t('actions.markRead')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {status === 'idle' && notifications.length === 0 && (
          <div className="text-center text-[var(--text-muted)] mt-8">{t('empty')}</div>
        )}
      </div>
    </BackgroundImage>
  );
}
