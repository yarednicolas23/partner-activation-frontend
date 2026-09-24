import type { MilestoneView } from "@/lib/types";

// Cada etapa tem 6 variantes de arte isométrica em /public/ETAPA 0N/,
// nomeadas "0N-0V - Rótulo.png" (V = 01 Blocked … 06 Hover).
export type StageVisualStatus = "locked" | "base" | "review" | "alert" | "completed";

const VARIANT_LABEL: Record<StageVisualStatus, string> = {
  // Decisión de diseño: las etapas bloqueadas muestran el edificio "Base"
  // (el estado bloqueado ya lo indican el candado y el texto "Bloqueada").
  locked: "02 - Base",
  base: "02 - Base",
  review: "03 - Review",
  alert: "04 - Alert",
  completed: "05 - Completed",
};

const HOVER_LABEL = "06 - Hover";

function stageRequiredTasks(milestone: MilestoneView) {
  return (milestone.tasks ?? []).filter((t) => t.evidence_type !== "none");
}

export function isMilestoneComplete(milestone: MilestoneView): boolean {
  const required = stageRequiredTasks(milestone);
  return required.length > 0 && required.every((t) => t.evidence?.status === "approved");
}

// Deriva o estado visual da etapa a partir do progresso real das tarefas —
// nenhum estado é inventado, todos vêm do evidence.status já existente.
export function stageVisualStatus(milestone: MilestoneView): StageVisualStatus {
  if (milestone.locked) return "locked";
  if (isMilestoneComplete(milestone)) return "completed";

  const required = stageRequiredTasks(milestone);
  if (required.some((t) => t.evidence?.status === "rejected")) return "alert";
  if (required.some((t) => t.evidence?.status === "pending")) return "review";
  return "base";
}

// A etapa "atual" é a primeira desbloqueada e ainda não concluída — a mesma
// regra usada para abrir o painel de detalhe por padrão no mapa da jornada.
export function findCurrentMilestone(milestones: MilestoneView[]): MilestoneView | null {
  return milestones.find((m) => !m.locked && !isMilestoneComplete(m)) ?? null;
}

export function stageTaskProgress(milestone: MilestoneView): {
  completed: number;
  total: number;
  percent: number;
} {
  const required = stageRequiredTasks(milestone);
  const completed = required.filter((t) => t.evidence?.status === "approved").length;
  const total = required.length;
  return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

// next/image encodes the src itself — passing an already-encoded path here
// would get double-encoded and 404.
export function stageImageSrc(orderIndex: number, variant: StageVisualStatus | "hover"): string {
  const prefix = String(orderIndex).padStart(2, "0");
  const folder = `ETAPA ${prefix}`;
  const label = variant === "hover" ? HOVER_LABEL : VARIANT_LABEL[variant];
  return `/${folder}/${prefix}-${label}.png`;
}
