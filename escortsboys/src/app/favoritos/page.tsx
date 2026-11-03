import type { Metadata } from 'next';
import { FavoritesList } from './FavoritesList';
import { getCurrentUser } from '@/lib/auth';
import { Alert } from '@/components/ui';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Favoritos', robots: { index: false } };

export default async function FavoritosPage({ searchParams }: { searchParams: Promise<{ bemvindo?: string }> }) {
  const [user, sp] = await Promise.all([getCurrentUser(), searchParams]);
  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-4 px-4 pb-12 pt-5 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-navy">Favoritos</h1>
      {sp.bemvindo ? <Alert tone="ok">Conta criada. Seus favoritos agora ficam salvos na sua conta.</Alert> : null}
      {!user ? (
        <p className="text-sm text-muted">Os favoritos ficam salvos neste navegador. <Link href="/login?next=/favoritos">Entre</Link> ou <Link href="/cadastro">crie uma conta</Link> para acessá-los em qualquer dispositivo.</p>
      ) : null}
      <FavoritesList />
    </main>
  );
}
