import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PartnerProfile } from "@/lib/types";
import { InvitePartnerForm } from "./invite-partner-form";

async function getProfile(accessToken: string): Promise<PartnerProfile | null> {
  const res = await fetch(`${process.env.BACKEND_URL}/partners/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function InvitePartnerPage() {
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

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-16">
      <Link
        href="/admin/partners"
        className="mb-4 inline-block text-sm text-ink-muted hover:text-ink"
      >
        ← Parceiros
      </Link>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">
        Convidar parceiro
      </h1>
      <p className="mb-8 text-sm text-ink-muted">
        O parceiro recebe um e-mail com um link de acesso para completar o
        cadastro.
      </p>

      <div className="rounded-lg border border-border bg-surface p-6">
        <InvitePartnerForm />
      </div>
    </main>
  );
}
