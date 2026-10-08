import { programDeadline } from "@/app/dashboard/program-deadline";
import type { PartnerAccess, RedemptionQueueItem, StageHistory } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function daysAgo(iso: string, now: number): string {
  const days = Math.floor((now - Date.parse(iso)) / DAY_MS);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}

/** Cartões de resumo no topo do detalhe do parceiro. */
export function PartnerSummary({
  access,
  stages,
  redemptions,
}: {
  access: PartnerAccess | null;
  stages: StageHistory[];
  redemptions: RedemptionQueueItem[];
}) {
  // Mesmo padrão do ProgressFooter (página dinâmica, renderizada por request).
  const now = new Date().getTime();
  const completed = stages.filter((s) => s.status === "completed").length;
  const current = stages.find((s) => s.status !== "completed");
  const percent = stages.length > 0 ? Math.round((completed / stages.length) * 100) : 0;

  const invitedAt = access?.invited_at;
  const daysInProgram = invitedAt
    ? Math.max(0, Math.floor((now - Date.parse(invitedAt)) / DAY_MS))
    : null;
  const deadline = invitedAt ? programDeadline(invitedAt) : null;
  const overdue = deadline !== null && Date.parse(deadline) < now && current !== undefined;

  const pendingRedemptions = redemptions.filter((r) => r.status === "pending").length;
  const pendingEvidence = stages
    .flatMap((s) => s.tasks)
    .filter((t) => t.evidence?.status === "pending").length;

  return (
    <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card label="Progresso">
        <p className="text-lg font-semibold text-ink">
          {stages.length === 0
            ? "—"
            : current
              ? `Etapa ${current.order_index} de ${stages.length}`
              : "Jornada concluída"}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-track">
          <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          {completed} de {stages.length} etapas concluídas
        </p>
      </Card>

      <Card label="No programa">
        <p className="text-lg font-semibold text-ink">
          {daysInProgram === null ? "—" : `${daysInProgram} dia${daysInProgram === 1 ? "" : "s"}`}
        </p>
        {deadline && (
          <p className={`mt-1 text-xs ${overdue ? "text-pastel-red-text" : "text-ink-muted"}`}>
            {overdue ? "Prazo encerrado em" : "Prazo até"} {formatDate(deadline)}
          </p>
        )}
      </Card>

      <Card label="Último acesso">
        <p className="text-lg font-semibold text-ink">
          {access?.last_sign_in_at ? daysAgo(access.last_sign_in_at, now) : "Nunca acessou"}
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          {access?.last_sign_in_at
            ? formatDate(access.last_sign_in_at)
            : "Convite ainda não aceito"}
        </p>
      </Card>

      <Card label="Pendências">
        <p className="text-lg font-semibold text-ink">{pendingEvidence + pendingRedemptions}</p>
        <p className="mt-1 text-xs text-ink-muted">
          {pendingEvidence} evidência{pendingEvidence === 1 ? "" : "s"} · {pendingRedemptions}{" "}
          resgate{pendingRedemptions === 1 ? "" : "s"}
        </p>
      </Card>
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      {children}
    </div>
  );
}
