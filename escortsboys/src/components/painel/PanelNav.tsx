'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from '../ui';

const ITEMS = [
  { href: '/painel', label: 'Visão geral' },
  { href: '/painel/perfil', label: 'Meu perfil' },
  { href: '/painel/anuncios', label: 'Meus anúncios' },
  { href: '/painel/fotos', label: 'Fotos' },
  { href: '/painel/disponibilidade', label: 'Disponibilidade' },
  { href: '/painel/mensagens', label: 'Mensagens e contatos' },
  { href: '/painel/estatisticas', label: 'Estatísticas' },
  { href: '/painel/assinatura', label: 'Assinatura' },
  { href: '/painel/configuracoes', label: 'Configurações' },
];

export function PanelNav() {
  const path = usePathname();
  const active = (href: string) => (href === '/painel' ? path === '/painel' : path.startsWith(href));
  return (
    <nav aria-label="Menu do painel" className="w-full lg:w-[232px] lg:shrink-0">
      <ul className="-mx-4 flex gap-1 overflow-x-auto border-b border-line bg-white px-4 py-2 sm:mx-0 sm:rounded sm:border lg:flex-col lg:overflow-visible lg:p-2">
        {ITEMS.map((it) => (
          <li key={it.href} className="shrink-0">
            <Link
              href={it.href}
              aria-current={active(it.href) ? 'page' : undefined}
              className={cx(
                'block whitespace-nowrap rounded-sm px-3 py-2.5 text-sm no-underline hover:no-underline',
                active(it.href) ? 'bg-sky font-semibold text-navy' : 'text-ink hover:bg-canvas',
              )}
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
