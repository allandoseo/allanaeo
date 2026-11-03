import type { Metadata } from 'next';
import { AdminNav } from '@/components/admin/AdminNav';
import { requireAdmin } from '@/lib/auth';
import { adminOverview } from '@/lib/repo';

export const metadata: Metadata = { title: { default: 'Administração', template: '%s · Administração' }, robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const o = await adminOverview();
  const items = [
    { href: '/admin', label: 'Visão geral' },
    { href: '/admin/moderacao', label: 'Fila de moderação', count: o.pendingAds },
    { href: '/admin/anuncios', label: 'Anúncios' },
    { href: '/admin/denuncias', label: 'Denúncias', count: o.openReports },
    { href: '/admin/verificacoes', label: 'Verificações', count: o.pendingVerifications },
    { href: '/admin/usuarios', label: 'Usuários' },
    { href: '/admin/mensagens', label: 'Mensagens', count: o.unreadMessages },
    { href: '/admin/categorias', label: 'Categorias' },
    { href: '/admin/cidades', label: 'Cidades' },
    { href: '/admin/planos', label: 'Planos' },
    { href: '/admin/configuracoes', label: 'Configurações' },
  ];
  return (
    <main className="mx-auto flex w-full max-w-[1360px] flex-col gap-4 px-4 pb-12 pt-4 sm:px-6">
      <p className="text-xs text-muted">Administração · conectado como {admin.email} · ações registradas em log de auditoria</p>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <AdminNav items={items} />
        {children}
      </div>
    </main>
  );
}
