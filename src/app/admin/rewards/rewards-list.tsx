"use client";

import { useState } from "react";
import Image from "next/image";
import type { Reward } from "@/lib/types";
import { REWARD_IMAGES } from "./reward-form";

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

  async function update(body: { isActive?: boolean; imageUrl?: string }) {
    setStatus("sending");
    const res = await fetch(`/api/admin/rewards/${reward.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      onUpdated((await res.json()) as Reward);
    }
    setStatus("idle");
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-surface p-6">
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
        <select
          aria-label="Imagem do reward"
          value={reward.image_url ?? ""}
          disabled={status === "sending"}
          onChange={(e) => update({ imageUrl: e.target.value })}
          className="mt-2 rounded-md border border-border bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-brand disabled:opacity-60"
        >
          <option value="">Sem imagem</option>
          {REWARD_IMAGES.map((img) => (
            <option key={img.value} value={img.value}>
              {img.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => update({ isActive: !reward.is_active })}
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
