"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type {
  MilestoneView,
  RedemptionQueueItem,
  RewardWithMilestone,
} from "@/lib/types";
import { findCurrentMilestone, isMilestoneComplete, stageTaskProgress } from "../stage-art";

type CardStatus = "locked" | "available" | "pending" | "shipping" | "delivered" | "rejected";

const STATUS_META: Record<
  Exclude<CardStatus, "locked">,
  { label: string; icon: React.ReactNode; pillBg: string; pillText: string; iconBg: string; boxBg: string; boxText: string }
> = {
  delivered: {
    label: "Entregue",
    icon: <CheckIcon />,
    pillBg: "bg-pastel-green-bg",
    pillText: "text-pastel-green-text",
    iconBg: "bg-pastel-green-text",
    boxBg: "bg-pastel-green-bg",
    boxText: "text-pastel-green-text",
  },
  shipping: {
    label: "Em trânsito",
    icon: <TruckIcon />,
    pillBg: "bg-pastel-blue-bg",
    pillText: "text-pastel-blue-text",
    iconBg: "bg-pastel-blue-text",
    boxBg: "bg-pastel-blue-bg",
    boxText: "text-pastel-blue-text",
  },
  available: {
    label: "Disponível",
    icon: <GiftIcon size={12} />,
    pillBg: "bg-brand-soft",
    pillText: "text-brand",
    iconBg: "bg-brand",
    boxBg: "bg-brand-soft",
    boxText: "text-brand",
  },
  pending: {
    label: "Em análise",
    icon: <ClockIcon />,
    pillBg: "bg-pastel-yellow-bg",
    pillText: "text-pastel-yellow-text",
    iconBg: "bg-pastel-yellow-text",
    boxBg: "bg-pastel-yellow-bg",
    boxText: "text-pastel-yellow-text",
  },
  rejected: {
    label: "Não aprovado",
    icon: <AlertIcon />,
    pillBg: "bg-pastel-red-bg",
    pillText: "text-pastel-red-text",
    iconBg: "bg-pastel-red-text",
    boxBg: "bg-pastel-red-bg",
    boxText: "text-pastel-red-text",
  },
};

