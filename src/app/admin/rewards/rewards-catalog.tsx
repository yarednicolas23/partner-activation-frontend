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

  function upsert(reward: Reward) {
    setRewards((current) => {
      const exists = current.some((r) => r.id === reward.id);
      return exists
        ? current.map((r) => (r.id === reward.id ? reward : r))
        : [reward, ...current];
    });
  }

  function remove(id: string) {
    setRewards((current) => current.filter((r) => r.id !== id));
  }

  return (
    <div className="grid items-start gap-6 md:grid-cols-[1fr_1.2fr]">
      <RewardForm milestones={milestones} onSaved={upsert} />
      <RewardsList
        rewards={rewards}
        milestones={milestones}
        onUpdated={upsert}
        onDeleted={remove}
      />
    </div>
  );
}
