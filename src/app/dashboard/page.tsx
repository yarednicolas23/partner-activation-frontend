import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  MilestoneView,
  PartnerProfile,
  RedemptionQueueItem,
  RewardWithMilestone,
} from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { MilestonesSection } from "./milestones-section";
import { RewardsSection } from "./rewards-section";

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

async function getEligibleRewards(
  accessToken: string,
): Promise<RewardWithMilestone[]> {
  const res = await fetch(`${process.env.BACKEND_URL}/rewards/eligible`, {
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

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const profile = await getProfile(session.access_token);
  const isPartner = profile?.role === "partner";
  const [milestones, eligibleRewards, myRedemptions] = isPartner
    ? await Promise.all([
        getMilestones(session.access_token),
        getEligibleRewards(session.access_token),
        getMyRedemptions(session.access_token),
      ])
    : [[], [], []];

  return (
    <>
      <Navbar profile={profile} />
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="mb-8">
          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">
            Olá{profile?.full_name ? `, ${profile.full_name}` : ""}
          </h1>
          <p className="text-sm text-ink-muted">{session.user.email}</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          {profile ? (
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-ink-muted">Empresa</dt>
                <dd className="text-ink">{profile.company_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Perfil</dt>
                <dd className="text-ink">{profile.role}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-pastel-red-text">
              Não foi possível carregar seu perfil no backend. Verifique se a
              API está rodando e o `.env` está configurado.
            </p>
          )}
        </div>

        {isPartner && (
          <>
            <MilestonesSection milestones={milestones} />
            <RewardsSection
              eligibleRewards={eligibleRewards}
              initialRedemptions={myRedemptions}
            />
          </>
        )}
      </main>
    </>
  );
}
