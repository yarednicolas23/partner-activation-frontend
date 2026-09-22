import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  MilestoneView,
  PartnerProfile,
  RedemptionQueueItem,
  RewardWithMilestone,
} from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { ProgressFooter } from "../progress-footer";
import { RewardCatalog } from "./reward-catalog";

async function getProfile(accessToken: string): Promise<PartnerProfile | null> {
  const res = await fetch(`${process.env.BACKEND_URL}/partners/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

async function getMilestones(accessToken: string): Promise<MilestoneView[]> {
  const res = await fetch(`${process.env.BACKEND_URL}/milestones`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

async function getCatalog(accessToken: string): Promise<RewardWithMilestone[]> {
  const res = await fetch(`${process.env.BACKEND_URL}/rewards/catalog`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

async function getMyRedemptions(
  accessToken: string,
): Promise<RedemptionQueueItem[]> {
  const res = await fetch(`${process.env.BACKEND_URL}/rewards/redemptions/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

export default async function RewardsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const profile = await getProfile(session.access_token);
  if (profile?.role === "admin") {
    redirect("/admin/dashboard");
  }

  const [milestones, catalog, myRedemptions] = await Promise.all([
    getMilestones(session.access_token),
    getCatalog(session.access_token),
    getMyRedemptions(session.access_token),
  ]);

  return (
    <>
      <Navbar profile={profile} />
      <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
        {profile ? (
          <>
            <RewardCatalog
              catalog={catalog}
              milestones={milestones}
              initialRedemptions={myRedemptions}
            />
            <ProgressFooter milestones={milestones} registeredAt={profile.created_at} />
          </>
        ) : (
          <div className="rounded-lg border border-border bg-surface p-6">
            <p className="text-sm text-pastel-red-text">
              Não foi possível carregar seu perfil no backend. Verifique se a
              API está rodando e o `.env` está configurado.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
