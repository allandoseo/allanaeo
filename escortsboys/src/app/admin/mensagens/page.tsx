import { AdminForm } from '@/components/admin/AdminForm';
import { AdminPage } from '@/components/admin/AdminPage';
import { Badge, Card, EmptyState } from '@/components/ui';
import { markMessageAction } from '@/app/actions/admin';
import { formatDateTime } from '@/lib/format';
import { adminListMessages } from '@/lib/repo';

export const metadata = { title: 'Mensagens' };

const SUBJECT: Record<string, string> = { duvida: 'Dúvida', anuncio: 'Sobre anúncios', remocao: 'Remoção de conteúdo', privacidade: 'Privacidade / LGPD', imprensa: 'Imprensa', outro: 'Outro' };

export default async function MensagensPage() {
  const msgs = await adminListMessages();
  return (
    <AdminPage title="Mensagens de contato" description="Enviadas pelo formulário da página Contato. Pedidos de remoção e privacidade têm prazo prioritário.">
      {msgs.length === 0 ? <EmptyState title="Nenhuma mensagem recebida" /> : null}
      {msgs.map((m) => (
        <Card key={m.id} className={`flex flex-col gap-2 p-4 ${m.handled ? 'opacity-75' : ''}`}>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-navy">{SUBJECT[m.subject] ?? m.subject}</h2>
            {m.subject === 'remocao' || m.subject === 'privacidade' ? <Badge tone="warn">Prioritária</Badge> : null}
            {m.handled ? <Badge tone="ok">Tratada</Badge> : <Badge tone="brand">Nova</Badge>}
          </div>
          <p className="text-xs text-muted">{m.name} · <a href={`mailto:${m.email}`}>{m.email}</a> · {formatDateTime(m.createdAt)}</p>
          <p className="whitespace-pre-line text-sm">{m.message}</p>
          {!m.handled ? (
            <AdminForm action={markMessageAction} submitLabel="Marcar como tratada" variant="ghost" inline>
              <input type="hidden" name="id" value={m.id} />
            </AdminForm>
          ) : null}
        </Card>
      ))}
    </AdminPage>
  );
}
