import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  ExtensionQueueItem,
  PartnerProfile,
  ProgramSettings,
  TimelineRow,
} from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { ExtensionRequests } from "./extension-requests";
import { ProgramSettingsForm } from "./program-settings-form";
import { TimelineTable } from "./timeline-table";

async function getProfile(accessToken: string): Promise<PartnerProfile | null> {
  const res = await fetch(`${process.env.BACKEND_URL}/partners/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

async function getSettings(accessToken: string): Promise<ProgramSettings | null> {
  const res = await fetch(`${process.env.BACKEND_URL}/deadlines/admin/settings`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

async function getTimeline(accessToken: string): Promise<TimelineRow[]> {
  const res = await fetch(`${process.env.BACKEND_URL}/deadlines/admin/partners`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

async function getPendingExtensions(accessToken: string): Promise<ExtensionQueueItem[]> {
  const res = await fetch(
    `${process.env.BACKEND_URL}/deadlines/admin/extension-requests?status=pending`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!res.ok) return [];
  return res.json();
}

/**
 * Timeline do programa: prazo geral (vale para parceiros novos), solicitações
 * de prorrogação pendentes e o prazo de cada parceiro, editável um a um.
 */
export default async function AdminTimelinePage() {
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

  const [settings, rows, pendingExtensions] = await Promise.all([
    getSettings(session.access_token),
    getTimeline(session.access_token),
    getPendingExtensions(session.access_token),
  ]);

  return (
    <>
      <Navbar profile={profile} />
      <main className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="mb-8">
          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">Timeline</h1>
          <p className="text-sm text-ink-muted">
            Prazo do programa, prorrogações e o prazo de cada parceiro.
          </p>
        </div>

        {settings ? (
          <ProgramSettingsForm settings={settings} />
        ) : (
          <div className="mb-10 rounded-lg border border-border bg-surface p-6 text-sm text-pastel-red-text">
            Não foi possível carregar o prazo geral. Verifique se a migração
            schema_program_settings.sql foi aplicada.
          </div>
        )}

        <ExtensionRequests items={pendingExtensions} />

        <h2 className="mb-1 text-lg font-semibold tracking-tight text-ink">Prazo por parceiro</h2>
        <p className="mb-4 text-sm text-ink-muted">
          Para parceiros já ativos, amplie ou ajuste o prazo individualmente.
        </p>
        <TimelineTable rows={rows} />
      </main>
    </>
  );
}
