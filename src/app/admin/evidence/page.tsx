import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EvidenceQueueItem, PartnerProfile } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { ExportCsvButton } from "@/components/export-csv-button";
import type { CsvColumn } from "@/lib/csv";
import { EvidenceQueue } from "./evidence-queue";

const STATUS_LABEL: Record<string, string> = {
  pending: "Em análise",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

async function getProfile(accessToken: string): Promise<PartnerProfile | null> {
  const res = await fetch(`${process.env.BACKEND_URL}/partners/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

async function getPendingEvidence(accessToken: string): Promise<EvidenceQueueItem[]> {
  const res = await fetch(
    `${process.env.BACKEND_URL}/milestones/admin/evidence?status=pending`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!res.ok) return [];
  return res.json();
}

async function getAllEvidence(accessToken: string): Promise<EvidenceQueueItem[]> {
  const res = await fetch(`${process.env.BACKEND_URL}/milestones/admin/evidence`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

export default async function AdminEvidencePage() {
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

  const [items, allEvidence] = await Promise.all([
    getPendingEvidence(session.access_token),
    getAllEvidence(session.access_token),
  ]);

  const columns: CsvColumn<EvidenceQueueItem>[] = [
    {
      header: "Parceiro",
      accessor: (e) => e.partner.full_name ?? e.partner.email,
    },
    { header: "E-mail", accessor: (e) => e.partner.email },
    { header: "Milestone", accessor: (e) => e.milestone.title },
    { header: "Tarefa", accessor: (e) => e.task.title },
    { header: "Status", accessor: (e) => STATUS_LABEL[e.status] ?? e.status },
    {
      header: "Enviado em",
      accessor: (e) => new Date(e.submitted_at).toLocaleString("pt-BR"),
    },
    {
      header: "Revisado em",
      accessor: (e) =>
        e.reviewed_at ? new Date(e.reviewed_at).toLocaleString("pt-BR") : "",
    },
    { header: "Nota", accessor: (e) => e.review_note ?? "" },
  ];

  return (
    <>
      <Navbar profile={profile} />
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">
              Evidências pendentes
            </h1>
            <p className="text-sm text-ink-muted">
              {items.length} evidência{items.length === 1 ? "" : "s"} aguardando
              revisão
            </p>
          </div>
          <ExportCsvButton
            filename="evidencias.csv"
            rows={allEvidence}
            columns={columns}
          />
        </div>

        <EvidenceQueue initialItems={items} />
      </main>
    </>
  );
}
