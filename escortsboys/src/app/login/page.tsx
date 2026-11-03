import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from '@/components/auth/LoginForm';
import { Alert } from '@/components/ui';
import { getCurrentUser, safeNext } from '@/lib/auth';

export const metadata: Metadata = { title: 'Entrar', robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; senha?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(safeNext(sp.next, user.role === 'admin' ? '/admin' : '/painel'));
  return (
    <AuthShell title="Entrar" subtitle="Acesse sua conta para gerenciar anúncios e favoritos.">
      {sp.senha === 'redefinida' ? <Alert tone="ok" className="mb-4">Senha redefinida. Entre com a nova senha.</Alert> : null}
      <LoginForm next={sp.next} />
    </AuthShell>
  );
}
