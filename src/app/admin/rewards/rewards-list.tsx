"use client";

import { useState } from "react";
import Image from "next/image";
import type { Reward } from "@/lib/types";
import { RewardForm } from "./reward-form";

type Milestone = { id: string; order_index: number; title: string };

export function RewardsList({
  rewards,
  milestones,
  onUpdated,
  onDeleted,
}: {
  rewards: Reward[];
  milestones: Milestone[];
  onUpdated: (reward: Reward) => void;
  onDeleted: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const milestoneTitleById = Object.fromEntries(
    milestones.map((m) => [m.id, `${m.order_index}. ${m.title}`]),
  );

  if (rewards.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-ink-muted">
        Nenhum reward cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rewards.map((reward) =>
        editingId === reward.id ? (
          <RewardForm
            key={reward.id}
            milestones={milestones}
            reward={reward}
            onSaved={(updated) => {
              onUpdated(updated);
              setEditingId(null);
            }}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <RewardRow
            key={reward.id}
            reward={reward}
            milestoneTitle={milestoneTitleById[reward.milestone_id] ?? "—"}
            onEdit={() => setEditingId(reward.id)}
            onUpdated={onUpdated}
            onDeleted={onDeleted}
          />
        ),
      )}
    </div>
  );
}

function RewardRow({
  reward,
  milestoneTitle,
  onEdit,
  onUpdated,
  onDeleted,
}: {
  reward: Reward;
  milestoneTitle: string;
  onEdit: () => void;
  onUpdated: (reward: Reward) => void;
  onDeleted: (id: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleActive() {
    setStatus("sending");
    setError(null);
    const res = await fetch(`/api/admin/rewards/${reward.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !reward.is_active }),
    });
    if (res.ok) {
      onUpdated((await res.json()) as Reward);
    } else {
      setError("Não foi possível atualizar. Tente novamente.");
    }
    setStatus("idle");
  }

  async function handleDelete() {
    setStatus("sending");
    setError(null);
    const res = await fetch(`/api/admin/rewards/${reward.id}`, { method: "DELETE" });

    if (res.ok) {
      onDeleted(reward.id);
      return;
    }

    setStatus("idle");
    setConfirmingDelete(false);
    setError(
      res.status === 409
        ? "Este reward já tem solicitações de resgate. Desative-o em vez de excluir, para manter o histórico."
        : "Não foi possível excluir. Tente novamente.",
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="flex items-start gap-4">
        <span className="relative h-16 w-16 shrink-0 rounded-md bg-canvas">
          <Image
            src={reward.image_url || "/blocked-gift/blocked-gift.png"}
            alt=""
            fill
            sizes="64px"
            className="object-contain p-1.5"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-sm font-medium text-ink">{reward.title}</p>
          {reward.description && (
            <p className="mb-1 text-sm text-ink-muted">{reward.description}</p>
          )}
          <p className="text-xs text-ink-muted">Requer: {milestoneTitle}</p>
        </div>

        <button
          type="button"
          onClick={toggleActive}
          disabled={status === "sending"}
          title={reward.is_active ? "Clique para desativar" : "Clique para ativar"}
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
            reward.is_active
              ? "bg-pastel-green-bg text-pastel-green-text hover:opacity-80"
              : "bg-border text-ink-muted hover:opacity-80"
          }`}
        >
          {reward.is_active ? "Ativo" : "Inativo"}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
        {confirmingDelete ? (
          <>
            <span className="mr-auto text-xs text-ink-muted">Excluir este reward?</span>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={status === "sending"}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-canvas disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={status === "sending"}
              className="rounded-md bg-pastel-red-text px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {status === "sending" ? "Excluindo..." : "Confirmar exclusão"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onEdit}
              disabled={status === "sending"}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-canvas disabled:opacity-60"
            >
              <PencilIcon />
              Editar
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setConfirmingDelete(true);
              }}
              disabled={status === "sending"}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-pastel-red-text transition hover:bg-pastel-red-bg disabled:opacity-60"
            >
              <TrashIcon />
              Excluir
            </button>
          </>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-pastel-red-text">{error}</p>}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}
