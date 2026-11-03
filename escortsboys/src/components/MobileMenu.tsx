'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IconClose, IconHeart, IconMenu, IconSearch } from './icons';
import { FavoritesCount } from './favorites';
import type { Role } from '@/lib/types';

export function MobileMenu({ user, panelHref, logout }: { user: { name: string; role: Role } | null; panelHref: string; logout: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="ml-auto flex items-center lg:hidden">
      <Link href="/anuncios" aria-label="Buscar anúncios" className="flex h-11 w-11 items-center justify-center text-navy md:hidden"><IconSearch size={22} /></Link>
      <Link href="/favoritos" aria-label="Favoritos" className="relative flex h-11 w-11 items-center justify-center text-brand"><IconHeart size={22} /><span className="absolute -right-1 top-0"><FavoritesCount /></span></Link>
      <button type="button" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen((v) => !v)} className="flex h-11 w-11 items-center justify-center text-navy">
        {open ? <IconClose size={22} /> : <IconMenu size={22} />}
      </button>
      {open ? (
        <nav id="mobile-nav" aria-label="Menu" className="absolute left-0 right-0 top-[92px] z-50 border-b border-line bg-white shadow-md">
          <ul className="mx-auto flex max-w-page flex-col px-4 py-2 text-[15px]">
            <li><Link className="block py-3 text-ink" href="/anuncios">Anúncios</Link></li>
            <li><Link className="block py-3 text-ink" href="/favoritos">Favoritos</Link></li>
            {user ? (
              <>
                <li><Link className="block py-3 text-ink" href={panelHref}>{user.role === 'admin' ? 'Administração' : 'Meu painel'}</Link></li>
                <li><form action={logout}><button type="submit" className="w-full py-3 text-left text-muted">Sair</button></form></li>
              </>
            ) : (
              <>
                <li><Link className="block py-3 text-ink" href="/login">Entrar</Link></li>
                <li><Link className="block py-3 text-ink" href="/cadastro">Criar conta</Link></li>
              </>
            )}
            <li className="py-3"><Link href="/anunciar" className="flex h-11 items-center justify-center rounded bg-brand font-semibold text-white no-underline">Anuncie</Link></li>
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
