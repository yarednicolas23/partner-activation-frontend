"use client";

import { useState } from "react";
import type { Reward } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  physical: "Físico",
  digital: "Digital",
  mixed: "Misto",
};

export function RewardsList({
  rewards,
  milestoneTitleById,
  onUpdated,
}: {
  rewards: Reward[];
  milestoneTitleById: Record<string, string>;
  onUpdated: (reward: Reward) => void;
}) {
  if (rewards.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-ink-muted">
        Nenhum reward cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rewards.map((reward) => (
        <RewardRow
          key={reward.id}
          reward={reward}
          milestoneTitle={milestoneTitleById[reward.milestone_id] ?? "—"}
          onUpdated={onUpdated}
        />
      ))}
    </div>
  );
}

function RewardRow({
  reward,
  milestoneTitle,
  onUpdated,
}: {
  reward: Reward;
  milestoneTitle: string;
  onUpdated: (reward: Reward) => void;
}) {
  const [status, setStatus] = useState<"idle" | "sending">("idle");

  async function toggleActive() {
    setStatus("sending");
    const res = await fetch(`/api/admin/rewards/${reward.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !reward.is_active }),
    });
    if (res.ok) {
      onUpdated((await res.json()) as Reward);
    }
    setStatus("idle");
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-surface p-6">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <p className="text-sm font-medium text-ink">{reward.title}</p>
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-ink-muted">
            {TYPE_LABEL[reward.type]}
          </span>
        </div>
        {reward.description && (
          <p className="mb-1 text-sm text-ink-muted">{reward.description}</p>
        )}
        <p className="text-xs text-ink-muted">
          Requer: {milestoneTitle}
          {reward.stock !== null && ` · Estoque: ${reward.stock}`}
        </p>
      </div>

      <button
        type="button"
        onClick={toggleActive}
        disabled={status === "sending"}
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
          reward.is_active
            ? "bg-pastel-green-bg text-pastel-green-text hover:opacity-80"
            : "bg-border text-ink-muted hover:opacity-80"
        }`}
      >
        {reward.is_active ? "Ativo" : "Inativo"}
      </button>
    </div>
  );
}
