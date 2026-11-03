import { logoutAllAction } from '@/app/actions/painel';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteAccountForm, NameForm, PasswordForm } from '@/components/painel/SettingsForms';
import { Card, PageHeading } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'Configurações' };

export default async function ConfiguracoesPage() {
  const user = await requireUser('/painel/configuracoes');
  return (
    <>
      <PageHeading title="Configurações">E-mail da conta: <strong className="text-ink">{user.email}</strong> · conta criada em {formatDate(user.createdAt)}</PageHeading>
      <Card className="p-5"><h2 className="mb-3 text-base font-bold text-navy">Dados da conta</h2><NameForm name={user.name} /></Card>
      <Card className="p-5"><h2 className="mb-3 text-base font-bold text-navy">Senha</h2><PasswordForm /></Card>
      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-base font-bold text-navy">Sessões</h2>
        <p className="text-sm">Encerra o acesso em todos os dispositivos, inclusive este.</p>
        <form action={logoutAllAction} className="sm:max-w-[260px]"><SubmitButton pendingText="Encerrando…">Sair de todos os dispositivos</SubmitButton></form>
      </Card>
      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-base font-bold text-navy">Seus dados (LGPD)</h2>
        <p className="text-sm">Baixe uma cópia dos dados que mantemos sobre você: conta, perfil, anúncios, favoritos e denúncias enviadas.</p>
        <a href="/painel/configuracoes/exportar" download className="inline-flex h-11 w-fit items-center rounded border border-brand px-4 text-sm font-semibold text-brand no-underline hover:bg-sky hover:no-underline">Exportar meus dados (JSON)</a>
      </Card>
      <Card className="flex flex-col gap-3 border-red-200 p-5">
        <h2 className="text-base font-bold text-danger">Excluir conta</h2>
        <DeleteAccountForm />
      </Card>
    </>
  );
}
