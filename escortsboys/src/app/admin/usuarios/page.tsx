import { AdminForm } from '@/components/admin/AdminForm';
import { AdminPage, ROLE_LABEL, Td, Th } from '@/components/admin/AdminPage';
import { Badge, Card, EmptyState } from '@/components/ui';
import { userAction } from '@/app/actions/admin';
import { requireAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { adminListUsers } from '@/lib/repo';

export const metadata = { title: 'Usuários' };

export default async function UsuariosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [me, sp] = await Promise.all([requireAdmin(), searchParams]);
  const users = await adminListUsers((sp.q ?? '').trim());
  return (
    <AdminPage title="Usuários" description={`${users.length} conta(s)`}>
      <form method="get" role="search" className="flex max-w-lg gap-2">
        <label htmlFor="u-q" className="sr-only">Buscar usuários</label>
        <input id="u-q" name="q" defaultValue={sp.q} placeholder="Nome ou e-mail" className="h-10 flex-1 rounded border border-line px-3 text-sm" />
        <button type="submit" className="h-10 rounded bg-brand px-4 text-sm font-semibold text-white">Buscar</button>
      </form>
      {users.length ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead><tr><Th>Usuário</Th><Th>Papel</Th><Th>Status</Th><Th>Anúncios</Th><Th>Criado em</Th><Th>Ações</Th></tr></thead>
            <tbody>
              {users.map((u) => {
                const self = u.id === me.id;
                return (
                  <tr key={u.id}>
                    <Td><span className="font-semibold">{u.name}</span><div className="break-all text-xs text-muted">{u.email}</div></Td>
                    <Td>{ROLE_LABEL[u.role]}</Td>
                    <Td>{u.status === 'active' ? <Badge tone="ok">Ativo</Badge> : <Badge tone="danger">Suspenso</Badge>}</Td>
                    <Td>{u.ads}</Td>
                    <Td className="whitespace-nowrap text-muted">{formatDate(u.createdAt)}</Td>
                    <Td>
                      {self ? <span className="text-xs text-muted">Sua conta</span> : (
                        <div className="flex flex-col gap-2">
                          <AdminForm action={userAction} submitLabel="Alterar papel" variant="ghost" inline>
                            <input type="hidden" name="userId" value={u.id} />
                            <label htmlFor={`role-${u.id}`} className="sr-only">Papel de {u.email}</label>
                            <select id={`role-${u.id}`} name="role" defaultValue={u.role} className="h-9 rounded border border-line bg-white px-2 text-[13px]">
                              <option value="user">Usuário</option><option value="advertiser">Anunciante</option><option value="admin">Administrador</option>
                            </select>
                          </AdminForm>
                          <AdminForm action={userAction} inline variant={u.status === 'active' ? 'danger' : 'success'} submitLabel={u.status === 'active' ? 'Suspender' : 'Reativar'}
                            confirmText={u.status === 'active' ? `Suspender ${u.email}? A sessão será encerrada e os anúncios deixam de aparecer.` : undefined}>
                            <input type="hidden" name="userId" value={u.id} />
                            <input type="hidden" name="status" value={u.status === 'active' ? 'suspended' : 'active'} />
                          </AdminForm>
                        </div>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : <EmptyState title="Nenhum usuário encontrado" />}
    </AdminPage>
  );
}
