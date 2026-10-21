"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProgramDeadline } from "@/lib/types";
import {
  EXTENSION_STATUS_CLASS,
  EXTENSION_STATUS_LABEL,
  formatDate,
  toDateInputValue,
  todayInputValue,
} from "@/lib/deadline";
import { ExtensionReview } from "../../timeline/extension-review";

/**
 * Prazo do programa no detalhe do parceiro: prazo atual e origem (padrão ou
 * ajustado), ajuste manual, revisão da solicitação de prorrogação pendente e
 * histórico de solicitações.
 */
export function DeadlinePanel({ deadline }: { deadline: ProgramDeadline }) {
  const [editing, setEditing] = useState(false);
  const pending = deadline.requests.find((r) => r.status === "pending");
  const reviewed = deadline.requests.filter((r) => r.status !== "pending");

  const state = deadline.journey_completed
    ? { label: "Jornada concluída", className: "bg-brand-soft text-ink" }
    : deadline.expired
      ? { label: "Vencido", className: "bg-pastel-red-bg text-pastel-red-text" }
      : { label: "Vigente", className: "bg-pastel-green-bg text-pastel-green-text" };

  return (
    <section className="mb-10 rounded-lg border border-border bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 text-lg font-semibold tracking-tight text-ink">Prazo do programa</h2>
          <p className="flex flex-wrap items-center gap-2 text-sm text-ink">
            <span className="text-xl font-semibold">{formatDate(deadline.deadline_at)}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${state.className}`}>
              {state.label}
            </span>
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {deadline.source === "program"
              ? `Prazo geral vigente no convite (${formatDate(deadline.started_at)}).`
              : `${deadline.source === "extension" ? "Prorrogado" : "Ajustado"} em ${formatDate(
                  deadline.updated_at ?? deadline.deadline_at,
                )}${deadline.note ? ` — “${deadline.note}”` : "."}`}
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="whitespace-nowrap text-sm font-medium text-brand hover:underline"
          >
            Alterar prazo
          </button>
        )}
      </div>

      {editing && <EditDeadlineForm deadline={deadline} onClose={() => setEditing(false)} />}

      {pending && deadline.suggested_extension_deadline_at && (
        <div className="mt-6 border-t border-border pt-4">
          <p className="mb-1 text-sm font-medium text-ink">Solicitação de prorrogação pendente</p>
          <p className="mb-3 text-xs text-ink-muted">
            Solicitada em {formatDate(pending.requested_at)} · prazo vencido em{" "}
            {formatDate(pending.previous_deadline_at)}
          </p>
          {pending.reason && (
            <p className="mb-3 rounded-md bg-canvas px-3 py-2 text-sm text-ink">“{pending.reason}”</p>
          )}
          <ExtensionReview
            requestId={pending.id}
            suggestedDeadlineAt={deadline.suggested_extension_deadline_at}
          />
        </div>
      )}

      {reviewed.length > 0 && (
        <div className="mt-6 border-t border-border pt-4">
          <p className="mb-2 text-sm font-medium text-ink">Solicitações anteriores</p>
          <ul className="space-y-2">
            {reviewed.map((r) => (
              <li key={r.id} className="text-sm">
                <span
                  className={`mr-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${EXTENSION_STATUS_CLASS[r.status]}`}
                >
                  {EXTENSION_STATUS_LABEL[r.status]}
                </span>
                <span className="text-ink-muted">
                  Solicitada em {formatDate(r.requested_at)}
                  {r.reviewed_at && ` · analisada em ${formatDate(r.reviewed_at)}`}
                  {r.new_deadline_at && ` · novo prazo ${formatDate(r.new_deadline_at)}`}
                </span>
                {r.admin_note && <p className="mt-0.5 text-xs text-ink-muted">“{r.admin_note}”</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function EditDeadlineForm({
  deadline,
  onClose,
}: {
  deadline: ProgramDeadline;
  onClose: () => void;
}) {
  const router = useRouter();
  const [date, setDate] = useState(() => toDateInputValue(deadline.deadline_at));
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    const res = await fetch(`/api/admin/partners/${deadline.partner_id}/deadline`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deadlineDate: date, note: note.trim() || undefined }),
    });

    if (res.ok) {
      onClose();
      router.refresh();
      return;
    }
    const data = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
    setError(
      res.status === 400 && message ? message : "Não foi possível salvar. Tente novamente.",
    );
    setStatus("idle");
  }

  return (
    <form
      onSubmit={save}
      className="mt-4 grid gap-3 rounded-md border border-border bg-canvas/40 p-4 sm:grid-cols-[180px_1fr]"
    >
      <div>
        <label
          htmlFor="deadline-date"
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink"
        >
          Novo prazo
        </label>
        <input
          id="deadline-date"
          type="date"
          required
          value={date}
          min={todayInputValue()}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>
      <div>
        <label
          htmlFor="deadline-note"
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink"
        >
          Motivo{" "}
          <span className="font-normal normal-case tracking-normal text-ink-muted">
            (opcional, uso interno)
          </span>
        </label>
        <input
          id="deadline-note"
          type="text"
          value={note}
          maxLength={1000}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>
      <div className="sm:col-span-2">
        {error && <p className="mb-2 text-sm text-pastel-red-text">{error}</p>}
        <p className="mb-3 text-xs text-ink-muted">
          O prazo vale até o fim do dia escolhido (horário de Brasília). Não altera
          solicitações de prorrogação pendentes.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={status === "saving"}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-canvas disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={status === "saving" || !date}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
          >
            {status === "saving" ? "Salvando..." : "Salvar prazo"}
          </button>
        </div>
      </div>
    </form>
  );
}
