import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MilestoneView, PartnerProfile } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { JourneyMap } from "./journey-map";
import { ProgressFooter } from "./progress-footer";
import { ProgressSummary } from "./progress-summary";

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
  const milestones: MilestoneView[] = isPartner
    ? await getMilestones(session.access_token)
    : [];

  return (
    <>
      <Navbar profile={profile} />
      <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">
              Olá{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="text-sm text-ink-muted">
              {isPartner ? "Continue de onde você parou." : session.user.email}
            </p>
            {profile?.company_name && (
              <p className="mt-1 text-sm text-ink-muted">{profile.company_name}</p>
            )}
          </div>

          {isPartner && (
            <ProgressSummary milestones={milestones} registeredAt={profile.created_at} />
          )}
        </div>

        {!profile && (
          <div className="rounded-lg border border-border bg-surface p-6">
            <p className="text-sm text-pastel-red-text">
              Não foi possível carregar seu perfil no backend. Verifique se a
              API está rodando e o `.env` está configurado.
            </p>
          </div>
        )}

        {isPartner && (
          <>
            <JourneyMap milestones={milestones} />
            <ProgressFooter milestones={milestones} registeredAt={profile.created_at} />
          </>
        )}
      </main>
    </>
  );
}
