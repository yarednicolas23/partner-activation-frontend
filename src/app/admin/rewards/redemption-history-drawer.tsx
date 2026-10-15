"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { RedemptionEvent, RedemptionQueueItem, RedemptionStatus } from "@/lib/types";
import { addressLines } from "@/lib/address";
import { STATUS_CLASS, STATUS_LABEL } from "./redemption-status";

// No histórico, o passo descreve o que aconteceu (não o status resultante).
const EVENT_LABEL: Record<RedemptionStatus, string> = {
  pending: "Solicitação enviada",
  approved: "Aprovado",
  rejected: "Rejeitado",
  fulfilled: "Entregue",
};

const DOT_CLASS: Record<RedemptionStatus, string> = {
  pending: "bg-pastel-yellow-text",
  approved: "bg-pastel-green-text",
  rejected: "bg-pastel-red-text",
  fulfilled: "bg-brand",
};

// Próximo passo esperado, mostrado tracejado no fim da linha do tempo.
const NEXT_STEP: Partial<Record<RedemptionStatus, string>> = {
  pending: "Aguardando revisão",
  approved: "Aguardando entrega",
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

function actorLabel(actor: RedemptionEvent["actor"]): string | null {
  if (!actor) return null;
  const name = actor.full_name ?? actor.email;
  return actor.role === "admin" ? `${name} (admin)` : name;
}

export function RedemptionHistoryDrawer({
  item,
  onClose,
}: {
  item: RedemptionQueueItem;
  onClose: () => void;
}) {
  // Recarrega quando o status muda (ex.: o admin revisou com o painel aberto):
  // um resultado de outro id/status conta como "carregando".
  const requestKey = `${item.id}:${item.status}`;
  const [result, setResult] = useState<{
    key: string;
    events: RedemptionEvent[] | null;
  } | null>(null);
  const current = result?.key === requestKey ? result : null;
  const events = current?.events ?? null;
  const error = current !== null && current.events === null;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/rewards/redemptions/${item.id}/history`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = (await res.json()) as RedemptionEvent[];
        if (!cancelled) setResult({ key: requestKey, events: data });
      })
      .catch(() => {
        if (!cancelled) setResult({ key: requestKey, events: null });
      });
    return () => {
      cancelled = true;
    };
  }, [item.id, requestKey]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const nextStep = NEXT_STEP[item.status];
  const address = item.shipping_address;

  return (
    <div className="fixed inset-0 z-50">
      <motion.div
        className="absolute inset-0 bg-ink/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        aria-hidden
      />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="redemption-history-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-surface shadow-[-4px_0_16px_rgba(0,0,0,0.12)]"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Seguimento da entrega
            </p>
            <h2
              id="redemption-history-title"
              className="mt-1 truncate text-lg font-semibold tracking-tight text-ink"
            >
              {item.reward.title}
            </h2>
            <p className="truncate text-sm text-ink-muted">
              {item.partner.full_name ?? item.partner.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            autoFocus
            className="-mr-2 rounded-md p-2 text-ink-muted transition hover:bg-canvas hover:text-ink"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-6 flex items-center gap-2 text-sm text-ink-muted">
            Status atual
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[item.status]}`}
            >
              {STATUS_LABEL[item.status]}
            </span>
          </div>

          {error ? (
            <p className="text-sm text-pastel-red-text">
              Não foi possível carregar o histórico. Tente novamente.
            </p>
          ) : events === null ? (
            <p className="text-sm text-ink-muted">Carregando histórico…</p>
          ) : (
            <ol className="relative">
              {events.map((event, index) => {
                const reopened =
                  event.status === "pending" &&
                  events.slice(0, index).some((e) => e.status === "rejected");
                const actor = actorLabel(event.actor);
                return (
                  <li key={event.id} className="relative pb-6 pl-7 last:pb-0">
                    <TimelineLine show={index < events.length - 1 || !!nextStep} />
                    <span
                      className={`absolute left-0 top-1 h-3.5 w-3.5 rounded-full ring-4 ring-surface ${DOT_CLASS[event.status]}`}
                    />
                    <p className="text-sm font-semibold text-ink">
                      {reopened ? "Nova solicitação" : EVENT_LABEL[event.status]}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {formatDateTime(event.created_at)}
                      {actor && <> · {actor}</>}
                    </p>
                    {event.note && (
                      <p className="mt-2 whitespace-pre-line rounded-md bg-canvas px-3 py-2 text-sm text-ink">
                        {event.note}
                      </p>
                    )}
                  </li>
                );
              })}
              {nextStep && (
                <li className="relative pl-7">
                  <span className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-dashed border-border bg-surface" />
                  <p className="text-sm text-ink-muted">{nextStep}</p>
                </li>
              )}
              {events.length === 0 && !nextStep && (
                <li className="text-sm text-ink-muted">Sem registros.</li>
              )}
            </ol>
          )}

          <div className="mt-8 border-t border-border pt-5 text-sm text-ink-muted">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink">
              Endereço de entrega
            </p>
            {address ? (
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
            ) : (
              <p>Sem endereço (recompensa digital).</p>
            )}
          </div>
        </div>
      </motion.aside>
    </div>
  );
}

function TimelineLine({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="absolute bottom-0 left-[6px] top-5 w-0.5 bg-border" aria-hidden />;
}
