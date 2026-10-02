import { Navbar } from "./navbar";

/**
 * Tela de carregamento das rotas (loading.tsx): Next a mostra na hora ao
 * navegar, enquanto o servidor monta a página. Mantém o navbar da área
 * para não "piscar" e deixa claro que algo está carregando.
 */
export function PageLoading({ role }: { role: "admin" | "partner" }) {
  return (
    <>
      <Navbar profile={null} role={role} />
      <main
        className="mx-auto w-full max-w-3xl px-6 py-16"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="mb-8 space-y-2" aria-hidden="true">
          <div className="h-7 w-48 animate-pulse rounded-md bg-surface" />
          <div className="h-4 w-72 animate-pulse rounded-md bg-surface" />
        </div>

        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand border-t-transparent" />
          <p className="text-sm text-ink-muted">Carregando...</p>
        </div>
      </main>
    </>
  );
}
