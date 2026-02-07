'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import { useEffect } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout, loading } = useAuth();

  // Force re-render when user changes
  useEffect(() => {
    // This will trigger a re-render when user state changes
  }, [user]);

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            NappyMine
          </Link>

          <div className="hidden md:flex space-x-8 text-sm font-semibold text-[var(--text)]">
            <Link href="/profiles" className="hover:text-[var(--accent-strong)] transition-colors">
              Profiles
            </Link>
            <Link href="/matches" className="hover:text-[var(--accent-strong)] transition-colors">
              Matches
            </Link>
            <Link href="/requests" className="hover:text-[var(--accent-strong)] transition-colors">
              Requests
            </Link>
            <Link href="/team" className="hover:text-[var(--accent-strong)] transition-colors">
              Team
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin" className="hover:text-[var(--accent-strong)] transition-colors">
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {!loading && (
              user ? (
                <div className="flex items-center space-x-3">
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
                  Sign In
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
