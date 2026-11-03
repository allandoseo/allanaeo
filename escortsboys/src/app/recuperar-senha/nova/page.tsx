import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';
import { ResetForm } from '@/components/auth/ResetForm';
import { Alert } from '@/components/ui';
import { isResetTokenValid } from '@/lib/repo';

export const metadata: Metadata = { title: 'Criar nova senha', robots: { index: false } };

export default async function NovaSenhaPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? '';
  const valid = token.length >= 20 && (await isResetTokenValid(token));
  return (
    <AuthShell title="Criar nova senha">
      {valid ? <ResetForm token={token} /> : (
        <Alert tone="error">Este link é inválido, já foi usado ou expirou. <Link href="/recuperar-senha">Solicitar um novo link</Link>.</Alert>
      )}
    </AuthShell>
  );
}
