import type { Metadata } from 'next';
import Link from 'next/link';
import { IconCheckBadge, IconClock, IconEye, IconShield, IconUser } from '@/components/icons';
import { Badge, Card, LinkButton } from '@/components/ui';
import { getCurrentUser } from '@/lib/auth';
import { formatBRL } from '@/lib/format';
import { getPlans } from '@/lib/repo';

export const metadata: Metadata = {
  title: 'Anuncie como acompanhante',
  description: 'Publique seu anúncio de acompanhante masculino com controle total do perfil: fotos, valores, contatos, disponibilidade e estatísticas. Moderação e privacidade.',
  alternates: { canonical: '/anunciar' },
};

const BENEFITS = [
  { icon: IconUser, title: 'Controle do próprio perfil', text: 'Você escreve a apresentação, escolhe as fotos, define valores e decide quais contatos aparecem. Pause ou exclua quando quiser.' },
  { icon: IconClock, title: 'Disponibilidade em segundos', text: 'Marque “disponível agora” ou atualize a agenda pelo celular. O status aparece nos resultados e expira sozinho para não ficar desatualizado.' },
  { icon: IconEye, title: 'Estatísticas reais', text: 'Acompanhe visualizações, cliques em WhatsApp e telefone e favoritos recebidos, por dia e por anúncio.' },
  { icon: IconShield, title: 'Privacidade por padrão', text: 'Nunca exibimos endereço. Seu número não fica no código da página e só é revelado quando o visitante pede.' },
];

const STEPS = [
  ['Crie sua conta', 'Cadastro com e-mail e confirmação de maioridade. Leva menos de um minuto.'],
  ['Monte o perfil', 'Nome público, cidade e apresentação. Nada de nome completo ou documento público.'],
  ['Publique o anúncio', 'Assistente em 10 etapas, com pré-visualização e rascunho salvo automaticamente.'],
  ['Moderação', 'A equipe confere maioridade, autorização das imagens e conformidade com as diretrizes.'],
  ['Anúncio no ar', 'Após aprovado, aparece na busca da sua cidade e nas páginas de região.'],
];

const FAQ = [
  ['Preciso enviar documento?', 'Para publicar, não. Para receber o selo “Perfil verificado”, sim: a validação é feita pela equipe e o documento nunca é exibido.'],
  ['Posso anunciar outra pessoa?', 'Não. Cada anúncio deve ser publicado pela própria pessoa anunciada. Anúncios de terceiros são removidos.'],
  ['Vocês intermediam pagamentos ou encontros?', 'Não. O EscortsBoys é uma plataforma de anúncios: o contato e a combinação são feitos diretamente entre as partes.'],
  ['Quanto tempo leva a moderação?', 'Normalmente algumas horas em dias úteis. Você acompanha o status no painel.'],
];

