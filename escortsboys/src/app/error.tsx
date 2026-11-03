'use client';

import { EmptyState, Button } from '@/components/ui';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-page px-4 py-12 sm:px-6">
      <EmptyState title="Algo deu errado" action={<Button onClick={reset}>Tentar novamente</Button>}>
        Não foi possível carregar esta página agora. Tente novamente em instantes.
      </EmptyState>
    </main>
  );
}
