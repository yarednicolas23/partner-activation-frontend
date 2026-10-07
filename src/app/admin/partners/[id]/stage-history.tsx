import type { EvidenceStatus, StageHistory, StageHistoryStatus } from "@/lib/types";

const STAGE_LABEL: Record<StageHistoryStatus, string> = {
  completed: "Concluída",
  in_progress: "Em andamento",
  not_started: "Não iniciada",
  locked: "Bloqueada",
};

const STAGE_CLASS: Record<StageHistoryStatus, string> = {
  completed: "bg-pastel-green-bg text-pastel-green-text",
  in_progress: "bg-pastel-yellow-bg text-pastel-yellow-text",
  not_started: "bg-canvas text-ink-muted",
  locked: "bg-canvas text-ink-muted",
};

const EVIDENCE_LABEL: Record<EvidenceStatus, string> = {
  pending: "Em análise",
  approved: "Aprovada",
  rejected: "Não aprovada",
};

const EVIDENCE_CLASS: Record<EvidenceStatus, string> = {
  pending: "text-pastel-yellow-text",
  approved: "text-pastel-green-text",
  rejected: "text-pastel-red-text",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

/**
 * O que o parceiro fez em cada etapa: status, início/conclusão e cada missão
 * com envio e revisão. Mostra só a última tentativa de cada missão — o
 * backend não guarda envios anteriores a um reenvio.
 */
export function StageHistoryList({ stages }: { stages: StageHistory[] }) {
  if (stages.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-ink-muted">
        Não foi possível carregar o histórico por etapa.
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {stages.map((stage) => (
        <li key={stage.id} className="rounded-lg border border-border bg-surface p-6">
          <div className="mb-1 flex items-start justify-between gap-4">
            <p className="text-sm font-medium text-ink">
              Etapa {stage.order_index} — {stage.title}
            </p>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_CLASS[stage.status]}`}
            >
              {STAGE_LABEL[stage.status]}
            </span>
          </div>

          {(stage.started_at || stage.completed_at) && (
            <p className="text-xs text-ink-muted">
              {stage.started_at && `Iniciada em ${formatDate(stage.started_at)}`}
              {stage.started_at && stage.completed_at && " · "}
              {stage.completed_at && `Concluída em ${formatDate(stage.completed_at)}`}
            </p>
          )}

          {stage.status !== "locked" && stage.tasks.length > 0 && (
            <ul className="mt-4 divide-y divide-border border-t border-border">
              {stage.tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2 text-sm"
                >
                  <span className="text-ink">{task.title}</span>
                  <TaskStatus task={task} />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}

function TaskStatus({ task }: { task: StageHistory["tasks"][number] }) {
  if (task.evidence_type === "none") {
    return <span className="text-xs text-ink-muted">Automática</span>;
  }

  const evidence = task.evidence;
  if (!evidence) {
    return <span className="text-xs text-ink-muted">Não enviada</span>;
  }

  return (
    <span className="text-right text-xs">
      <span className={`font-medium ${EVIDENCE_CLASS[evidence.status]}`}>
        {EVIDENCE_LABEL[evidence.status]}
      </span>
      <span className="text-ink-muted">
        {" · "}enviada em {formatDate(evidence.submitted_at)}
        {evidence.reviewed_at && ` · revisada em ${formatDate(evidence.reviewed_at)}`}
      </span>
      {evidence.status === "rejected" && evidence.review_note && (
        <span className="block text-pastel-red-text">{evidence.review_note}</span>
      )}
    </span>
  );
}
