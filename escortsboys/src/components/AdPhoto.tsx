import Image from 'next/image';
import { IconCamera } from './icons';
import { cx } from './ui';
import type { Photo } from '@/lib/types';

/** Foto com otimização (next/image) e lazy loading; SVGs ilustrativos não passam pelo otimizador. */
export function AdPhoto({ photo, sizes, priority, className, fit = 'cover' }: { photo?: Photo; sizes: string; priority?: boolean; className?: string; fit?: 'cover' | 'contain' }) {
  if (!photo) {
    return (
      <div className={cx('flex h-full w-full flex-col items-center justify-center gap-1.5 bg-line text-steel', className)}>
        <IconCamera size={28} />
        <span className="text-xs">Sem foto</span>
      </div>
    );
  }
  return (
    <Image
      src={photo.url}
      alt={photo.alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={photo.url.endsWith('.svg')}
      className={cx(fit === 'cover' ? 'object-cover' : 'object-contain', className)}
    />
  );
}
