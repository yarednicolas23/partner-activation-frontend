import type { MilestoneView } from "@/lib/types";
import { isMilestoneComplete } from "./stage-art";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Prazo confirmado do programa: 1 ano por parceiro a partir do registro
// (ver CLAUDE.md — Timeline). Não há campo de deadline no backend ainda,
// então derivamos da data de criação do perfil em vez de inventar um valor.
function addYears(iso: string, years: number): string {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}

export function ProgressSummary({
  milestones,
  registeredAt,
}: {
  milestones: MilestoneView[];
  registeredAt: string;
}) {
  const total = milestones.length;
  const completed = milestones.filter(isMilestoneComplete).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const deadline = addYears(registeredAt, 1);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:w-[560px] lg:shrink-0">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm text-ink-muted">Progresso geral</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-brand">{percent}%</p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <dl className="mt-4 flex items-center gap-4 text-xs text-ink-muted">
          <div className="flex items-center gap-1.5">
            <CalendarIcon />
            <span>
              Início: <span className="font-medium text-ink">{formatDate(registeredAt)}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarIcon />
            <span>
              Prazo: <span className="font-medium text-ink">{formatDate(deadline)}</span>
            </span>
          </div>
        </dl>
      </div>

      <a
        href="#rewards"
        className="group flex flex-col justify-center rounded-2xl border border-border bg-surface p-5 transition hover:border-brand"
      >
        <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand">
          <GiftIcon />
        </span>
        <p className="text-sm font-medium text-ink">Veja as recompensas que você pode ganhar</p>
        <span className="mt-1 flex items-center gap-1 text-sm font-medium text-brand">
          Ir para Recompensas
          <ArrowIcon />
        </span>
      </a>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7" />
      <path d="M12 8c-1.5 0-4-1-4-3.2A2.3 2.3 0 0 1 10.3 2c1.8 0 1.7 3 1.7 6ZM12 8c1.5 0 4-1 4-3.2A2.3 2.3 0 0 0 13.7 2c-1.8 0-1.7 3-1.7 6Z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition group-hover:translate-x-0.5">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
