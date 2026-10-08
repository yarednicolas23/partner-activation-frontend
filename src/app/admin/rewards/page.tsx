import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PartnerProfile, RedemptionQueueItem, Reward } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { RedemptionsExportButton } from "./export-button";
import { RewardsCatalog } from "./rewards-catalog";
import { RedemptionQueue } from "./redemption-queue";

async function getProfile(accessToken: string): Promise<PartnerProfile | null> {
  const res = await fetch(`${process.env.BACKEND_URL}/partners/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

async function getRewards(accessToken: string): Promise<Reward[]> {
  const res = await fetch(`${process.env.BACKEND_URL}/rewards`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

async function getMilestones(
  accessToken: string,
): Promise<{ id: string; order_index: number; title: string }[]> {
  const res = await fetch(`${process.env.BACKEND_URL}/milestones/all`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

async function getRedemptionQueue(
  accessToken: string,
): Promise<RedemptionQueueItem[]> {
  const res = await fetch(`${process.env.BACKEND_URL}/rewards/admin/redemptions`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

type Tab = "catalogo" | "solicitacoes";

export default async function AdminRewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab: Tab = tabParam === "solicitacoes" ? "solicitacoes" : "catalogo";

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

  const [rewards, milestones, redemptions] = await Promise.all([
    getRewards(session.access_token),
    getMilestones(session.access_token),
    getRedemptionQueue(session.access_token),
  ]);

  const pendingCount = redemptions.filter((r) => r.status === "pending").length;

  return (
    <>
      <Navbar profile={profile} />
      {/* A tabela de solicitações precisa de mais largura que o catálogo. */}
      <main
        className={`mx-auto w-full px-6 py-16 ${tab === "solicitacoes" ? "max-w-5xl" : "max-w-3xl"}`}
      >
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">
          Recompensas
        </h1>
        <p className="mb-8 text-sm text-ink-muted">
          Catálogo e solicitações de resgate dos parceiros.
        </p>

        <nav
          aria-label="Seções de recompensas"
          className="mb-8 flex gap-1 border-b border-border"
        >
          <TabLink href="/admin/rewards" active={tab === "catalogo"}>
            Catálogo
            <Count value={rewards.length} />
          </TabLink>
          <TabLink
            href="/admin/rewards?tab=solicitacoes"
            active={tab === "solicitacoes"}
          >
            Solicitações de resgate
            <Count value={pendingCount} highlight={pendingCount > 0} />
          </TabLink>
        </nav>

        {tab === "catalogo" ? (
          milestones.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Nenhuma etapa cadastrada ainda.
            </p>
          ) : (
            <RewardsCatalog initialRewards={rewards} milestones={milestones} />
          )
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="text-sm text-ink-muted">
                {pendingCount} pendente{pendingCount === 1 ? "" : "s"} de{" "}
                {redemptions.length} solicitaç
                {redemptions.length === 1 ? "ão" : "ões"}.
              </p>
              <RedemptionsExportButton rows={redemptions} />
            </div>
            <RedemptionQueue
              initialItems={redemptions}
              stageByMilestone={Object.fromEntries(
                milestones.map((m) => [m.id, m.order_index]),
              )}
            />
          </>
        )}
      </main>
    </>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "border-brand text-ink"
          : "border-transparent text-ink-muted hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function Count({ value, highlight }: { value: number; highlight?: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
        highlight
          ? "bg-pastel-yellow-bg text-pastel-yellow-text"
          : "bg-canvas text-ink-muted"
      }`}
    >
      {value}
    </span>
  );
}
