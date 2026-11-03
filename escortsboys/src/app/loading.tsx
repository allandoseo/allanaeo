export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-page px-4 py-6 sm:px-6" aria-busy="true" aria-label="Carregando">
      <div className="mb-4 h-7 w-72 animate-pulse rounded bg-line" />
      <div className="grid gap-4 xl:grid-cols-2">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-60 animate-pulse rounded border border-line bg-white" />)}
      </div>
    </main>
  );
}
