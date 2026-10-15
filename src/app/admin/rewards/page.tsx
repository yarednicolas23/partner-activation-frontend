import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PartnerProfile, RedemptionQueueItem, Reward } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { RedemptionsExportButton } from "./export-button";
import { RewardsCatalog } from "./rewards-catalog";
import { RedemptionQueue } from "./redemption-queue";
import { TabLink } from "./tab-link";
import { STATUS_CLASS, STATUS_LABEL, STATUS_ORDER } from "./redemption-status";

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
            <StatusCounts items={redemptions} />
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

function Count({ value }: { value: number }) {
  return (
    <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-semibold text-ink-muted">
      {value}
    </span>
  );
}

/**
 * Um segmento por status (só os que têm solicitações), cada um na cor do seu
 * status; a soma dos segmentos é o total.
 */
function StatusCounts({ items }: { items: RedemptionQueueItem[] }) {
  const segments = STATUS_ORDER.map((status) => ({
    status,
    value: items.filter((i) => i.status === status).length,
  })).filter((s) => s.value > 0);

  if (segments.length === 0) return <Count value={0} />;

  const summary = segments
    .map((s) => `${STATUS_LABEL[s.status]}: ${s.value}`)
    .join(", ");

  return (
    <span
      className="flex overflow-hidden rounded-full text-xs font-semibold"
      aria-label={`${items.length} no total: ${summary}`}
    >
      {segments.map((s) => (
        <span
          key={s.status}
          title={`${STATUS_LABEL[s.status]}: ${s.value}`}
          className={`px-2 py-0.5 ${STATUS_CLASS[s.status]}`}
        >
          {s.value}
        </span>
      ))}
    </span>
  );
}
