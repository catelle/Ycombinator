'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, BarChart3, Shield, Settings } from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/admin', icon: BarChart3, label: 'Dashboard', exact: true },
    { href: '/admin/matching', icon: Users, label: 'Matching' },
    { href: '/admin/activity', icon: BarChart3, label: 'Activity' },
    { href: '/admin/verification', icon: Shield, label: 'Verification' }
  ];

  return (
    <aside className="w-64 glass-card rounded-2xl p-4 h-fit sticky top-20">
      <nav className="space-y-2">
        {menuItems.map(({ href, icon: Icon, label, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
