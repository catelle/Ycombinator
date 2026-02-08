'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, FileText, UserCircle, UsersRound } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const navItems = [
    { href: '/', icon: Home, label: t('home') },
    { href: '/profiles', icon: Users, label: t('profiles') },
    { href: '/matches', icon: UsersRound, label: t('matches') },
    { href: '/requests', icon: FileText, label: t('requests') },
    { href: '/profile', icon: UserCircle, label: t('profile') }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="glass-card border-t border-[var(--border)] rounded-none">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all ${
                  isActive
                    ? 'text-yellow-500'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
