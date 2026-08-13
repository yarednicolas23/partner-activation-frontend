import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MilestoneView, PartnerProfile } from "@/lib/types";
import { MilestonesSection } from "./milestones-section";

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
  const milestones =
    profile?.role === "partner" ? await getMilestones(session.access_token) : [];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">
            Olá{profile?.full_name ? `, ${profile.full_name}` : ""}
          </h1>
          <p className="text-sm text-ink-muted">{session.user.email}</p>
        </div>

        {profile?.role === "admin" && (
          <div className="flex shrink-0 gap-2">
            <Link
              href="/admin/partners"
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-ink transition hover:bg-brand-soft"
            >
              Parceiros
            </Link>
            <Link
              href="/admin/evidence"
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-ink transition hover:bg-brand-soft"
            >
              Evidências
            </Link>
          </div>
        )}
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

      {profile?.role === "partner" && <MilestonesSection milestones={milestones} />}
    </main>
  );
}