const TYPE_LABEL: Record<RewardWithMilestone["type"], string> = {
  physical: "Prêmio físico",
  digital: "Prêmio digital",
  mixed: "Prêmio físico e digital",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function cardStatus(
  reward: RewardWithMilestone,
  milestones: MilestoneView[],
  redemption: RedemptionQueueItem | undefined,
): CardStatus {
  const milestone = milestones.find((m) => m.id === reward.milestone.id);
  const unlocked = milestone ? !milestone.locked && isMilestoneComplete(milestone) : false;

  if (!unlocked) return "locked";
  if (!redemption) return "available";
  if (redemption.status === "pending") return "pending";
  if (redemption.status === "approved") return "shipping";
  if (redemption.status === "fulfilled") return "delivered";
  return "rejected";
}

export function RewardCatalog({
  catalog,
  milestones,
  initialRedemptions,
}: {
  catalog: RewardWithMilestone[];
  milestones: MilestoneView[];
  initialRedemptions: RedemptionQueueItem[];
}) {
  const [redemptions, setRedemptions] = useState(initialRedemptions);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const redemptionByReward = new Map(redemptions.map((r) => [r.reward_id, r]));
  const sorted = [...catalog].sort((a, b) => a.milestone.order_index - b.milestone.order_index);

  const current = findCurrentMilestone(milestones);
  const currentProgress = current ? stageTaskProgress(current) : null;
  const remaining = currentProgress ? currentProgress.total - currentProgress.completed : 0;

  function scrollBy(delta: number) {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">
            Grandes recompensas esperam por você.
          </h1>
          <p className="text-sm text-ink-muted">
            Desbloqueie novas recompensas à medida que avança em sua jornada.
          </p>
        </div>

        {current && currentProgress && currentProgress.total > 0 && (
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 pr-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <GiftIcon />
            </span>
            <p className="text-sm text-ink-muted">
              <span className="font-semibold text-ink">
                {remaining} {remaining === 1 ? "missão" : "missões"}
              </span>{" "}
              para desbloquear sua próxima recompensa.
            </p>
            <Link
              href="/dashboard"
              className="ml-2 shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              Continuar jornada →
            </Link>
          </div>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-ink-muted">
          Nenhuma recompensa cadastrada ainda.
        </div>
      ) : (
        <div className="relative">
          <ScrollButton direction="left" onClick={() => scrollBy(-360)} />
          <ScrollButton direction="right" onClick={() => scrollBy(360)} />

          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {sorted.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                status={cardStatus(reward, milestones, redemptionByReward.get(reward.id))}
                redemption={redemptionByReward.get(reward.id)}
                onRedeemed={(redemption) =>
                  setRedemptions((current) => [redemption, ...current])
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScrollButton({ direction, onClick }: { direction: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Ver recompensas anteriores" : "Ver mais recompensas"}
      className={`absolute top-1/3 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink shadow-sm transition hover:bg-canvas sm:flex ${
        direction === "left" ? "-left-4" : "-right-4"
      }`}
    >
      {direction === "left" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
    </button>
  );
}

function RewardCard({
  reward,
  status,
  redemption,
  onRedeemed,
}: {
  reward: RewardWithMilestone;
  status: CardStatus;
  redemption: RedemptionQueueItem | undefined;
  onRedeemed: (redemption: RedemptionQueueItem) => void;
}) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  async function handleRedeem() {
    setSending(true);
    setError(false);
    const res = await fetch(`/api/rewards/${reward.id}/redeem`, { method: "POST" });

    if (!res.ok) {
      setSending(false);
      setError(true);
      return;
    }

    onRedeemed((await res.json()) as RedemptionQueueItem);
    setSending(false);
  }

  const meta = status === "locked" ? null : STATUS_META[status];

  const boxHeadline =
    status === "available"
      ? `Etapa ${reward.milestone.order_index} concluída`
      : meta?.label;

  const boxSubline =
    status === "delivered"
      ? `Recebido em ${formatDate(redemption!.reviewed_at!)}.`
      : status === "shipping"
        ? `Aprovado em ${formatDate(redemption!.reviewed_at!)} — em preparação para envio.`
        : status === "available"
          ? "Você já pode resgatar esta recompensa."
          : status === "pending"
            ? `Solicitado em ${formatDate(redemption!.requested_at)} — aguardando aprovação.`
            : status === "rejected"
              ? redemption!.admin_note || "Solicitação não aprovada."
              : undefined;

  return (
    <div className="flex w-64 shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-surface shadow-[0px_3px_6px_rgba(0,0,0,0.16)]">
      <div className="relative aspect-square shrink-0 p-8">
        <Image
          src="/blocked-gift/blocked-gift.png"
          alt=""
          fill
          priority
          sizes="256px"
          className="object-contain p-4"
        />
        {status === "locked" ? (
          <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-brand bg-surface text-ink-muted">
            <LockIcon />
          </span>
        ) : (
          <span
            className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-xs font-bold uppercase tracking-wide ${meta!.pillBg} ${meta!.pillText}`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-white ${meta!.iconBg}`}>
              {meta!.icon}
            </span>
            {meta!.label}
          </span>
        )}
      </div>

      <div className="border-t border-border" />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-sm font-semibold text-ink">{reward.title}</p>
          <p className="line-clamp-2 text-xs text-ink-muted">
            {reward.description || TYPE_LABEL[reward.type]}
          </p>
        </div>

        {status === "locked" ? (
          <div className="mt-auto">
            <p className="text-sm font-semibold text-ink">Recompensa bloqueada</p>
            <p className="text-xs text-ink-muted">
              Conclua a Etapa {reward.milestone.order_index} para desbloquear.
            </p>
          </div>
        ) : (
          <div className="mt-auto space-y-2">
            <div className={`rounded-xl p-3 ${meta!.boxBg}`}>
              <p className={`flex items-center gap-1.5 text-sm font-semibold ${meta!.boxText}`}>
                {meta!.icon}
                {boxHeadline}
              </p>
              {boxSubline && <p className={`mt-0.5 text-xs ${meta!.boxText}`}>{boxSubline}</p>}
            </div>

            {status === "available" && (
              <button
                type="button"
                onClick={handleRedeem}
                disabled={sending}
                className="flex w-full items-center justify-center gap-1 rounded-full bg-brand px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Enviando..." : "Resgatar recompensa"}
                {!sending && <ChevronRightIcon />}
              </button>
            )}

            {status === "available" && error && (
              <p className="text-xs text-pastel-red-text">Não foi possível enviar. Tente novamente.</p>
            )}

            {/* "Ver detalhes" / "Acompanhar entrega" ainda não têm uma página de
               destino no backend — ficam como preview visual do design até existir. */}
            {status === "delivered" && (
              <button
                type="button"
                disabled
                className="flex w-full cursor-default items-center justify-between rounded-full bg-canvas px-4 py-2.5 text-sm font-medium text-ink-muted"
              >
                Ver detalhes
                <ChevronRightIcon />
              </button>
            )}

            {status === "shipping" && (
              <button
                type="button"
                disabled
                className="flex w-full cursor-default items-center justify-between rounded-full bg-canvas px-4 py-2.5 text-sm font-medium text-ink-muted"
              >
                Acompanhar entrega
                <ChevronRightIcon />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <path d="M3 7h11v10H3z" />
      <path d="M14 10h4l3 3v4h-7z" />
      <circle cx="7.5" cy="18" r="1.5" />
      <circle cx="17.5" cy="18" r="1.5" />
    </svg>
  );
}

function GiftIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7" />
      <path d="M12 8c-1.5 0-4-1-4-3.2A2.3 2.3 0 0 1 10.3 2c1.8 0 1.7 3 1.7 6ZM12 8c1.5 0 4-1 4-3.2A2.3 2.3 0 0 0 13.7 2c-1.8 0-1.7 3-1.7 6Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <path d="M12 9v4" />
      <path d="M10.3 3.9 1.8 18a1.5 1.5 0 0 0 1.3 2.3h17.8a1.5 1.5 0 0 0 1.3-2.3L13.7 3.9a1.5 1.5 0 0 0-2.6 0Z" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
