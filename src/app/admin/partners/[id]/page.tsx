import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EvidenceQueueItem, PartnerProfile } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { EvidenceHistory } from "./evidence-history";

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

  const history = await getPartnerEvidenceHistory(session.access_token, id);

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
        </div>

        <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink">
          Histórico de evidências
        </h2>
        <EvidenceHistory items={history} />
      </main>
    </>
  );
}
