import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  EvidenceQueueItem,
  PartnerAccess,
  PartnerProfile,
  RedemptionQueueItem,
  StageHistory,
} from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { ActivityTimeline } from "./activity-timeline";
import { EvidenceHistory } from "./evidence-history";
import { PartnerSummary } from "./partner-summary";
import { StageHistoryList } from "./stage-history";
import { buildTimeline } from "./timeline-events";
import { RoleButton } from "../role-button";

async function getProfile(accessToken: string): Promise<PartnerProfile | null> {
  const res = await fetch(`${process.env.BACKEND_URL}/partners/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

async function getPartner(
  accessToken: string,
  id: string,
): Promise<PartnerProfile | null> {
  const res = await fetch(`${process.env.BACKEND_URL}/partners/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

async function getPartnerEvidenceHistory(
  accessToken: string,
  id: string,
): Promise<EvidenceQueueItem[]> {
  const res = await fetch(
    `${process.env.BACKEND_URL}/milestones/admin/partners/${id}/evidence`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!res.ok) return [];
  return res.json();
}

async function getPartnerStageHistory(
  accessToken: string,
  id: string,
): Promise<StageHistory[]> {
  const res = await fetch(
    `${process.env.BACKEND_URL}/milestones/admin/partners/${id}/stages`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!res.ok) return [];
  return res.json();
}

async function getPartnerAccess(
  accessToken: string,
  id: string,
): Promise<PartnerAccess | null> {
  const res = await fetch(`${process.env.BACKEND_URL}/partners/${id}/access`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

async function getPartnerRedemptions(
  accessToken: string,
  id: string,
): Promise<RedemptionQueueItem[]> {
  const res = await fetch(
    `${process.env.BACKEND_URL}/rewards/admin/partners/${id}/redemptions`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!res.ok) return [];
  return res.json();
}

export default async function AdminPartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const partner = await getPartner(session.access_token, id);
  if (!partner) {
    notFound();
  }

  const [stages, history, access, redemptions] = await Promise.all([
    getPartnerStageHistory(session.access_token, id),
    getPartnerEvidenceHistory(session.access_token, id),
    getPartnerAccess(session.access_token, id),
    getPartnerRedemptions(session.access_token, id),
  ]);
  const timeline = buildTimeline(access, stages, redemptions);

  return (
    <>
      <Navbar profile={profile} />
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <Link
          href="/admin/partners"
          className="mb-6 inline-block text-sm font-medium text-brand hover:underline"
        >
          ← Parceiros
        </Link>

        <div className="mb-8 rounded-lg border border-border bg-surface p-6">
          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">
            {partner.full_name ?? partner.email}
          </h1>
          <p className="text-sm text-ink-muted">{partner.email}</p>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-ink-muted">Empresa</dt>
              <dd className="text-ink">{partner.company_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Convidado em</dt>
              <dd className="text-ink">
                {new Date(partner.created_at).toLocaleDateString("pt-BR")}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium text-ink">Acesso</p>
              <p className="text-xs text-ink-muted">
                {partner.role === "admin"
                  ? "Administrador — acessa o painel admin."
                  : "Parceiro — acessa a jornada do parceiro."}
              </p>
            </div>
            <RoleButton user={partner} isSelf={partner.id === profile.id} />
          </div>
        </div>

        <PartnerSummary access={access} stages={stages} redemptions={redemptions} />

        <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink">
          Histórico do parceiro
        </h2>
        <div className="mb-10">
          <ActivityTimeline events={timeline} />
        </div>

        <details className="group mb-4">
          <summary className="mb-4 cursor-pointer list-none text-lg font-semibold tracking-tight text-ink">
            <span className="mr-2 inline-block text-ink-muted transition-transform group-open:rotate-90">
              ▸
            </span>
            Detalhe por etapa
          </summary>
          <StageHistoryList stages={stages} />
        </details>

        <details className="group">
          <summary className="mb-4 cursor-pointer list-none text-lg font-semibold tracking-tight text-ink">
            <span className="mr-2 inline-block text-ink-muted transition-transform group-open:rotate-90">
              ▸
            </span>
            Evidências enviadas ({history.length})
          </summary>
          <EvidenceHistory items={history} />
        </details>
      </main>
    </>
  );
}
