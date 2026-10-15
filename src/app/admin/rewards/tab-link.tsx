"use client";

import Link, { useLinkStatus } from "next/link";

// Trocar de aba só muda ?tab=, então o loading.tsx da rota não aparece: o
// spinner no próprio tab mostra que a página está carregando.
export function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
        active ? "border-brand text-ink" : "border-transparent text-ink-muted hover:text-ink"
      }`}
    >
      {children}
      <PendingIndicator />
    </Link>
  );
}

function PendingIndicator() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      role="status"
      aria-label="Carregando"
      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand border-t-transparent"
    />
  );
}
