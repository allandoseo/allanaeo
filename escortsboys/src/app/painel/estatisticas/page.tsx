import { Bar, shortDate } from '@/components/painel/Bars';
import { AdStatusBadge } from '@/components/painel/status';
import { Card, EmptyState, LinkButton, PageHeading } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { getOwnerStats } from '@/lib/repo';

export const metadata = { title: 'Estatísticas' };

export default async function EstatisticasPage() {
  const user = await requireUser('/painel/estatisticas');
  const stats = await getOwnerStats(user.id, 30);
  const maxViews = Math.max(0, ...stats.series.map((s) => s.views));
  const rows = [...stats.series].reverse();
  return (
    <>
      <PageHeading title="Estatísticas">Últimos 30 dias. Visualizações contam uma vez por sessão do navegador; robôs são ignorados.</PageHeading>
      {!stats.hasData ? (
        <EmptyState title="Ainda não há dados" action={<LinkButton href="/painel/anuncios">Ver meus anúncios</LinkButton>}>
          As estatísticas começam a ser registradas quando um anúncio seu estiver ativo e receber visitas.
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[['Visualizações', stats.totals.views], ['Cliques em contato', stats.totals.contacts], ['Favoritos', stats.totals.favorites]].map(([l, v]) => (
              <Card key={l} className="p-4"><p className="text-xs text-muted">{l}</p><p className="mt-1 text-2xl font-bold text-navy">{Number(v).toLocaleString('pt-BR')}</p></Card>
            ))}
          </div>
          <Card>
            <h2 className="border-b border-line px-4 py-3 text-base font-bold text-navy">Por dia</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead><tr className="text-left text-xs text-muted"><th scope="col" className="px-4 py-2 font-semibold">Data</th><th scope="col" className="px-4 py-2 font-semibold">Visualizações</th><th scope="col" className="px-4 py-2 text-right font-semibold">Contatos</th><th scope="col" className="px-4 py-2 text-right font-semibold">Favoritos</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.date} className="border-t border-line">
                      <th scope="row" className="px-4 py-2 text-left font-normal">{shortDate(r.date)}</th>
                      <td className="px-4 py-2"><Bar value={r.views} max={maxViews} label="Visualizações" /></td>
                      <td className="px-4 py-2 text-right tabular-nums">{r.contacts}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{r.favorites}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
      {stats.perAd.length ? (
        <Card>
          <h2 className="border-b border-line px-4 py-3 text-base font-bold text-navy">Por anúncio (desde a publicação)</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead><tr className="text-left text-xs text-muted"><th scope="col" className="px-4 py-2 font-semibold">Anúncio</th><th scope="col" className="px-4 py-2 font-semibold">Status</th><th scope="col" className="px-4 py-2 text-right font-semibold">Visualizações</th><th scope="col" className="px-4 py-2 text-right font-semibold">Contatos</th><th scope="col" className="px-4 py-2 text-right font-semibold">Favoritos</th></tr></thead>
              <tbody>
                {stats.perAd.map((a) => (
                  <tr key={a.id} className="border-t border-line">
                    <th scope="row" className="max-w-[260px] truncate px-4 py-2 text-left font-normal">{a.title || 'Anúncio sem título'}</th>
                    <td className="px-4 py-2"><AdStatusBadge status={a.status} /></td>
                    <td className="px-4 py-2 text-right tabular-nums">{a.views}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{a.contactClicks}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{a.favorites}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </>
  );
}
