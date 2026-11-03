import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/painel', '/admin', '/api/', '/login', '/cadastro', '/recuperar-senha', '/favoritos'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
