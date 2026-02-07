const DEFAULT_IMAGES = [
  {
    src: '/images/team-success.jpg',
    alt: 'Abstract golden glow'
  },
  {
    src: '/images/video-conference.jpg',
    alt: 'Geometric grid pattern'
  },
  {
    src: '/images/laptop-meeting.jpg',
    alt: 'Team collaboration illustration'
  },
  {
    src: '/images/couple-laptop.jpg',
    alt: 'Founder matchmaking illustration'
  },
  {
    src: '/images/team-blocks.jpg',
    alt: 'Anonymous founder avatar'
  }
];

const ENV_URL_KEYS = [
  'NEXT_PUBLIC_SPLASH_IMAGE_1_URL',
  'NEXT_PUBLIC_SPLASH_IMAGE_2_URL',
  'NEXT_PUBLIC_SPLASH_IMAGE_3_URL',
  'NEXT_PUBLIC_SPLASH_IMAGE_4_URL',
  'NEXT_PUBLIC_SPLASH_IMAGE_5_URL'
];

const ENV_ALT_KEYS = [
  'NEXT_PUBLIC_SPLASH_IMAGE_1_ALT',
  'NEXT_PUBLIC_SPLASH_IMAGE_2_ALT',
  'NEXT_PUBLIC_SPLASH_IMAGE_3_ALT',
  'NEXT_PUBLIC_SPLASH_IMAGE_4_ALT',
  'NEXT_PUBLIC_SPLASH_IMAGE_5_ALT'
];

const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|avif|svg)$/i;
const ALLOW_PAGE_URLS = process.env.NEXT_PUBLIC_SPLASH_ALLOW_PAGE_URLS === 'true';

const isValidUrl = (value: string) => {
  if (value.startsWith('/')) return true;
  if (!value.startsWith('http://') && !value.startsWith('https://')) return false;
  try {
    const parsed = new URL(value);
    if (IMAGE_EXTENSIONS.test(parsed.pathname)) return true;
    return ALLOW_PAGE_URLS;
  } catch {
    return false;
  }
};

export function getSplashImage(index: number) {
  const safeIndex = Math.max(0, Math.min(DEFAULT_IMAGES.length - 1, index - 1));
  const urlKey = ENV_URL_KEYS[safeIndex];
  const altKey = ENV_ALT_KEYS[safeIndex];
  const envUrl = urlKey ? process.env[urlKey] : undefined;
  const envAlt = altKey ? process.env[altKey] : undefined;

  const src = envUrl && isValidUrl(envUrl) ? envUrl : DEFAULT_IMAGES[safeIndex].src;
  const alt = envAlt && envAlt.trim().length > 0 ? envAlt : DEFAULT_IMAGES[safeIndex].alt;

  return { src, alt };
}
