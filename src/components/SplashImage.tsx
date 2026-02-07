import { getSplashImage } from '@/lib/splash-images';

interface SplashImageProps {
  index: number;
  className?: string;
  size: number;
  overlayClassName?: string;
}

export default function SplashImage({ index, className = '', size, overlayClassName }: SplashImageProps) {
  const { src, alt } = getSplashImage(index);
  const overlay = overlayClassName ?? 'bg-[var(--background)]/65';

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover"
      />
      <div className={`absolute inset-0 ${overlay}`} aria-hidden="true" />
    </div>
  );
}
