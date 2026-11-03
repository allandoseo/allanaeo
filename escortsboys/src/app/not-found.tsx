import { EmptyState, LinkButton } from '@/components/ui';

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-page px-4 py-12 sm:px-6">
      <EmptyState title="Página não encontrada" action={<LinkButton href="/anuncios">Ver anúncios</LinkButton>}>
        O endereço pode estar incorreto ou o anúncio foi pausado ou removido pelo anunciante.
      </EmptyState>
    </main>
  );
}
