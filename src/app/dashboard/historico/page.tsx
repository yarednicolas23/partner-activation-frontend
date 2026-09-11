import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EvidenceQueueItem, PartnerProfile } from "@/lib/types";
import { Navbar } from "@/components/navbar";

const STATUS_LABEL: Record<string, string> = {
  pending: "Em análise",
  approved: "Aprovado",
  rejected: "Não aprovado",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-pastel-yellow-bg text-pastel-yellow-text",
  approved: "bg-pastel-green-bg text-pastel-green-text",
  rejected: "bg-pastel-red-bg text-pastel-red-text",
};

async function getProfile(accessToken: string): Promise<PartnerProfile | null> {
  const res = await fetch(`${process.env.BACKEND_URL}/partners/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

async function getMyEvidenceHistory(
  accessToken: string,
): Promise<EvidenceQueueItem[]> {
  const res = await fetch(`${process.env.BACKEND_URL}/milestones/me/evidence`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

export default async function EvidenceHistoryPage() {
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

  const items = await getMyEvidenceHistory(session.access_token);

  return (
    <>
      <Navbar profile={profile} />
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">
          Histórico de evidências
        </h1>
        <p className="mb-8 text-sm text-ink-muted">
          {items.length} evidência{items.length === 1 ? "" : "s"} enviada
          {items.length === 1 ? "" : "s"}.
        </p>

        {items.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-ink-muted">
            Você ainda não enviou nenhuma evidência.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border bg-surface p-6"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <p className="text-sm font-medium text-ink">
                    {item.milestone.title} — {item.task.title}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[item.status]}`}
                  >
                    {STATUS_LABEL[item.status]}
                  </span>
                </div>

                {item.text_value && (
                  <p className="mb-3 rounded-md bg-brand-soft px-3 py-2 text-sm text-ink">
                    {item.text_value}
                  </p>
                )}

                {item.status === "rejected" && item.review_note && (
                  <p className="mb-1 text-sm text-pastel-red-text">
                    {item.review_note}
                  </p>
                )}

                <p className="text-xs text-ink-muted">
                  Enviado em{" "}
                  {new Date(item.submitted_at).toLocaleString("pt-BR")}
                  {item.reviewed_at &&
                    ` · Revisado em ${new Date(item.reviewed_at).toLocaleString("pt-BR")}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
