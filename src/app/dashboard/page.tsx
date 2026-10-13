import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MilestoneView, PartnerProfile } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { JourneyCarousel } from "./journey-carousel";
import { JourneyMap } from "./journey-map";
import { ProgressFooter } from "./progress-footer";
import { ProgressSummary } from "./progress-summary";
import { isMilestoneComplete } from "./stage-art";

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
  // Admin nunca usa o painel do parceiro — cobre qualquer caminho que caia
  // aqui (link de login sem `next`, Google, URL digitada).
  if (profile?.role === "admin") {
    redirect("/admin/dashboard");
  }

  const isPartner = profile?.role === "partner";
  const milestones: MilestoneView[] = isPartner
    ? await getMilestones(session.access_token)
    : [];
  const journeyDone = milestones.length > 0 && milestones.every(isMilestoneComplete);

  return (
    <>
      {journeyDone && (
        // Fondo de celebración: PNG con transparencia, detrás del contenido.
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 aspect-video max-h-screen bg-[url('/Confetti-2.png')] bg-cover bg-top bg-no-repeat"
        />
      )}
      <Navbar profile={profile} />
      <main className="mx-auto w-[calc(100%-48px)] max-w-[1800px] py-10 sm:w-[calc(100%-96px)] sm:py-14">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-ink">
                Olá{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
              </h1>
              {journeyDone && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand-hover">
                  <CheckIcon />
                  Jornada concluída
                </span>
              )}
            </div>
            {journeyDone ? (
              <>
                <p className="text-sm text-ink">Você concluiu o Kaspersky Partner Quest.</p>
                <p className="text-sm text-ink-muted">
                  Obrigado pelo seu comprometimento e por crescer junto com a Kaspersky.
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-muted">
                {isPartner ? "Continue de onde você parou." : session.user.email}
              </p>
            )}
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
            {/* Mobile (< md): carrusel de cards. Desktop: mapa isométrico original. */}
            <div className="md:hidden">
              <JourneyCarousel milestones={milestones} />
            </div>
            <div className="hidden md:block">
              <JourneyMap milestones={milestones} />
            </div>
            <ProgressFooter milestones={milestones} registeredAt={profile.created_at} />
          </>
        )}
      </main>
    </>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
