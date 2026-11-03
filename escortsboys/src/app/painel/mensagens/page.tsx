import { Bar, shortDate } from '@/components/painel/Bars';
import { Alert, Card, EmptyState, LinkButton, PageHeading } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { getOwnerStats } from '@/lib/repo';

export const metadata = { title: 'Mensagens e contatos' };

export default async function MensagensPage() {
  const user = await requireUser('/painel/mensagens');
  const stats = await getOwnerStats(user.id, 30);
  const days = stats.series.filter((s) => s.contacts > 0).reverse();
  const maxDay = Math.max(0, ...days.map((d) => d.contacts));
  const perAd = stats.perAd.filter((a) => a.contactClicks > 0).sort((a, b) => b.contactClicks - a.contactClicks);
  const maxAd = Math.max(0, ...perAd.map((a) => a.contactClicks));
  return (
    <>
      <PageHeading title="Mensagens e contatos" />
      <Alert tone="info">
        O EscortsBoys não tem chat interno e não lê suas conversas. Os visitantes falam com você diretamente pelos canais que você autorizou no anúncio (WhatsApp, telefone ou Telegram).
        Aqui você acompanha quantas vezes esses botões foram usados — sem dados pessoais de quem clicou.
      </Alert>
      {!days.length ? (
        <EmptyState title="Nenhum clique em contato nos últimos 30 dias" action={<LinkButton href="/painel/anuncios">Revisar anúncios</LinkButton>}>
          Confira se o anúncio está ativo e se pelo menos um contato está autorizado para exibição (etapa 9).
        </EmptyState>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="p-4">
            <h2 className="mb-3 text-base font-bold text-navy">Por dia</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {days.map((d) => <li key={d.date} className="grid grid-cols-[52px_1fr] items-center gap-2"><span className="text-muted">{shortDate(d.date)}</span><Bar value={d.contacts} max={maxDay} label="Contatos" /></li>)}
            </ul>
          </Card>
          <Card className="p-4">
            <h2 className="mb-3 text-base font-bold text-navy">Por anúncio (total)</h2>
            <ul className="flex flex-col gap-3 text-sm">
              {perAd.map((a) => <li key={a.id}><p className="mb-1 truncate">{a.title || 'Anúncio sem título'}</p><Bar value={a.contactClicks} max={maxAd} label="Contatos" /></li>)}
            </ul>
          </Card>
        </div>
      )}
    </>
  );
}
