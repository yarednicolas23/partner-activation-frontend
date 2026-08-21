"use client";

import { useState } from "react";
import type { Reward } from "@/lib/types";
import { RewardForm } from "./reward-form";
import { RewardsList } from "./rewards-list";

export function RewardsCatalog({
  initialRewards,
  milestones,
}: {
  initialRewards: Reward[];
  milestones: { id: string; order_index: number; title: string }[];
}) {
  const [rewards, setRewards] = useState(initialRewards);
  const milestoneTitleById = Object.fromEntries(
    milestones.map((m) => [m.id, `${m.order_index}. ${m.title}`]),
  );

  function upsert(reward: Reward) {
    setRewards((current) => {
      const exists = current.some((r) => r.id === reward.id);
      return exists
        ? current.map((r) => (r.id === reward.id ? reward : r))
        : [reward, ...current];
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
      <RewardForm milestones={milestones} onCreated={upsert} />
      <RewardsList
        rewards={rewards}
        milestoneTitleById={milestoneTitleById}
        onUpdated={upsert}
      />
    </div>
  );
}
