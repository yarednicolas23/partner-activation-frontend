import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PartnerProfile, RedemptionQueueItem, Reward } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { RedemptionsExportButton } from "./export-button";
import { RewardsCatalog } from "./rewards-catalog";
import { RedemptionQueue } from "./redemption-queue";

async function getProfile(accessToken: string): Promise<PartnerProfile | null> {
  const res = await fetch(`${process.env.BACKEND_URL}/partners/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

async function getRewards(accessToken: string): Promise<Reward[]> {
  const res = await fetch(`${process.env.BACKEND_URL}/rewards`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

async function getMilestones(
  accessToken: string,
): Promise<{ id: string; order_index: number; title: string }[]> {
  const res = await fetch(`${process.env.BACKEND_URL}/milestones/all`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

async function getRedemptionQueue(
  accessToken: string,
): Promise<RedemptionQueueItem[]> {
  const res = await fetch(`${process.env.BACKEND_URL}/rewards/admin/redemptions`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

export default async function AdminRewardsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const profile = await getProfile(session.access_token);
  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const [rewards, milestones, redemptions] = await Promise.all([
    getRewards(session.access_token),
    getMilestones(session.access_token),
    getRedemptionQueue(session.access_token),
  ]);

  return (
    <>
      <Navbar profile={profile} />
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">
          Recompensas
        </h1>
        <p className="mb-8 text-sm text-ink-muted">
          Catálogo e solicitações de resgate dos parceiros.
        </p>

        <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink">
          Catálogo
        </h2>
        {milestones.length === 0 ? (
          <p className="mb-8 text-sm text-ink-muted">
            Nenhuma etapa cadastrada ainda.
          </p>
        ) : (
          <div className="mb-8">
            <RewardsCatalog initialRewards={rewards} milestones={milestones} />
          </div>
        )}

        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            Solicitações de resgate
          </h2>
          <RedemptionsExportButton rows={redemptions} />
        </div>
        <RedemptionQueue initialItems={redemptions} />
      </main>
    </>
  );
}
