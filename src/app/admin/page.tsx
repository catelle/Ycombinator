'use client';

import Link from 'next/link';
import SplashImage from '@/components/SplashImage';
import { Shield, Users, CheckCircle } from 'lucide-react';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';

export default function AdminDashboard() {
  const { user, loading } = useAuth();

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Admin <span className="text-yellow-400">Dashboard</span>
          </h1>
          <p className="text-[var(--text-muted)]">Manage the matchmaking platform.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/matching" className="glass-card p-8 rounded-2xl hover:-translate-y-1 transition-all">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <Users className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[var(--text)]">Matching Control</h3>
            <p className="text-[var(--text-muted)]">Review matches, users, and verification requests.</p>
          </Link>

          <div className="glass-card p-8 rounded-2xl">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[var(--text)]">Trust & Safety</h3>
            <p className="text-[var(--text-muted)]">Identity verification, reporting, and platform integrity.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
