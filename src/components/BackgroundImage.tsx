'use client';

import { useEffect, useState } from 'react';
import { getSplashImage } from '@/lib/splash-images';

interface BackgroundImageProps {
  imageIndex: number;
  overlay?: 'light' | 'dark' | 'gradient';
  overlayOpacity?: number;
  children: React.ReactNode;
  className?: string;
}

export default function BackgroundImage({
  imageIndex,
  overlay = 'dark',
  overlayOpacity = 0.7,
  children,
  className = ''
}: BackgroundImageProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { src, alt } = getSplashImage(imageIndex);

  const overlayStyles = {
    light: `rgba(255, 255, 255, ${overlayOpacity})`,
    dark: `rgba(0, 0, 0, ${overlayOpacity})`,
    gradient: `linear-gradient(to bottom, rgba(0, 0, 0, ${overlayOpacity * 0.5}), rgba(0, 0, 0, ${overlayOpacity}))`
  };

  return (
    <div className={`relative min-h-screen ${className}`}>
      {mounted && (
        <>
          <div
            className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
            style={{ backgroundImage: `url(${src})` }}
            role="img"
            aria-label={alt}
          />
          <div
            className="fixed inset-0 -z-10"
            style={{ background: overlayStyles[overlay] }}
          />
        </>
      )}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
}
