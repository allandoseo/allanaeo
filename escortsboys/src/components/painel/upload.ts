'use client';

import type { Photo } from '@/lib/types';

/** Envia um arquivo para /api/upload com progresso (XMLHttpRequest). */
export function uploadPhoto(file: File, onProgress: (pct: number) => void): Promise<Photo> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data: { error?: string } & Partial<Photo> = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* resposta inválida */ }
      if (xhr.status >= 200 && xhr.status < 300 && data.url) resolve(data as Photo);
      else reject(new Error(data.error || 'Falha no envio. Tente novamente.'));
    };
    xhr.onerror = () => reject(new Error('Falha de conexão durante o envio.'));
    const fd = new FormData();
    fd.append('file', file);
    xhr.send(fd);
  });
}
