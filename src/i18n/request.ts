import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

function resolveLocale(value?: string | null): Locale | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  const base = normalized.split('-')[0];
  return (locales as readonly string[]).includes(base) ? (base as Locale) : null;
}

function resolveFromAcceptLanguage(value?: string | null): Locale | null {
  if (!value) return null;
  const parts = value.split(',').map(part => part.trim());
  for (const part of parts) {
    const locale = resolveLocale(part.split(';')[0]);
    if (locale) return locale;
  }
  return null;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieLocale = resolveLocale(cookieStore.get('NEXT_LOCALE')?.value);
  const headerLocale = resolveFromAcceptLanguage(headerStore.get('accept-language'));
  const locale = cookieLocale || headerLocale || defaultLocale;

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages
  };
});
