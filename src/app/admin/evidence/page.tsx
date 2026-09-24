import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EvidenceQueueItem, PartnerProfile } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { EvidenceExportButton } from "./export-button";
import { EvidenceQueue } from "./evidence-queue";

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
    redirect("/admin/login");
  }

  const profile = await getProfile(session.access_token);

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const [items, allEvidence] = await Promise.all([
    getPendingEvidence(session.access_token),
    getAllEvidence(session.access_token),
  ]);

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
          <EvidenceExportButton rows={allEvidence} />
        </div>

        <EvidenceQueue initialItems={items} />
      </main>
    </>
  );
}
