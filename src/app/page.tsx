import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ShieldCheck, Lock, Star, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function Home() {
  const t = await getTranslations('home');
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40"></div>
        <div className="absolute -top-32 -right-20 h-72 w-72 rounded-full bg-yellow-400/20 blur-3xl animate-float-slow"></div>
        <div className="absolute top-40 -left-24 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl animate-float-slow"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="space-y-6 animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text)] shadow-sm">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                {t('badge')}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                {t('title')}
                <span className="block bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  {t('titleHighlight')}
                </span>
              </h1>
              <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-xl">
                {t('intro')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/profile"
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-8 py-4 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all shadow-lg"
                >
                  {t('ctaPrimary')}
                </Link>
                <Link
                  href="/matches"
                  className="border border-[var(--border)] px-8 py-4 rounded-xl font-bold text-[var(--text)] hover:bg-[var(--surface)] transition-all"
                >
                  {t('ctaSecondary')}
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4">
                <div className="glass-card rounded-2xl p-4">
                  <p className="text-sm text-[var(--text-muted)]">{t('stats.compatibility')}</p>
                  <p className="text-xl font-bold text-[var(--text)]">{t('stats.roleSkills')}</p>
                </div>
                <div className="glass-card rounded-2xl p-4">
                  <p className="text-sm text-[var(--text-muted)]">{t('stats.verification')}</p>
                  <p className="text-xl font-bold text-[var(--text)]">{t('stats.verificationPrice')}</p>
                </div>
                <div className="glass-card rounded-2xl p-4">
                  <p className="text-sm text-[var(--text-muted)]">{t('stats.unlock')}</p>
                  <p className="text-xl font-bold text-[var(--text)]">{t('stats.unlockPrice')}</p>
                </div>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute -inset-8 rounded-[48px] bg-gradient-to-br from-yellow-400/20 via-transparent to-amber-500/20 blur-2xl animate-shimmer"></div>
              <Image
                src="/images/hero-match.svg"
                alt={t('heroAlt')}
                width={520}
                height={420}
                className="relative animate-float-slow"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between flex-col lg:flex-row gap-10">
            <div className="max-w-xl">
              <h2 className="text-4xl font-bold mb-4">{t('howItWorks.title')}</h2>
              <p className="text-[var(--text-muted)] mb-8">
                {t('howItWorks.subtitle')}
              </p>
              <div className="space-y-4">
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold">{t('howItWorks.step1.title')}</h3>
                  </div>
                  <p className="text-[var(--text-muted)] text-sm">{t('howItWorks.step1.body')}</p>
                </div>
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold">{t('howItWorks.step2.title')}</h3>
                  </div>
                  <p className="text-[var(--text-muted)] text-sm">{t('howItWorks.step2.body')}</p>
                </div>
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Lock className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold">{t('howItWorks.step3.title')}</h3>
                  </div>
                  <p className="text-[var(--text-muted)] text-sm">{t('howItWorks.step3.body')}</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/images/feature-grid.svg"
                alt={t('howItWorks.imageAlt')}
                width={520}
                height={380}
                className="rounded-[32px] shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <Image
                src="/images/team-lock.svg"
                alt={t('trust.imageAlt')}
                width={520}
                height={380}
                className="rounded-[32px] shadow-2xl"
              />
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-4">{t('trust.title')}</h2>
              <p className="text-[var(--text-muted)] mb-6">
                {t('trust.subtitle')}
              </p>
              <div className="space-y-4">
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold">{t('trust.card1.title')}</h3>
                  </div>
                  <p className="text-[var(--text-muted)] text-sm">{t('trust.card1.body')}</p>
                </div>
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold">{t('trust.card2.title')}</h3>
                  </div>
                  <p className="text-[var(--text-muted)] text-sm">{t('trust.card2.body')}</p>
                </div>
              </div>
              <div className="mt-6">
                <Link
                  href="/team"
                  className="inline-flex bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
                >
                  {t('trust.cta')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">{t('ready.title')}</h2>
          <p className="text-[var(--text-muted)] mb-8">
            {t('ready.subtitle')}
          </p>
          <Link
            href="/profile"
            className="inline-flex bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-8 py-4 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all shadow-lg"
          >
            {t('ready.cta')}
          </Link>
        </div>
      </section>
    </div>
  );
}
