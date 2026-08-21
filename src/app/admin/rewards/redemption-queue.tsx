"use client";

import { useState } from "react";
import type { RedemptionQueueItem, RedemptionStatus } from "@/lib/types";

const STATUS_LABEL: Record<RedemptionStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  fulfilled: "Entregue",
};

const STATUS_CLASS: Record<RedemptionStatus, string> = {
  pending: "bg-pastel-yellow-bg text-pastel-yellow-text",
  approved: "bg-pastel-green-bg text-pastel-green-text",
  rejected: "bg-pastel-red-bg text-pastel-red-text",
  fulfilled: "bg-brand-soft text-ink",
};

const NEXT_ACTIONS: Record<RedemptionStatus, RedemptionStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["fulfilled", "rejected"],
  rejected: [],
  fulfilled: [],
};

export function RedemptionQueue({ initialItems }: { initialItems: RedemptionQueueItem[] }) {
  const [items, setItems] = useState(initialItems);

  function update(updated: RedemptionQueueItem) {
    setItems((current) => current.map((i) => (i.id === updated.id ? updated : i)));
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-ink-muted">
        Nenhuma solicitação de resgate ainda.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <RedemptionCard key={item.id} item={item} onUpdated={update} />
      ))}
    </div>
  );
}

function RedemptionCard({
  item,
  onUpdated,
}: {
  item: RedemptionQueueItem;
  onUpdated: (item: RedemptionQueueItem) => void;
}) {
  const [note, setNote] = useState(item.admin_note ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function review(next: RedemptionStatus) {
    setStatus("loading");
    const res = await fetch(`/api/admin/rewards/redemptions/${item.id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, note: note || undefined }),
    });

    if (res.ok) {
      onUpdated((await res.json()) as unknown as RedemptionQueueItem);
      setStatus("idle");
      return;
    }
    setStatus("error");
  }

  const actions = NEXT_ACTIONS[item.status];

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink">{item.reward.title}</p>
          <p className="text-sm text-ink-muted">
            {item.partner.full_name ?? item.partner.email} · {item.partner.email}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[item.status]}`}
        >
          {STATUS_LABEL[item.status]}
        </span>
      </div>

      {actions.length > 0 && (
        <>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota (opcional)"
            rows={2}
            className="mb-3 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand focus:ring-1 focus:ring-brand"
          />

          {status === "error" && (
            <p className="mb-3 text-sm text-pastel-red-text">
              Não foi possível salvar. Tente novamente.
            </p>
          )}

          <div className="flex gap-2">
            {actions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => review(action)}
                disabled={status === "loading"}
                className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {STATUS_LABEL[action]}
              </button>
            ))}
          </div>
        </>
      )}

      {item.admin_note && actions.length === 0 && (
        <p className="text-sm text-ink-muted">{item.admin_note}</p>
      )}
    </div>
  );
}
