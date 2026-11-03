import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdvertiserPitch, AuthShell } from '@/components/auth/AuthShell';
import { SignupForm } from '@/components/auth/SignupForm';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Criar conta', robots: { index: false } };

export default async function CadastroPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  if (await getCurrentUser()) redirect('/painel');
  const sp = await searchParams;
  return (
    <AuthShell title="Criar conta" subtitle="Cadastro exclusivo para maiores de 18 anos." aside={<AdvertiserPitch />}>
      <SignupForm defaultIntent={sp.tipo === 'anunciante' ? 'advertiser' : 'user'} />
    </AuthShell>
  );
}
