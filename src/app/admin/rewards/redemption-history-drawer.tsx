"use client";

import { SideDrawer } from "@/components/side-drawer";
import { useRedemptionHistory } from "@/lib/use-redemption-history";
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
  const { events, error } = useRedemptionHistory(
    `/api/admin/rewards/redemptions/${item.id}/history`,
    item.status,
  );
  const nextStep = NEXT_STEP[item.status];
  const address = item.shipping_address;

  return (
    <SideDrawer
      eyebrow="Seguimento da entrega"
      title={item.reward.title}
      subtitle={item.partner.full_name ?? item.partner.email}
      onClose={onClose}
    >
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
    </SideDrawer>
  );
}

function TimelineLine({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="absolute bottom-0 left-[6px] top-5 w-0.5 bg-border" aria-hidden />;
}
