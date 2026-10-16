"use client";

import type { RedemptionEvent, RedemptionQueueItem } from "@/lib/types";
import { addressLines } from "@/lib/address";
import { SideDrawer } from "@/components/side-drawer";
import { useRedemptionHistory } from "@/lib/use-redemption-history";

type StepStatus = "pending" | "approved" | "fulfilled";

const STEPS: { status: StepStatus; label: string; done: string; waiting: string }[] = [
  {
    status: "pending",
    label: "Solicitação enviada",
    done: "Recebemos seu pedido de resgate.",
    waiting: "",
  },
  {
    status: "approved",
    label: "Aprovado",
    done: "Pedido aprovado — sua recompensa está sendo preparada para envio.",
    waiting: "Aguardando aprovação da equipe Kaspersky.",
  },
  {
    status: "fulfilled",
    label: "Entregue",
    done: "Recompensa entregue.",
    waiting: "Aguardando entrega.",
  },
];

const STATUS_RANK: Record<RedemptionQueueItem["status"], number> = {
  pending: 0,
  approved: 1,
  fulfilled: 2,
  rejected: 0,
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Data e nota de cada passo. Só conta o ciclo atual (desde a última
 * solicitação — um pedido rejeitado pode ser feito de novo). Sem histórico
 * (ex.: falha ao carregar), usa as datas que a própria solicitação tem.
 */
function stepDetails(
  item: RedemptionQueueItem,
  events: RedemptionEvent[] | null,
): Partial<Record<StepStatus, { at: string; note: string | null }>> {
  if (events?.length) {
    let lastRequest = -1;
    events.forEach((e, i) => {
      if (e.status === "pending") lastRequest = i;
    });
    const cycle = events.slice(Math.max(lastRequest, 0));
    const details: Partial<Record<StepStatus, { at: string; note: string | null }>> = {};
    for (const event of cycle) {
      if (event.status === "rejected") continue;
      details[event.status] = { at: event.created_at, note: event.note };
    }
    return details;
  }

  const details: Partial<Record<StepStatus, { at: string; note: string | null }>> = {
    pending: { at: item.requested_at, note: null },
  };
  if (item.status === "approved" || item.status === "fulfilled") {
    details[item.status] = { at: item.reviewed_at ?? item.requested_at, note: item.admin_note };
  }
  return details;
}

export function DeliveryTrackingDrawer({
  item,
  onClose,
}: {
  item: RedemptionQueueItem;
  onClose: () => void;
}) {
  const { events, error } = useRedemptionHistory(
    `/api/rewards/redemptions/${item.id}/history`,
    item.status,
  );
  const loading = events === null && !error;
  const details = stepDetails(item, events);
  const rank = STATUS_RANK[item.status];
  const address = item.shipping_address;

  return (
    <SideDrawer eyebrow="Acompanhar entrega" title={item.reward.title} onClose={onClose}>
      {loading ? (
        <p className="text-sm text-ink-muted">Carregando…</p>
      ) : (
        <ol>
          {STEPS.map((step, index) => {
            const done = index <= rank;
            const current = index === rank + 1;
            const detail = details[step.status];
            return (
              <li key={step.status} className="relative pb-7 pl-9 last:pb-0">
                {index < STEPS.length - 1 && (
                  <span
                    className={`absolute bottom-0 left-[11px] top-7 w-0.5 ${index < rank ? "bg-brand" : "bg-border"}`}
                    aria-hidden
                  />
                )}
                <span
                  className={`absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-full ${
                    done
                      ? "bg-brand text-white"
                      : current
                        ? "border-2 border-brand bg-surface"
                        : "border-2 border-border bg-surface"
                  }`}
                  aria-hidden
                >
                  {done && <CheckIcon />}
                </span>
                <p className={`text-sm font-semibold ${done || current ? "text-ink" : "text-ink-muted"}`}>
                  {step.label}
                </p>
                {done ? (
                  <>
                    {detail && (
                      <p className="text-xs text-ink-muted">{formatDateTime(detail.at)}</p>
                    )}
                    <p className="mt-1 text-sm text-ink-muted">{step.done}</p>
                    {detail?.note && (
                      <p className="mt-2 whitespace-pre-line rounded-md bg-canvas px-3 py-2 text-sm text-ink">
                        {detail.note}
                      </p>
                    )}
                  </>
                ) : (
                  current && <p className="mt-1 text-sm text-ink-muted">{step.waiting}</p>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {address && (
        <div className="mt-8 border-t border-border pt-5 text-sm text-ink-muted">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink">
            Endereço de entrega
          </p>
          <address className="not-italic">
            {address.recipient_name && (
              <span className="block text-ink">{address.recipient_name}</span>
            )}
            {addressLines(address).map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
        </div>
      )}
    </SideDrawer>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
