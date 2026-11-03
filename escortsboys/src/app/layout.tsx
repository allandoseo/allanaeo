import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { AgeGate } from '@/components/AgeGate';
import { FavoritesProvider } from '@/components/favorites';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { getCurrentUser } from '@/lib/auth';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Acompanhantes masculinos`, template: `%s | ${SITE_NAME}` },
  description: 'Encontre acompanhantes masculinos por cidade e região: compare anúncios, fotos, disponibilidade e valores, e fale direto com o anunciante. Exclusivo para maiores de 18 anos.',
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, locale: 'pt_BR', type: 'website' },
  other: { rating: 'adult' },
};

export const viewport: Viewport = { themeColor: '#17324D', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, jar] = await Promise.all([getCurrentUser(), cookies()]);
  const ageOk = jar.get('eb_age')?.value === '1' || !!user;
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col">
        <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
        <FavoritesProvider loggedIn={!!user}>
          <Header />
          <div id="conteudo" className="flex flex-1 flex-col">{children}</div>
          <Footer />
        </FavoritesProvider>
        {ageOk ? null : <AgeGate />}
      </body>
    </html>
  );
}
