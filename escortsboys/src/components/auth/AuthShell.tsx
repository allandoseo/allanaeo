import type { ReactNode } from 'react';

export function AuthShell({ title, subtitle, children, aside }: { title: string; subtitle?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-[1080px] flex-col gap-8 px-4 py-8 sm:px-6 md:flex-row md:items-start">
      <section className="w-full rounded border border-line bg-white p-6 sm:p-8 md:max-w-[480px] md:flex-1">
        <h1 className="text-2xl font-bold tracking-tight text-navy">{title}</h1>
        {subtitle ? <div className="mt-1 text-sm text-muted">{subtitle}</div> : null}
        <div className="mt-5">{children}</div>
      </section>
      {aside ? <aside className="flex flex-1 flex-col gap-3 md:pt-2">{aside}</aside> : null}
    </main>
  );
}

export function AdvertiserPitch() {
  return (
    <>
      <h2 className="text-xl font-bold text-navy">Anuncie com controle total do seu perfil</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed">
        <li>Você decide quais fotos, valores e contatos aparecem.</li>
        <li>Atualize a disponibilidade em poucos segundos.</li>
        <li>Acompanhe visualizações e cliques em contato.</li>
        <li>Pause ou exclua o anúncio quando quiser.</li>
      </ul>
      <p className="text-[13px] leading-relaxed text-muted">Seu e-mail e documentos nunca são exibidos publicamente. Tratamos dados pessoais conforme a LGPD.</p>
    </>
  );
}
