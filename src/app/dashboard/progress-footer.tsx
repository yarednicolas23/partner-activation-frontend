import Image from "next/image";
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
        icon="/clock.svg"
        label="Tempo restante para concluir o programa"
        value={timeRemainingLabel(deadline)}
        valueClassName="text-brand"
      />
      <Stat
        className="sm:pl-6"
        icon="/safari.svg"
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
        icon="/next.svg"
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
  icon: string;
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
  className?: string;
}) {
  // Diseño XD: ícono en tile de 56px, fondo #F1F5F8, radius 16px.
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-nav-pill">
        <Image src={icon} alt="" width={31} height={31} className="h-[31px] w-auto" />
      </span>
      <div className="min-w-0 font-display">
        <p className="text-sm text-ink-muted">{label}</p>
        <p className={`text-[22px] font-semibold leading-tight ${valueClassName}`}>{value}</p>
        {sub && <p className="text-xs text-ink-muted">{sub}</p>}
      </div>
    </div>
  );
}
