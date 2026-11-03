'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from '../ui';

export type NavItem = { href: string; label: string; count?: number };

export function AdminNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Menu administrativo" className="w-full lg:w-[220px] lg:shrink-0">
      <ul className="-mx-4 flex gap-1 overflow-x-auto border-b border-line bg-white px-4 py-2 lg:mx-0 lg:flex-col lg:rounded lg:border lg:p-2">
        {items.map((it) => {
          const active = it.href === '/admin' ? path === '/admin' : path.startsWith(it.href);
          return (
            <li key={it.href} className="shrink-0">
              <Link
                href={it.href}
                aria-current={active ? 'page' : undefined}
                className={cx('flex items-center justify-between gap-3 whitespace-nowrap rounded-sm px-3 py-2.5 text-sm no-underline hover:no-underline', active ? 'bg-sky font-semibold text-navy' : 'text-ink hover:bg-canvas')}
              >
                {it.label}
                {it.count ? <span className="rounded-sm bg-brand px-1.5 text-xs font-semibold text-white">{it.count}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
