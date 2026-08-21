"use client";

import { useState } from "react";
import type {
  RedemptionQueueItem,
  RedemptionStatus,
  RewardWithMilestone,
} from "@/lib/types";

const STATUS_LABEL: Record<RedemptionStatus, string> = {
  pending: "Em análise",
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

export function RewardsSection({
  eligibleRewards,
  initialRedemptions,
}: {
  eligibleRewards: RewardWithMilestone[];
  initialRedemptions: RedemptionQueueItem[];
}) {
  const [redemptions, setRedemptions] = useState(initialRedemptions);
  const requestedRewardIds = new Set(redemptions.map((r) => r.reward_id));
  const requestable = eligibleRewards.filter((r) => !requestedRewardIds.has(r.id));

  if (eligibleRewards.length === 0 && redemptions.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Recompensas</h2>

      {requestable.map((reward) => (
        <RequestableReward
          key={reward.id}
          reward={reward}
          onRequested={(redemption) =>
            setRedemptions((current) => [redemption, ...current])
          }
        />
      ))}

      {redemptions.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-border bg-surface p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink">{item.reward.title}</p>
              {item.reward.description && (
                <p className="text-sm text-ink-muted">{item.reward.description}</p>
              )}
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[item.status]}`}
            >
              {STATUS_LABEL[item.status]}
            </span>
          </div>
          {item.status === "rejected" && item.admin_note && (
            <p className="mt-2 text-sm text-pastel-red-text">{item.admin_note}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function RequestableReward({
  reward,
  onRequested,
}: {
  reward: RewardWithMilestone;
  onRequested: (redemption: RedemptionQueueItem) => void;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  async function requestRedemption() {
    setStatus("sending");
    const res = await fetch(`/api/rewards/${reward.id}/redeem`, { method: "POST" });

    if (!res.ok) {
      setStatus("error");
      return;
    }

    onRequested((await res.json()) as RedemptionQueueItem);
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink">{reward.title}</p>
          {reward.description && (
            <p className="text-sm text-ink-muted">{reward.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={requestRedemption}
          disabled={status === "sending"}
          className="shrink-0 rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "sending" ? "Enviando..." : "Solicitar"}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-sm text-pastel-red-text">
          Não foi possível enviar a solicitação. Tente novamente.
        </p>
      )}
    </div>
  );
}
