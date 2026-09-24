import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PartnerProfile } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { PartnersExportButton } from "./export-button";
import { ResendInviteButton } from "./resend-invite-button";

async function getProfile(accessToken: string): Promise<PartnerProfile | null> {
  const res = await fetch(`${process.env.BACKEND_URL}/partners/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

async function getPartners(accessToken: string): Promise<PartnerProfile[]> {
  const res = await fetch(`${process.env.BACKEND_URL}/partners`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

export default async function AdminPartnersListPage() {
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

  const partners = await getPartners(session.access_token);

  return (
    <>
      <Navbar profile={profile} />
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">
              Parceiros
            </h1>
            <p className="text-sm text-ink-muted">
              {partners.length} parceiro{partners.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <PartnersExportButton rows={partners} />
            <Link
              href="/admin/partners/invite"
              className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              Convidar parceiro
            </Link>
          </div>
        </div>

        {partners.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-ink-muted">
            Nenhum parceiro convidado ainda.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">Convidado em</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {partners.map((partner) => (
                  <tr
                    key={partner.id}
                    className="border-b border-border last:border-0 hover:bg-brand-soft/40"
                  >
                    <td className="px-4 py-3 text-ink">
                      <Link
                        href={`/admin/partners/${partner.id}`}
                        className="font-medium hover:underline"
                      >
                        {partner.full_name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink">{partner.email}</td>
                    <td className="px-4 py-3 text-ink">
                      {partner.company_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {new Date(partner.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ResendInviteButton partnerId={partner.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
