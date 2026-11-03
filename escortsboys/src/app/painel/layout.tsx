import type { Metadata } from 'next';
import { PanelNav } from '@/components/painel/PanelNav';
import { requireUser } from '@/lib/auth';

export const metadata: Metadata = { title: { default: 'Painel do anunciante', template: '%s · Painel | EscortsBoys' }, robots: { index: false, follow: false } };

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('/painel');
  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-5 px-4 pb-12 pt-4 sm:px-6 lg:flex-row lg:items-start">
      <div className="flex flex-col gap-2 lg:sticky lg:top-4">
        <p className="hidden truncate px-1 text-xs text-muted lg:block">Conectado como <strong className="text-ink">{user.email}</strong></p>
        <PanelNav />
      </div>
      <main className="flex min-w-0 flex-1 flex-col gap-5">{children}</main>
    </div>
  );
}
