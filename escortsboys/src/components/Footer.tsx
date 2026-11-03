import Link from 'next/link';
import { getCities, getCoverage } from '@/lib/repo';

export async function Footer() {
  const [cities, coverage] = await Promise.all([getCities(), getCoverage()]);
  const withAds = cities.filter((c) => (coverage[c.slug]?.total ?? 0) > 0);
  return (
    <footer className="mt-auto bg-navy text-[13px] text-sky">
      <div className="mx-auto grid max-w-page gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="text-base font-bold text-white">EscortsBoys</p>
          <p className="mt-2 leading-relaxed text-sky/90">Plataforma de anúncios de acompanhantes masculinos adultos. Os anúncios são publicados pelos próprios anunciantes e passam por moderação.</p>
        </div>
        <div>
          <p className="font-semibold text-white">Acompanhantes por cidade</p>
          <ul className="mt-2 space-y-1.5">
            {withAds.map((c) => <li key={c.slug}><Link className="text-sky" href={`/acompanhantes/${c.slug}`}>{c.name}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Plataforma</p>
          <ul className="mt-2 space-y-1.5">
            <li><Link className="text-sky" href="/anuncios">Todos os anúncios</Link></li>
            <li><Link className="text-sky" href="/anunciar">Anuncie</Link></li>
            <li><Link className="text-sky" href="/sobre">Sobre</Link></li>
            <li><Link className="text-sky" href="/contato">Contato</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Segurança e privacidade</p>
          <ul className="mt-2 space-y-1.5">
            <li><Link className="text-sky" href="/seguranca">Segurança</Link></li>
            <li><Link className="text-sky" href="/diretrizes">Diretrizes de conteúdo</Link></li>
            <li><Link className="text-sky" href="/privacidade">Privacidade (LGPD)</Link></li>
            <li><Link className="text-sky" href="/termos">Termos de uso</Link></li>
            <li><Link className="text-sky" href="/contato?assunto=remocao">Remoção de conteúdo</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-page px-4 py-4 text-sky/80 sm:px-6">© {new Date().getFullYear()} EscortsBoys. Proibido para menores de 18 anos.</p>
      </div>
    </footer>
  );
}
