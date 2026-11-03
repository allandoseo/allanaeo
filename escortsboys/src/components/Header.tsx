import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getCities } from '@/lib/repo';
import { logoutAction } from '@/app/actions/auth';
import { FavoritesCount } from './favorites';
import { IconHeart, IconLogout, IconSearch, IconUser } from './icons';
import { MobileMenu } from './MobileMenu';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight no-underline hover:no-underline ${light ? 'text-white' : 'text-navy'}`} aria-label="EscortsBoys — página inicial">
      <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-brand text-[13px] text-white">EB</span>
      EscortsBoys
    </Link>
  );
}

export async function Header() {
  const [user, cities] = await Promise.all([getCurrentUser(), getCities()]);
  const panelHref = user?.role === 'admin' ? '/admin' : '/painel';
  return (
    <header className="border-b border-line bg-white">
      <div className="bg-navy text-[12px] text-sky">
        <div className="mx-auto flex max-w-page flex-wrap justify-between gap-x-4 gap-y-1 px-4 py-1.5 sm:px-6">
          <span>Conteúdo exclusivo para maiores de 18 anos.</span>
          <span className="hidden sm:inline">Anúncios publicados e geridos pelos próprios anunciantes.</span>
        </div>
      </div>
      <div className="mx-auto flex max-w-page items-center gap-3 px-4 py-3 sm:px-6 lg:gap-5">
        <Logo />
        <form action="/anuncios" method="get" role="search" className="hidden min-w-0 flex-1 overflow-hidden rounded border border-line md:flex">
          <label htmlFor="header-q" className="sr-only">Buscar anúncios</label>
          <input id="header-q" name="q" type="search" placeholder="Nome, bairro ou característica" className="min-w-0 flex-1 px-3 py-2.5 text-sm" />
          <label htmlFor="header-city" className="sr-only">Cidade</label>
          <select id="header-city" name="cidade" defaultValue="" className="border-l border-line bg-white px-2 text-sm">
            <option value="">Todas as cidades</option>
            {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <button type="submit" className="flex items-center bg-brand px-3 text-white" aria-label="Buscar"><IconSearch size={18} /></button>
        </form>
        <nav aria-label="Principal" className="ml-auto hidden items-center gap-5 text-sm font-medium lg:flex">
          <Link href="/anuncios" className="text-ink">Anúncios</Link>
          <Link href="/favoritos" className="flex items-center gap-1 text-ink"><IconHeart size={17} /> Favoritos<FavoritesCount /></Link>
          {user ? (
            <>
              <Link href={panelHref} className="flex items-center gap-1 text-ink"><IconUser size={17} /> {user.role === 'admin' ? 'Administração' : user.role === 'advertiser' ? 'Meu painel' : 'Minha conta'}</Link>
              <form action={logoutAction}><button type="submit" className="flex items-center gap-1 text-muted hover:text-ink"><IconLogout size={17} /> Sair</button></form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-ink">Entrar</Link>
              <Link href="/cadastro" className="text-ink">Cadastrar</Link>
            </>
          )}
          <Link href="/anunciar" className="rounded bg-brand px-4 py-2.5 font-semibold text-white no-underline hover:bg-brand-dark hover:no-underline">Anuncie</Link>
        </nav>
        <MobileMenu user={user ? { name: user.name, role: user.role } : null} panelHref={panelHref} logout={logoutAction} />
      </div>
    </header>
  );
}
