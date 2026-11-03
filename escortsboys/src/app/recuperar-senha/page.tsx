import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';
import { ForgotForm } from '@/components/auth/ForgotForm';

export const metadata: Metadata = { title: 'Recuperar senha', robots: { index: false } };

export default function RecuperarSenhaPage() {
  return (
    <AuthShell title="Recuperar senha" subtitle="Informe o e-mail da sua conta. Enviaremos um link válido por 1 hora.">
      <ForgotForm />
    </AuthShell>
  );
}
