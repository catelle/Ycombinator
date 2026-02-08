'use client';

import Link from 'next/link';
import { Bell, LogOut } from 'lucide-react';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { useLocale, useTranslations } from 'next-intl';

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const { user, logout, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Force re-render when user changes
  useEffect(() => {
    // This will trigger a re-render when user state changes
  }, [user]);

  useEffect(() => {
    const loadUnread = async () => {
      if (!user) {
        setUnreadCount(0);
        return;
      }
      try {
        const response = await fetch('/api/notifications/unread');
        if (!response.ok) return;
        const data = (await response.json()) as { unreadCount?: number };
        setUnreadCount(data.unreadCount || 0);
      } catch (error) {
        console.error('Failed to load unread notifications', error);
      }
    };

    loadUnread();
  }, [user]);

  const handleLocaleChange = (nextLocale: string) => {
    if (nextLocale === locale) return;
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
           YmatchAfrica
          </Link>

          <div className="hidden md:flex space-x-8 text-sm font-semibold text-[var(--text)]">
            <Link href="/profiles" className="hover:text-[var(--accent-strong)] transition-colors">
              {t('profiles')}
            </Link>
            <Link href="/matches" className="hover:text-[var(--accent-strong)] transition-colors">
              {t('matches')}
            </Link>
            <Link href="/requests" className="hover:text-[var(--accent-strong)] transition-colors">
              {t('requests')}
            </Link>
            <Link href="/team" className="hover:text-[var(--accent-strong)] transition-colors">
              {t('team')}
            </Link>
            {/* {user && (
              <Link href="/notifications" className="hover:text-[var(--accent-strong)] transition-colors">
                {t('notifications')}
              </Link>
            )} */}
            {user?.role === 'admin' && (
              <Link href="/admin" className="hover:text-[var(--accent-strong)] transition-colors">
                {t('admin')}
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="hidden sm:block">
              <select
                value={locale}
                onChange={(event) => handleLocaleChange(event.target.value)}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] shadow-sm"
              >
                <option value="en">EN</option>
                <option value="fr">FR</option>
              </select>
            </div>
            {!loading && (
              user ? (
                <div className="flex items-center space-x-3">
                  <Link href="/notifications" className="relative rounded-full border border-[var(--border)] p-2 text-[var(--text)] hover:-translate-y-0.5 transition">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px] font-bold rounded-full px-1.5">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/profile" className="text-sm font-semibold text-[var(--text)] hover:text-[var(--accent-strong)] transition-colors">
                    {user.name}
                  </Link>
                  <button
                    onClick={logout}
                    className="rounded-full border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text)] transition hover:-translate-y-0.5"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-4 py-2 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
                >
                  {t('signIn')}
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
