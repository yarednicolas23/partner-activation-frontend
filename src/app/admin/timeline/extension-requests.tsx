import Link from "next/link";
import type { ExtensionQueueItem } from "@/lib/types";
import { formatDate } from "@/lib/deadline";
import { ExtensionReview } from "./extension-review";

/**
 * Solicitações de prorrogação pendentes no Timeline. O mais antigo primeiro:
 * quem espera há mais tempo é atendido antes.
 */
export function ExtensionRequests({ items }: { items: ExtensionQueueItem[] }) {
  if (items.length === 0) return null;

  return (
    <section id="solicitacoes" className="mb-10 scroll-mt-28">
      <h2 className="mb-1 text-lg font-semibold tracking-tight text-ink">
        Solicitações de prorrogação
      </h2>
      <p className="mb-4 text-sm text-ink-muted">
        {items.length} aguardando análise. Parceiros com o prazo vencido que pediram mais tempo.
      </p>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link
                  href={`/admin/partners/${item.partner.id}`}
                  className="font-medium text-ink hover:underline"
                >
                  {item.partner.full_name ?? item.partner.email}
                </Link>
                <p className="text-xs text-ink-muted">
                  {[item.partner.company_name, item.partner.email].filter(Boolean).join(" · ")}
                </p>
              </div>
              <p className="text-right text-xs text-ink-muted">
                Solicitado em {formatDate(item.requested_at)}
                <br />
                Prazo vencido em {formatDate(item.previous_deadline_at)}
              </p>
            </div>
            {item.reason && (
              <p className="mb-3 rounded-md bg-canvas px-3 py-2 text-sm text-ink">“{item.reason}”</p>
            )}
            <ExtensionReview requestId={item.id} suggestedDeadlineAt={item.suggested_deadline_at} />
          </li>
        ))}
      </ul>
    </section>
  );
}
