'use client';

import Image from 'next/image';
import { useRef, useState, useTransition } from 'react';
import { setAvatarAction } from '@/app/actions/painel';
import { IconUpload, IconUser } from '../icons';
import { Alert, Button } from '../ui';
import { uploadPhoto } from './upload';

export function AvatarUpload({ initial }: { initial: string | null }) {
  const [url, setUrl] = useState(initial);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const onFile = async (file?: File) => {
    if (!file) return;
    setError('');
    setProgress(0);
    try {
      const photo = await uploadPhoto(file, setProgress);
      start(async () => {
        const res = await setAvatarAction(photo.url);
        if (res.ok) setUrl(photo.url); else setError(res.error ?? 'Erro ao salvar.');
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProgress(null);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-line text-steel">
        {url ? <Image src={url} alt="Foto de perfil atual" fill sizes="96px" unoptimized={url.endsWith('.svg')} className="object-cover" /> : <IconUser size={36} />}
      </div>
      <div className="flex flex-col gap-2">
        <input ref={input} id="avatar" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => input.current?.click()} disabled={progress !== null || pending}>
            <IconUpload size={16} /> {progress !== null ? `Enviando ${progress}%` : url ? 'Trocar foto' : 'Enviar foto'}
          </Button>
          {url ? <Button variant="ghost" size="sm" disabled={pending} onClick={() => start(async () => { const r = await setAvatarAction(null); if (r.ok) setUrl(null); })}>Remover</Button> : null}
        </div>
        <p className="text-xs text-muted">JPG, PNG ou WebP, mínimo 400 × 400 px, até 10 MB. O rosto é opcional.</p>
        {error ? <Alert tone="error">{error}</Alert> : null}
      </div>
    </div>
  );
}
