import Link from 'next/link';
import { AdPhoto } from '@/components/AdPhoto';
import { AdStatusBadge } from '@/components/painel/status';
import { Card, EmptyState, LinkButton, PageHeading } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { listAdsByOwner } from '@/lib/repo';

export const metadata = { title: 'Fotos' };

export default async function FotosPage() {
  const user = await requireUser('/painel/fotos');
  const ads = await listAdsByOwner(user.id);
  return (
    <>
      <PageHeading title="Fotos">As fotos são gerenciadas dentro de cada anúncio (etapa 8 do assistente).</PageHeading>
      <Card className="p-5">
        <h2 className="text-base font-bold text-navy">Regras de imagem</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          <li>Publique apenas fotos suas ou com autorização expressa de todas as pessoas retratadas.</li>
          <li>Todas as pessoas nas fotos devem ter 18 anos ou mais. Conteúdo envolvendo menores é removido e comunicado às autoridades.</li>
          <li>Não mostre documentos, placas de carro, fachadas, vistas da janela ou qualquer detalhe que revele seu endereço.</li>
          <li>Mostrar o rosto é opcional. Fotos editadas não podem enganar sobre sua aparência.</li>
          <li>Fotos podem ser removidas pela moderação ou a pedido da pessoa retratada.</li>
        </ul>
      </Card>
      {!ads.length ? (
        <EmptyState title="Nenhum anúncio ainda" action={<LinkButton href="/painel/anuncios/novo">Criar anúncio</LinkButton>}>Crie um anúncio para enviar fotos.</EmptyState>
      ) : ads.map((a) => (
        <Card key={a.id} className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2"><h2 className="font-bold text-navy">{a.title || a.publicName || 'Anúncio sem título'}</h2><AdStatusBadge status={a.status} /></div>
            <Link href={`/painel/anuncios/${a.id}/editar?etapa=8`} className="text-sm font-semibold">Gerenciar fotos</Link>
          </div>
          {a.photos.length ? (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {a.photos.map((p, i) => (
                <li key={p.id} className="relative aspect-[4/5] overflow-hidden rounded-sm bg-line">
                  <AdPhoto photo={p} sizes="120px" />
                  {i === 0 ? <span className="absolute left-1 top-1 rounded-sm bg-brand px-1 text-[10px] font-semibold text-white">Capa</span> : null}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">Sem fotos. <Link href={`/painel/anuncios/${a.id}/editar?etapa=8`}>Enviar fotos</Link></p>}
        </Card>
      ))}
    </>
  );
}
