import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminStats,
  MilestoneDistributionEntry,
  PartnerProfile,
} from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { RegistrationChart } from "./registration-chart";

async function getProfile(accessToken: string): Promise<PartnerProfile | null> {
  const res = await fetch(`${process.env.BACKEND_URL}/partners/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

async function getStats(accessToken: string): Promise<AdminStats | null> {
  const res = await fetch(`${process.env.BACKEND_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/admin/login");
  }

  const profile = await getProfile(session.access_token);
  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const stats = await getStats(session.access_token);

  return (
    <>
      <Navbar profile={profile} />
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">
          Dashboard
        </h1>
        <p className="mb-8 text-sm text-ink-muted">
          KPIs do Kaspersky Partner Quest.
        </p>

        {!stats ? (
          <p className="text-sm text-pastel-red-text">
            Não foi possível carregar os KPIs.
          </p>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <KpiCard
                label="Taxa de ativação"
                value={formatPercent(stats.activationRate)}
                detail={`${stats.activatedPartners} de ${stats.totalPartners} parceiros`}
              />
              <KpiCard
                label="Finalização de etapas"
                value={formatPercent(stats.avgMilestoneCompletionRate)}
                detail="Média entre todos os parceiros"
              />
              <KpiCard
                label="Tempo até a 1ª venda"
                value={
                  stats.avgTimeToFirstSaleDays !== null
                    ? `${Math.round(stats.avgTimeToFirstSaleDays)} dias`
                    : "—"
                }
                detail={
                  stats.partnersCompletedProgram > 0
                    ? `${stats.partnersCompletedProgram} parceiro${stats.partnersCompletedProgram > 1 ? "s" : ""} concluíram`
                    : "Nenhum parceiro concluiu ainda"
                }
              />
            </div>

            <div className="mb-8 rounded-lg border border-border bg-surface p-6">
              <h2 className="mb-4 text-base font-semibold text-ink">
                Parceiros registrados por semana
              </h2>
              <RegistrationChart data={stats.partnersRegisteredByWeek} />
            </div>

            <div className="rounded-lg border border-border bg-surface p-6">
              <h2 className="mb-1 text-base font-semibold text-ink">
                Parceiros por etapa
              </h2>
              <p className="mb-4 text-xs text-ink-muted">
                Quantos parceiros estão atualmente em cada etapa.
              </p>
              <MilestoneDistribution
                entries={stats.partnersByMilestone}
                completedCount={stats.partnersCompletedProgram}
                totalPartners={stats.totalPartners}
              />
            </div>
          </>
        )}
      </main>
    </>
  );
}

function MilestoneDistribution({
  entries,
  completedCount,
  totalPartners,
}: {
  entries: MilestoneDistributionEntry[];
  completedCount: number;
  totalPartners: number;
}) {
  const rows = [
    ...entries.map((e) => ({ label: e.title, count: e.partnerCount })),
    ...(completedCount > 0
      ? [{ label: "Programa concluído", count: completedCount }]
      : []),
  ];
  const max = Math.max(1, ...rows.map((r) => r.count));

  if (totalPartners === 0) {
    return (
      <p className="text-sm text-ink-muted">Nenhum parceiro registrado ainda.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label} className="flex items-center gap-3">
          <span className="w-36 shrink-0 truncate text-sm text-ink">
            {row.label}
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-brand-soft">
            <span
              className="block h-full rounded-full bg-brand"
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-right text-sm font-medium text-ink">
            {row.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

function KpiCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <p className="mb-1 text-sm text-ink-muted">{label}</p>
      <p className="mb-1 text-3xl font-semibold tracking-tight text-ink">
        {value}
      </p>
      <p className="text-xs text-ink-muted">{detail}</p>
    </div>
  );
}
