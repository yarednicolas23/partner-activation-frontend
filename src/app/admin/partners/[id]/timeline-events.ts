import type { PartnerAccess, RedemptionQueueItem, StageHistory } from "@/lib/types";

export type TimelineCategory = "missions" | "stages" | "rewards" | "access";
export type TimelineTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface TimelineEvent {
  key: string;
  at: string;
  category: TimelineCategory;
  tone: TimelineTone;
  title: string;
  /** Linha secundária (status, etapa, comentário). */
  detail?: string;
  /** Comentário do admin ou motivo da recusa, citado. */
  note?: string | null;
}

// Desempate no mesmo instante: a aprovação que fecha a etapa aparece antes
// (embaixo, na ordem decrescente) de "Etapa concluída".
const TIE_ORDER: Record<string, number> = {
  stage_completed: 2,
  evidence_reviewed: 1,
};

/**
 * Linha do tempo do parceiro montada com o que já existe: perfil/auth,
 * evidências, etapas e resgates. Não há log de eventos no backend, então
 * cada missão e cada resgate só têm o último estado (um reenvio ou nova
 * solicitação sobrescreve o anterior).
 */
export function buildTimeline(
  access: PartnerAccess | null,
  stages: StageHistory[],
  redemptions: RedemptionQueueItem[],
): TimelineEvent[] {
  const events: (TimelineEvent & { tie: number })[] = [];
  const push = (e: TimelineEvent, tie = 0) => events.push({ ...e, tie });

  if (access) {
    push({
      key: "invited",
      at: access.invited_at,
      category: "access",
      tone: "neutral",
      title: "Convidado pela Kaspersky",
    });
    if (access.first_sign_in_at) {
      push({
        key: "first-sign-in",
        at: access.first_sign_in_at,
        category: "access",
        tone: "info",
        title: "Primeiro acesso à plataforma",
      });
    }
    // Só o último login é guardado; se foi o primeiro, não repete.
    if (
      access.last_sign_in_at &&
      (!access.first_sign_in_at ||
        Date.parse(access.last_sign_in_at) - Date.parse(access.first_sign_in_at) > 60_000)
    ) {
      push({
        key: "last-sign-in",
        at: access.last_sign_in_at,
        category: "access",
        tone: "info",
        title: "Último acesso à plataforma",
      });
    }
    if (access.reminded_at) {
      push({
        key: "reminder",
        at: access.reminded_at,
        category: "access",
        tone: "warning",
        title: "Lembrete de inatividade enviado",
      });
    }
  }

  for (const stage of stages) {
    const stageLabel = `Etapa ${stage.order_index} — ${stage.title}`;
    if (stage.completed_at) {
      push(
        {
          key: `stage-${stage.id}`,
          at: stage.completed_at,
          category: "stages",
          tone: "success",
          title: `Etapa ${stage.order_index} concluída`,
          detail: stage.title,
        },
        TIE_ORDER.stage_completed,
      );
    }

    for (const task of stage.tasks) {
      const evidence = task.evidence;
      if (!evidence) continue;
      push({
        key: `evidence-sent-${evidence.id}`,
        at: evidence.submitted_at,
        category: "missions",
        tone: evidence.status === "pending" ? "warning" : "neutral",
        title: `Evidência enviada — ${task.title}`,
        detail: evidence.status === "pending" ? `${stageLabel} · Em análise` : stageLabel,
      });
      if (evidence.reviewed_at && evidence.status !== "pending") {
        const approved = evidence.status === "approved";
        push(
          {
            key: `evidence-reviewed-${evidence.id}`,
            at: evidence.reviewed_at,
            category: "missions",
            tone: approved ? "success" : "danger",
            title: `${approved ? "Evidência aprovada" : "Evidência não aprovada"} — ${task.title}`,
            detail: stageLabel,
            note: approved ? null : evidence.review_note,
          },
          TIE_ORDER.evidence_reviewed,
        );
      }
    }
  }

  for (const r of redemptions) {
    push({
      key: `redemption-requested-${r.id}`,
      at: r.requested_at,
      category: "rewards",
      tone: r.status === "pending" ? "warning" : "neutral",
      title: `Resgate solicitado — ${r.reward.title}`,
      detail: r.status === "pending" ? "Aguardando aprovação" : undefined,
    });
    if (r.reviewed_at && r.status !== "pending") {
      const copy = {
        approved: { title: "Resgate aprovado", tone: "success" },
        fulfilled: { title: "Recompensa entregue", tone: "success" },
        rejected: { title: "Resgate recusado", tone: "danger" },
      } as const;
      push({
        key: `redemption-reviewed-${r.id}`,
        at: r.reviewed_at,
        category: "rewards",
        tone: copy[r.status].tone,
        title: `${copy[r.status].title} — ${r.reward.title}`,
        note: r.admin_note,
      });
    }
  }

  return events
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at) || b.tie - a.tie)
    .map(({ key, at, category, tone, title, detail, note }) => ({
      key,
      at,
      category,
      tone,
      title,
      detail,
      note,
    }));
}