export default async function AnunciarPage() {
  const [user, plans] = await Promise.all([getCurrentUser(), getPlans()]);
  const startHref = user ? '/painel/anuncios/novo' : '/cadastro?tipo=anunciante';
  return (
    <main className="flex flex-col">
      <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-page flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-navy sm:text-[32px]">Anuncie no EscortsBoys</h1>
            <p className="mt-2 text-[16px] leading-relaxed text-ink">Seu perfil na frente de quem já está procurando um acompanhante na sua cidade. Você controla cada informação publicada.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <LinkButton href={startHref} size="lg">Começar cadastro</LinkButton>
            {!user ? <LinkButton href="/login?next=/painel/anuncios/novo" variant="ghost" size="lg">Já tenho conta</LinkButton> : null}
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-page flex-col gap-10 px-4 py-8 sm:px-6">
        <section aria-labelledby="beneficios">
          <h2 id="beneficios" className="text-xl font-bold text-navy">Por que anunciar aqui</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <li key={b.title} className="rounded border border-line bg-white p-4">
                <b.icon size={22} className="text-brand" />
                <h3 className="mt-2 font-bold text-navy">{b.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink">{b.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="como-funciona">
          <h2 id="como-funciona" className="text-xl font-bold text-navy">Como funciona</h2>
          <ol className="mt-4 grid gap-3 md:grid-cols-5">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="rounded border border-line bg-white p-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-brand text-sm font-bold text-white">{i + 1}</span>
                <h3 className="mt-2 font-bold text-navy">{t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="planos">
          <h2 id="planos" className="text-xl font-bold text-navy">Planos</h2>
          <p className="mt-1 text-sm text-muted">Condições e valores definidos pela administração. Você só escolhe o plano depois que o anúncio for aprovado.</p>
          {plans.length ? (
            <ul className="mt-4 grid gap-3 md:grid-cols-3">
              {plans.map((p) => (
                <li key={p.id} className={`flex flex-col rounded border bg-white p-5 ${p.highlight ? 'border-brand' : 'border-line'}`}>
                  <div className="flex items-center gap-2"><h3 className="text-lg font-bold text-navy">{p.name}</h3>{p.highlight ? <Badge tone="brand">Mais escolhido</Badge> : null}</div>
                  <p className="mt-1 text-sm text-muted">{p.description}</p>
                  <p className="mt-3 text-2xl font-bold text-navy">{p.priceCents != null ? formatBRL(p.priceCents / 100) : 'Valor a definir'}</p>
                  <p className="text-xs text-muted">a cada {p.periodDays} dias</p>
                  <ul className="mt-3 flex flex-1 flex-col gap-1.5 text-sm">
                    {p.features.map((f) => <li key={f} className="flex gap-2"><IconCheckBadge size={16} className="mt-0.5 shrink-0 text-ok" /> {f}</li>)}
                  </ul>
                  <LinkButton href={user ? `/painel/assinatura?plano=${p.id}` : `/cadastro?tipo=anunciante`} variant={p.highlight ? 'primary' : 'secondary'} className="mt-4">Escolher {p.name}</LinkButton>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-muted">Planos em definição. <Link href="/contato?assunto=anuncio">Fale com a equipe</Link>.</p>}
        </section>

        <section aria-labelledby="privacidade" className="grid gap-4 md:grid-cols-2">
          <Card className="p-5">
            <h2 id="privacidade" className="text-lg font-bold text-navy">Orientações de privacidade</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
              <li>Use um nome público diferente do seu nome civil.</li>
              <li>Informe apenas o bairro ou região — nunca endereço, prédio ou ponto de referência.</li>
              <li>Prefira um número de telefone exclusivo para atendimento.</li>
              <li>Remova metadados de localização das fotos e evite elementos que identifiquem sua casa.</li>
              <li>Você pode pedir a exclusão definitiva da conta e dos dados a qualquer momento.</li>
            </ul>
            <Link href="/privacidade" className="mt-3 inline-block text-sm font-semibold">Política de privacidade</Link>
          </Card>
          <Card className="p-5">
            <h2 className="text-lg font-bold text-navy">Regras essenciais</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
              <li>Somente maiores de 18 anos, anunciando a si mesmos.</li>
              <li>Fotos próprias e autorizadas por todas as pessoas que aparecem.</li>
              <li>Informações verdadeiras sobre idade, região e serviços.</li>
              <li>Contato apenas nos campos próprios, não no texto.</li>
            </ul>
            <Link href="/diretrizes" className="mt-3 inline-block text-sm font-semibold">Diretrizes de conteúdo</Link>
          </Card>
        </section>

        <section aria-labelledby="faq">
          <h2 id="faq" className="text-xl font-bold text-navy">Perguntas frequentes</h2>
          <div className="mt-3 flex flex-col gap-2">
            {FAQ.map(([q, a]) => (
              <details key={q} className="rounded border border-line bg-white px-4 py-3">
                <summary className="cursor-pointer font-semibold text-navy">{q}</summary>
                <p className="mt-2 text-sm leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="flex flex-col items-center gap-2 rounded border border-line bg-white p-6 text-center">
          <h2 className="text-lg font-bold text-navy">Pronto para começar?</h2>
          <LinkButton href={startHref} size="lg">Começar cadastro</LinkButton>
        </div>
      </div>
    </main>
  );
}
