import type { MilestoneView } from "@/lib/types";
import { findCurrentMilestone, isMilestoneComplete, stageTaskProgress } from "./stage-art";

// Mesma regra confirmada de 1 ano por parceiro usada no ProgressSummary —
// não há campo de deadline no backend ainda, então derivamos daqui também.
function addYears(iso: string, years: number): string {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function timeRemainingLabel(deadlineIso: string): string {
  const now = new Date();
  const deadline = new Date(deadlineIso);
  if (deadline <= now) return "Prazo encerrado";

  let months = (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth());
  const cursor = new Date(now);
  cursor.setMonth(cursor.getMonth() + months);
  if (cursor > deadline) {
    months -= 1;
    cursor.setMonth(cursor.getMonth() - 1);
  }
  const days = Math.round((deadline.getTime() - cursor.getTime()) / 86_400_000);

  if (months > 0 && days > 0) {
    return `${pluralize(months, "mês", "meses")} e ${pluralize(days, "dia", "dias")}`;
  }
  if (months > 0) return pluralize(months, "mês", "meses");
  if (days > 0) return pluralize(days, "dia", "dias");
  return "Menos de 1 dia";
}

export function ProgressFooter({
  milestones,
  registeredAt,
}: {
  milestones: MilestoneView[];
  registeredAt: string;
}) {
  if (milestones.length === 0) return null;

  const deadline = addYears(registeredAt, 1);
  const allDone = milestones.every(isMilestoneComplete);
  const current = findCurrentMilestone(milestones);
  const next = current
    ? milestones.find((m) => m.order_index === current.order_index + 1)
    : null;
  const currentProgress = current ? stageTaskProgress(current) : null;
  const remaining = currentProgress ? currentProgress.total - currentProgress.completed : 0;

  return (
    <div className="mt-6 grid gap-6 rounded-[10px] bg-surface p-6 shadow-[0px_3px_6px_rgba(0,0,0,0.16)] sm:grid-cols-3 sm:divide-x sm:divide-border">
      <Stat
        icon={<ClockIcon />}
        label="Tempo restante do programa"
        value={timeRemainingLabel(deadline)}
        valueClassName="text-brand"
      />
      <Stat
        className="sm:pl-6"
        icon={<CapIcon />}
        label="Etapa atual"
        value={allDone ? "Programa concluído" : (current?.title ?? "—")}
        sub={
          !allDone && current && currentProgress
            ? `${currentProgress.completed} de ${currentProgress.total} missões concluídas`
            : undefined
        }
      />
      <Stat
        className="sm:pl-6"
        icon={<SkipIcon />}
        label="Próxima etapa"
        value={allDone ? "—" : next ? `Etapa ${next.order_index}` : "Última etapa"}
        valueClassName="text-brand"
        sub={
          !allDone && next
            ? `Falta${remaining === 1 ? "" : "m"} ${pluralize(remaining, "missão", "missões")} para desbloquear`
            : undefined
        }
      />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  valueClassName = "text-ink",
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm text-ink-muted">{label}</p>
        <p className={`text-base font-semibold ${valueClassName}`}>{value}</p>
        {sub && <p className="text-xs text-ink-muted">{sub}</p>}
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function CapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 10 5-10 5L2 8Z" />
      <path d="M6 10.5V16c0 1.1 2.7 3 6 3s6-1.9 6-3v-5.5" />
    </svg>
  );
}

function SkipIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4v16l10-8Z" />
      <path d="M19 5v14" />
    </svg>
  );
}
