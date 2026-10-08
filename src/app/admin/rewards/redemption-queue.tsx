"use client";

import { Fragment, useMemo, useState } from "react";
import type { RedemptionQueueItem, RedemptionStatus } from "@/lib/types";
import { addressLines, formatPhone } from "@/lib/address";

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
  pending: ["rejected", "approved"],
  approved: ["rejected", "fulfilled"],
  rejected: [],
  fulfilled: [],
};

// Rótulo do botão: a ação, não o status resultante.
const ACTION_LABEL: Record<RedemptionStatus, string> = {
  pending: "",
  approved: "Aprovar",
  rejected: "Rejeitar",
  fulfilled: "Marcar como entregue",
};

// Pendentes primeiro (precisam de decisão), depois aprovados (falta entregar)
// e por último os encerrados.
const STATUS_RANK: Record<RedemptionStatus, number> = {
  pending: 0,
  approved: 1,
  fulfilled: 2,
  rejected: 2,
};

/**
 * Pendentes: o mais antigo primeiro (quem espera há mais tempo é atendido
 * antes). Aprovados e encerrados: o mais recente primeiro.
 */
function sortQueue(items: RedemptionQueueItem[]): RedemptionQueueItem[] {
  return [...items].sort((a, b) => {
    const rank = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (rank !== 0) return rank;
    const diff = Date.parse(a.requested_at) - Date.parse(b.requested_at);
    return a.status === "pending" ? diff : -diff;
  });
}

