import Link from 'next/link';
import { AdminForm } from '@/components/admin/AdminForm';
import { AdminPage } from '@/components/admin/AdminPage';
import { DecisionDialog } from '@/components/admin/DecisionDialog';
import { Alert, Badge, Card, EmptyState } from '@/components/ui';
import { verifyAction } from '@/app/actions/admin';
import { formatDateTime } from '@/lib/format';
import { adminListVerifications } from '@/lib/repo';

export const metadata = { title: 'Verificações' };

export default async function VerificacoesPage() {
  const rows = await adminListVerifications();
  return (
    <AdminPage title="Verificações de perfil" description="Solicitações de selo de perfil verificado.">
      <Alert tone="warn">
        A validação documental (documento oficial com foto, prova de maioridade e correspondência com as fotos do anúncio) é feita manualmente ou por serviço externo de verificação de identidade. Só marque como verificado após concluir essa checagem fora do sistema. Perfis de demonstração não podem ser verificados.
      </Alert>
      {rows.length === 0 ? <EmptyState title="Nenhuma verificação pendente" /> : null}
      {rows.map(({ profile: p, email }) => (
        <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold text-navy">{p.publicName} {p.isDemo ? <Badge>Exemplo</Badge> : null}</p>
            <p className="text-xs text-muted">{email} · perfil /{p.slug} · atualizado {formatDateTime(p.updatedAt)}</p>
            <Link href={`/admin/anuncios?q=${encodeURIComponent(email)}`} className="text-[13px]">Ver anúncios do perfil</Link>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            <AdminForm action={verifyAction} submitLabel="Aprovar verificação" variant="success" inline confirmText="Confirma que a documentação foi validada?">
              <input type="hidden" name="profileId" value={p.id} />
              <input type="hidden" name="decision" value="verified" />
            </AdminForm>
            <DecisionDialog label="Rejeitar" title="Rejeitar verificação" action={verifyAction} hidden={{ profileId: p.id, decision: 'rejected' }} noteLabel="Motivo (enviado ao anunciante)" />
          </div>
        </Card>
      ))}
    </AdminPage>
  );
}
