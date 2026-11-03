import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs, Card } from '@/components/ui';
import { getPlans } from '@/lib/repo';
import { ContactForm } from './ContactForm';
import { SUBJECTS } from './subjects';

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Fale com a equipe do EscortsBoys: dúvidas, anúncios e planos, remoção de conteúdo, privacidade e imprensa.',
  alternates: { canonical: '/contato' },
};

export default async function ContatoPage({ searchParams }: { searchParams: Promise<{ assunto?: string; plano?: string }> }) {
  const sp = await searchParams;
  const subject = SUBJECTS.some(([k]) => k === sp.assunto) ? sp.assunto! : sp.plano ? 'anuncio' : 'duvida';
  const plan = sp.plano ? (await getPlans()).find((p) => p.id === sp.plano)?.name : undefined;
  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-4 px-4 pb-14 pt-4 sm:px-6">
      <Breadcrumbs items={[{ href: '/', label: 'Início' }, { label: 'Contato' }]} />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <section className="min-w-0 flex-1 rounded border border-line bg-white p-5 sm:p-7">
          <h1 className="text-2xl font-bold tracking-tight text-navy">Contato</h1>
          <p className="mb-5 mt-1 text-sm text-muted">Respondemos em até 2 dias úteis.{plan ? ` Assunto: plano ${plan}.` : ''}</p>
          <ContactForm subject={subject} plan={plan} />
        </section>
        <aside className="flex w-full flex-col gap-3 lg:w-[340px] lg:shrink-0">
          <Card className="border-danger p-5">
            <h2 className="text-base font-bold text-navy">Remoção urgente de conteúdo</h2>
            <p className="mt-1.5 text-sm leading-relaxed">Se você aparece em um anúncio sem autorização, ou se há suspeita de menor de idade, use o link <strong>“Denunciar este anúncio”</strong> na própria página do anúncio — ele vai direto para a fila prioritária da moderação.</p>
            <p className="mt-2 text-sm leading-relaxed">Sem o link? Escolha o assunto “Remoção de conteúdo” e informe o endereço do anúncio.</p>
          </Card>
          <Card className="p-5">
            <h2 className="text-base font-bold text-navy">Outros canais</h2>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm">
              <li>Conteúdo envolvendo menores: SaferNet (new.safernet.org.br) ou Disque 100.</li>
              <li>Emergências: 190.</li>
              <li>Pedidos sobre seus dados: <Link href="/privacidade#direitos">direitos do titular</Link>.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </main>
  );
}
