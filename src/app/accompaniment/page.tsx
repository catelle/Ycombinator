'use client';

import { useState } from 'react';
import Link from 'next/link';
import SplashImage from '@/components/SplashImage';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';

const LOCAL_PROGRAMS = [
  { name: 'Silicon Savannah Hub', type: 'Incubator', region: 'East Africa' },
  { name: 'Douala Founder Lab', type: 'Incubator', region: 'Cameroon' },
  { name: 'Yaoundé Growth Studio', type: 'Accelerator', region: 'Cameroon' },
  { name: 'Pan-Africa Launch', type: 'Accelerator', region: 'Africa-wide' }
];

const MONETIZATION = [
  {
    title: 'Frais Fixe',
    detail: 'Un paiement unique pour un accompagnement complet.'
  },
  {
    title: '% sur accompagnement',
    detail: 'Partage de revenus basé sur les résultats et la traction.'
  },
  {
    title: 'Abonnement',
    detail: 'Accès mensuel aux coachs, revues et ateliers.'
  }
];

export default function AccompanimentPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');

  const requestAccompaniment = async (type: 'incubator' | 'accelerator' | 'platform', providerName?: string) => {
    setMessage('');
    try {
      const response = await fetch('/api/accompaniment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, providerName })
      });

      if (!response.ok) {
        setMessage('Please sign in and complete your team before requesting accompaniment.');
        return;
      }

      setMessage('Request submitted. Our team will contact you soon.');
    } catch (error) {
      console.error('Failed to request accompaniment', error);
      setMessage('Unable to submit request right now.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)] relative overflow-hidden">
      <SplashImage
        index={1}
        size={420}
        className="absolute -top-24 -right-24 w-[420px] h-[420px] opacity-60 pointer-events-none"
      />
      <SplashImage
        index={3}
        size={360}
        className="absolute -bottom-24 -left-24 w-[360px] h-[360px] opacity-40 pointer-events-none"
      />

      <div className="max-w-6xl mx-auto px-4 py-10 animate-fade-up relative">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Accompagnement <span className="text-yellow-500">Startup</span>
            </h1>
            <p className="text-[var(--text-muted)]">
              Après formation d’une team, choisissez un incubateur local ou l’accompagnement de la plateforme.
            </p>
          </div>
          <Link href="/team" className="text-yellow-600 hover:text-yellow-700">
            Back to Team
          </Link>
        </div>

        {message && <div className="text-sm text-[var(--text-muted)] mb-6">{message}</div>}

        <section className="glass-card rounded-3xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Incubateurs & accompagnateurs locaux</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LOCAL_PROGRAMS.map(program => (
              <div key={program.name} className="border border-[var(--border)] rounded-2xl p-4 bg-[var(--surface-muted)]">
                <p className="text-lg font-bold text-[var(--text)]">{program.name}</p>
                <p className="text-sm text-[var(--text-muted)]">{program.type} · {program.region}</p>
                <button
                  onClick={() => requestAccompaniment(program.type === 'Incubator' ? 'incubator' : 'accelerator', program.name)}
                  className="mt-4 w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
                >
                  Request This Program
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-3xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Accompagnement par la plateforme</h2>
          <p className="text-[var(--text-muted)] mb-4">
            Bénéficiez d’un suivi direct par nos experts produit, growth et fundraising.
          </p>
          <button
            onClick={() => requestAccompaniment('platform')}
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
          >
            Request Platform Accompaniment
          </button>
          {!user && (
            <p className="text-xs text-[var(--text-muted)] mt-3">Sign in to request accompaniment.</p>
          )}
        </section>

        <section className="glass-card rounded-3xl p-6">
          <h2 className="text-2xl font-bold mb-4">Monétisation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MONETIZATION.map(option => (
              <div key={option.title} className="border border-[var(--border)] rounded-2xl p-4 bg-[var(--surface-muted)]">
                <p className="text-lg font-bold">{option.title}</p>
                <p className="text-sm text-[var(--text-muted)] mt-2">{option.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
