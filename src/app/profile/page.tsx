'use client';

import { useEffect, useState } from 'react';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BackgroundImage from '@/components/BackgroundImage';
import type { CommitmentLevel, Profile, ProfileRole } from '@/types';
import { useTranslations } from 'next-intl';

const ROLE_OPTIONS: ProfileRole[] = ['technical', 'business', 'product', 'design', 'marketing', 'operations', 'other'];
const COMMITMENT_OPTIONS: CommitmentLevel[] = ['exploring', 'part-time', 'full-time', 'weekends'];

export default function ProfilePage() {
  const t = useTranslations('profileForm');
  const common = useTranslations('common');
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    alias: '',
    role: 'technical' as ProfileRole,
    skills: [] as string[],
    languages: [] as string[],
    achievements: [] as string[],
    verificationDocs: [] as string[],
    interests: '',
    commitment: 'exploring' as CommitmentLevel,
    location: '',
    contactEmail: '',
    contactPhone: '',
    photoUrl: ''
  });
  const [skillInput, setSkillInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  const [achievementInput, setAchievementInput] = useState('');
  const [docInput, setDocInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (!response.ok) return;
        const data = (await response.json()) as { profile: Profile | null };
        if (data.profile) {
          setForm({
            name: data.profile.name,
            alias: data.profile.alias || '',
            role: data.profile.role,
            skills: data.profile.skills,
            languages: data.profile.languages || [],
            achievements: data.profile.achievements || [],
            verificationDocs: data.profile.verificationDocs || [],
            interests: data.profile.interests,
            commitment: data.profile.commitment,
            location: data.profile.location,
            contactEmail: data.profile.contactEmail || '',
            contactPhone: data.profile.contactPhone || '',
            photoUrl: data.profile.photoUrl || ''
          });
        }
      } catch (error) {
        console.error('Failed to load profile', error);
      }
    };

    if (user) {
      loadProfile();
    }
  }, [user]);

  const addTag = (value: string, field: 'skills' | 'languages' | 'achievements' | 'verificationDocs', clear: () => void) => {
    const normalized = value.trim();
    if (!normalized) return;
    if (form[field].includes(normalized)) {
      clear();
      return;
    }
    setForm(prev => ({ ...prev, [field]: [...prev[field], normalized] }));
    clear();
  };

  const removeTag = (value: string, field: 'skills' | 'languages' | 'achievements' | 'verificationDocs') => {
    setForm(prev => ({ ...prev, [field]: prev[field].filter(item => item !== value) }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('saving');
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            skills: form.skills,
            languages: form.languages,
            achievements: form.achievements,
            verificationDocs: form.verificationDocs,
            contactEmail: form.contactEmail || undefined,
            contactPhone: form.contactPhone || undefined,
            photoUrl: form.photoUrl || undefined
          })
      });

      if (!response.ok) {
        setStatus('error');
        return;
      }

      setStatus('saved');
      setToast(t('toast.saved'));
      setTimeout(() => {
        setStatus('idle');
        router.push('/profiles');
      }, 1200);
    } catch (error) {
      console.error('Failed to save profile', error);
      setStatus('error');
    }
  };

  if (loading) {
    return (
      <BackgroundImage imageIndex={3} overlay="gradient" overlayOpacity={0.8}>
        <div className="flex items-center justify-center">
          <div className="text-[var(--accent-strong)] text-xl">{common('loading')}</div>
        </div>
      </BackgroundImage>
    );
  }

  if (!user) {
    return (
      <BackgroundImage imageIndex={3} overlay="gradient" overlayOpacity={0.8}>
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
    <BackgroundImage imageIndex={3} overlay="gradient" overlayOpacity={0.8}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 animate-fade-up">
        <div className="mb-6 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            {t('title')} <span className="text-yellow-500">{t('titleHighlight')}</span>
          </h1>
          <p className="text-[var(--text-muted)]">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="glass-card rounded-3xl p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">{t('labels.name')}</label>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm(prev => ({ ...prev, name: event.target.value }))}
                className="w-full px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">{t('labels.alias')}</label>
              <input
                type="text"
                value={form.alias}
                onChange={(event) => setForm(prev => ({ ...prev, alias: event.target.value }))}
                className="w-full px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder={t('labels.optional')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">{t('labels.role')}</label>
                <select
                  value={form.role}
                  onChange={(event) => setForm(prev => ({ ...prev, role: event.target.value as ProfileRole }))}
                  className="w-full px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {ROLE_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {t(`roles.${option}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">{t('labels.commitment')}</label>
                <select
                  value={form.commitment}
                  onChange={(event) => setForm(prev => ({ ...prev, commitment: event.target.value as CommitmentLevel }))}
                  className="w-full px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {COMMITMENT_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {t(`commitment.${option}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">{t('labels.skills')}</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(event) => setSkillInput(event.target.value)}
                  className="flex-1 px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder={t('placeholders.skill')}
                />
                <button
                  type="button"
                  onClick={() => addTag(skillInput, 'skills', () => setSkillInput(''))}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
                >
                  {t('actions.add')}
                </button>
              </div>
              {form.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.skills.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => removeTag(skill, 'skills')}
                      className="bg-yellow-400/20 text-yellow-600 px-3 py-1 rounded-full text-sm font-medium hover:bg-yellow-400 hover:text-black transition-all"
                    >
                      {skill} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">{t('labels.languages')}</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={languageInput}
                  onChange={(event) => setLanguageInput(event.target.value)}
                  className="flex-1 px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder={t('placeholders.language')}
                />
                <button
                  type="button"
                  onClick={() => addTag(languageInput, 'languages', () => setLanguageInput(''))}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
                >
                  {t('actions.add')}
                </button>
              </div>
              {form.languages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.languages.map(language => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => removeTag(language, 'languages')}
                      className="bg-yellow-400/20 text-yellow-600 px-3 py-1 rounded-full text-sm font-medium hover:bg-yellow-400 hover:text-black transition-all"
                    >
                      {language} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">{t('labels.interests')}</label>
              <textarea
                value={form.interests}
                onChange={(event) => setForm(prev => ({ ...prev, interests: event.target.value }))}
                className="w-full px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:ring-2 focus:ring-yellow-500 focus:border-transparent min-h-[120px]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">{t('labels.achievements')}</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={achievementInput}
                  onChange={(event) => setAchievementInput(event.target.value)}
                  className="flex-1 px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder={t('placeholders.achievement')}
                />
                <button
                  type="button"
                  onClick={() => addTag(achievementInput, 'achievements', () => setAchievementInput(''))}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
                >
                  {t('actions.add')}
                </button>
              </div>
              {form.achievements.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.achievements.map(achievement => (
                    <button
                      key={achievement}
                      type="button"
                      onClick={() => removeTag(achievement, 'achievements')}
                      className="bg-yellow-400/20 text-yellow-600 px-3 py-1 rounded-full text-sm font-medium hover:bg-yellow-400 hover:text-black transition-all"
                    >
                      {achievement} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">{t('labels.verificationDocs')}</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  value={docInput}
                  onChange={(event) => setDocInput(event.target.value)}
                  className="flex-1 px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder={t('placeholders.verificationDocs')}
                />
                <button
                  type="button"
                  onClick={() => addTag(docInput, 'verificationDocs', () => setDocInput(''))}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
                >
                  {t('actions.add')}
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">{t('verificationDocsHint')}</p>
              {form.verificationDocs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.verificationDocs.map(doc => (
                    <button
                      key={doc}
                      type="button"
                      onClick={() => removeTag(doc, 'verificationDocs')}
                      className="bg-yellow-400/20 text-yellow-600 px-3 py-1 rounded-full text-sm font-medium hover:bg-yellow-400 hover:text-black transition-all"
                    >
                      {doc} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">{t('labels.location')}</label>
              <input
                type="text"
                value={form.location}
                onChange={(event) => setForm(prev => ({ ...prev, location: event.target.value }))}
                className="w-full px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder={t('placeholders.location')}
                required
              />
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-[var(--text)]">{t('contact.title')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">{t('contact.email')}</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => setForm(prev => ({ ...prev, contactEmail: event.target.value }))}
                  className="w-full px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder={t('placeholders.contactEmail')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">{t('contact.phone')}</label>
                <input
                  type="text"
                  value={form.contactPhone}
                  onChange={(event) => setForm(prev => ({ ...prev, contactPhone: event.target.value }))}
                  className="w-full px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder={t('placeholders.contactPhone')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">{t('labels.photoUrl')}</label>
              <input
                type="url"
                value={form.photoUrl}
                onChange={(event) => setForm(prev => ({ ...prev, photoUrl: event.target.value }))}
                className="w-full px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder={t('placeholders.photoUrl')}
              />
              <p className="text-xs text-[var(--text-muted)] mt-2">{t('photoHint')}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-[var(--text-muted)]">
              {status === 'error' && 'Something went wrong. Please try again.'}
            </div>
            <button
              type="submit"
              disabled={status === 'saving'}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-8 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all disabled:opacity-60"
            >
              {status === 'saving' ? t('actions.saving') : t('actions.save')}
            </button>
          </div>
        </form>
      </div>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="glass-card rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--text)] shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </BackgroundImage>
  );
}