type Filter = "pending" | "approved" | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "pending", label: "Pendentes" },
  { value: "approved", label: "Aprovados" },
  { value: "all", label: "Todos" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function RedemptionQueue({
  initialItems,
  stageByMilestone,
}: {
  initialItems: RedemptionQueueItem[];
  /** milestone_id → número da etapa, para mostrar "Etapa N" na tabela. */
  stageByMilestone: Record<string, number>;
}) {
  const [items, setItems] = useState(initialItems);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>(() =>
    initialItems.some((i) => i.status === "pending") ? "pending" : "all",
  );

  const sorted = useMemo(() => sortQueue(items), [items]);
  const visible = filter === "all" ? sorted : sorted.filter((i) => i.status === filter);
  const count = (f: Filter) =>
    f === "all" ? items.length : items.filter((i) => i.status === f).length;

  function update(updated: RedemptionQueueItem) {
    setItems((current) => current.map((i) => (i.id === updated.id ? updated : i)));
    setOpenId(null);
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-ink-muted">
        Nenhuma solicitação de resgate ainda.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar solicitações">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active ? "bg-ink text-surface" : "bg-nav-pill text-ink-muted hover:text-ink"
              }`}
            >
              {f.label} <span className="opacity-70">{count(f.value)}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Recompensa</th>
              <th className="px-4 py-3 font-medium">Parceiro</th>
              <th className="px-4 py-3 font-medium">Solicitado</th>
              <th className="px-4 py-3" aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-muted">
                  Nenhuma solicitação neste filtro.
                </td>
              </tr>
            )}
            {visible.map((item) => {
              const open = openId === item.id;
              const actionable = NEXT_ACTIONS[item.status].length > 0;
              const stage = stageByMilestone[item.reward.milestone_id];
              const noteRow = !open && !actionable && !!item.admin_note;
              return (
                <Fragment key={item.id}>
                  <tr
                    className={`${noteRow || open ? "" : "border-b border-border last:border-b-0"} ${open ? "bg-canvas/40" : ""}`}
                  >
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[item.status]}`}
                      >
                        {STATUS_LABEL[item.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-ink">{item.reward.title}</p>
                      {stage !== undefined && (
                        <p className="text-xs text-ink-muted">Etapa {stage}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-ink">{item.partner.full_name ?? item.partner.email}</p>
                      {item.partner.full_name && (
                        <p className="text-xs text-ink-muted">{item.partner.email}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-ink-muted">
                      {formatDate(item.requested_at)}
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? null : item.id)}
                        aria-expanded={open}
                        className={`whitespace-nowrap text-sm font-medium hover:underline ${
                          actionable ? "text-brand" : "text-ink-muted"
                        }`}
                      >
                        {actionable ? "Revisar" : "Detalhes"} {open ? "▾" : "▸"}
                      </button>
                    </td>
                  </tr>

                  {/* Encerrados com nota: a nota em uma linha, sem abrir. */}
                  {noteRow && (
                    <tr className="border-b border-border last:border-b-0">
                      <td />
                      <td colSpan={4} className="max-w-0 px-4 pb-3 pt-0">
                        <p className="truncate text-xs text-ink-muted">“{item.admin_note}”</p>
                      </td>
                    </tr>
                  )}

                  {open && (
                    <tr className="border-b border-border bg-canvas/40 last:border-b-0">
                      <td colSpan={5} className="px-4 pb-5 pt-1">
                        <ReviewPanel item={item} onUpdated={update} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReviewPanel({
  item,
  onUpdated,
}: {
  item: RedemptionQueueItem;
  onUpdated: (item: RedemptionQueueItem) => void;
}) {
  const [note, setNote] = useState(item.admin_note ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [noteRequired, setNoteRequired] = useState(false);
  const actions = NEXT_ACTIONS[item.status];

  async function review(next: RedemptionStatus) {
    // O motivo vai no e-mail de recusa: sem ele o parceiro não sabe o que corrigir.
    if (next === "rejected" && !note.trim()) {
      setNoteRequired(true);
      return;
    }
    setStatus("loading");
    const res = await fetch(`/api/admin/rewards/redemptions/${item.id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, note: note.trim() || undefined }),
    });

    if (res.ok) {
      onUpdated((await res.json()) as unknown as RedemptionQueueItem);
      setStatus("idle");
      return;
    }
    setStatus("error");
  }

  const address = item.shipping_address;

  return (
    <div className="grid gap-4 rounded-md border border-border bg-surface p-4 sm:grid-cols-[1fr_1.4fr]">
      <div className="text-sm text-ink-muted">
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
            {address.phone && <span className="block">Tel. {formatPhone(address.phone)}</span>}
          </address>
        ) : (
          <p>Sem endereço (recompensa digital).</p>
        )}
        {item.reviewed_at && (
          <p className="mt-3 text-xs">Última atualização em {formatDate(item.reviewed_at)}</p>
        )}
      </div>

      <div>
        {actions.length > 0 ? (
          <>
            <label
              htmlFor={`note-${item.id}`}
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink"
            >
              Nota para o parceiro{" "}
              <span className="font-normal normal-case tracking-normal text-ink-muted">
                (obrigatória ao rejeitar)
              </span>
            </label>
            <textarea
              id={`note-${item.id}`}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (e.target.value.trim()) setNoteRequired(false);
              }}
              rows={3}
              aria-invalid={noteRequired}
              className={`mb-3 w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted focus:ring-1 ${
                noteRequired
                  ? "border-pastel-red-text focus:border-pastel-red-text focus:ring-pastel-red-text"
                  : "border-border focus:border-brand focus:ring-brand"
              }`}
              placeholder="Ex.: código de rastreio, prazo de envio ou motivo da recusa"
            />

            {noteRequired && (
              <p className="mb-3 text-sm text-pastel-red-text">
                Escreva o motivo da recusa — ele vai no e-mail para o parceiro.
              </p>
            )}
            {status === "error" && (
              <p className="mb-3 text-sm text-pastel-red-text">
                Não foi possível salvar. Tente novamente.
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              {actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => review(action)}
                  disabled={status === "loading"}
                  className={
                    action === "rejected"
                      ? "rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-pastel-red-text transition hover:bg-pastel-red-bg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      : "rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  }
                >
                  {ACTION_LABEL[action]}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink">
              Nota para o parceiro
            </p>
            <p className="whitespace-pre-line text-sm text-ink">
              {item.admin_note || <span className="text-ink-muted">Sem nota.</span>}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
