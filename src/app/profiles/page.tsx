'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BackgroundImage from '@/components/BackgroundImage';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import type { PublicProfile } from '@/types';

const AVATARS = [
  '/images/anon-avatar.svg',
  '/images/anon-avatar.svg',
  '/images/anon-avatar.svg',
  '/images/anon-avatar.svg',
  '/images/anon-avatar.svg',
  '/images/anon-avatar.svg'
];

const USERNAMES = [
  'Stealth Founder',
  'Vision Builder',
  'Growth Architect',
  'Product Alchemist',
  'Market Explorer',
  'Idea Navigator',
  'Startup Spark',
  'Dream Executor'
];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const pickFrom = (value: string, list: string[]) => list[hashString(value) % list.length];

export default function ProfilesPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'idle'>('loading');

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const response = await fetch('/api/profiles');
        if (!response.ok) {
          setStatus('error');
          return;
        }
        const data = (await response.json()) as { profiles: PublicProfile[] };
        setProfiles(data.profiles);
        setStatus('idle');
      } catch (error) {
        console.error('Failed to load profiles', error);
        setStatus('error');
      }
    };

    loadProfiles();
  }, []);

  return (
    <BackgroundImage imageIndex={3} overlay="gradient" overlayOpacity={0.8}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-fade-up">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl text-white sm:text-4xl font-bold mb-2">
            Founder <span className="text-yellow-500">Profiles</span>
          </h1>
          <p className=" text-gray-100 text-sm sm:text-base">
            Browse anonymous founder profiles. Identity and contact details stay hidden until a match is unlocked.
          </p>
          {!user && (
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-2">
              Sign in to test match compatibility and request a match.
            </p>
          )}
        </div>

        {status === 'loading' && <div className="text-yellow-500">Loading profiles...</div>}
        {status === 'error' && <div className="text-red-500">Unable to load profiles.</div>}

        <div className="scrollable-list">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {profiles.map(profile => (
              <Link
                key={profile.id}
                href={`/profiles/${profile.id}`}
                className="glass-card rounded-2xl p-4 sm:p-6 hover:-translate-y-1 transition-all"
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <Image
                    src={pickFrom(profile.id, AVATARS)}
                    alt="Anonymous avatar"
                    width={56}
                    height={56}
                    className="rounded-full border border-[var(--border)]"
                  />
                  <div>
                    <p className="text-base sm:text-lg font-semibold">{pickFrom(profile.id, USERNAMES)}</p>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] capitalize">{profile.role}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.skills.slice(0, 4).map(skill => (
                    <span
                      key={skill}
                      className="bg-yellow-400/20 text-yellow-600 px-2 sm:px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <p className="text-[var(--text-muted)] text-xs sm:text-sm line-clamp-3 mb-3 sm:mb-4">{profile.interests}</p>

                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span className="capitalize">{profile.commitment}</span>
                  <span>{profile.location}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {status === 'idle' && profiles.length === 0 && (
          <div className="text-center text-[var(--text-muted)] mt-8">No profiles available yet.</div>
        )}
      </div>
    </BackgroundImage>
  );
}
