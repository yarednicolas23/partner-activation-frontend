"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TimelineRow } from "@/lib/types";
import { formatDate, SOURCE_LABEL, toDateInputValue, todayInputValue } from "@/lib/deadline";

type Filter = "all" | "active" | "expired" | "pending";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Em andamento" },
  { value: "expired", label: "Prazo vencido" },
  { value: "pending", label: "Prorrogação pendente" },
];

function isCompleted(row: TimelineRow): boolean {
  return row.total_stages > 0 && row.completed_stages === row.total_stages;
}

function matches(row: TimelineRow, filter: Filter): boolean {
  switch (filter) {
    case "active":
      return !isCompleted(row) && !row.expired;
    case "expired":
      return !isCompleted(row) && row.expired;
    case "pending":
      return row.pending_request_id !== null;
    default:
      return true;
  }
}

/** Prazo de cada parceiro, com ajuste individual (ampliar ou corrigir). */
export function TimelineTable({ rows }: { rows: TimelineRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const visible = rows.filter((r) => matches(r, filter));

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-ink-muted">
        Nenhum parceiro convidado ainda.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar parceiros">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          const count = rows.filter((r) => matches(r, f.value)).length;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active ? "bg-ink text-surface" : "bg-nav-pill text-ink-muted hover:text-ink"
              }`}
            >
              {f.label} <span className="opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3 font-medium">Parceiro</th>
              <th className="px-4 py-3 font-medium">Início</th>
              <th className="px-4 py-3 font-medium">Progresso</th>
              <th className="px-4 py-3 font-medium">Prazo</th>
              <th className="px-4 py-3" aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-muted">
                  Nenhum parceiro neste filtro.
                </td>
              </tr>
            )}
            {visible.map((row) => {
              const editing = editingId === row.partner.id;
              const completed = isCompleted(row);
              return (
                <Fragment key={row.partner.id}>
                  <tr className={editing ? "bg-canvas/40" : "border-b border-border last:border-b-0"}>
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/admin/partners/${row.partner.id}`}
                        className="font-medium text-ink hover:underline"
                      >
                        {row.partner.full_name ?? row.partner.email}
                      </Link>
                      <p className="text-xs text-ink-muted">
                        {row.partner.company_name ?? row.partner.email}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-ink-muted">
                      {formatDate(row.started_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top">
                      {completed ? (
                        <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-ink">
                          Jornada concluída
                        </span>
                      ) : (
                        <span className="text-ink">
                          {row.completed_stages} de {row.total_stages} etapas
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="whitespace-nowrap text-ink">{formatDate(row.deadline_at)}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="rounded-full bg-nav-pill px-2 py-0.5 text-xs text-ink-muted">
                          {SOURCE_LABEL[row.source]}
                        </span>
                        {row.expired && !completed && (
                          <span className="rounded-full bg-pastel-red-bg px-2 py-0.5 text-xs font-medium text-pastel-red-text">
                            Vencido
                          </span>
                        )}
                        {row.pending_request_id && (
                          <a
                            href="#solicitacoes"
                            className="rounded-full bg-pastel-yellow-bg px-2 py-0.5 text-xs font-medium text-pastel-yellow-text hover:underline"
                          >
                            Prorrogação pendente
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      {!completed && (
                        <button
                          type="button"
                          onClick={() => setEditingId(editing ? null : row.partner.id)}
                          aria-expanded={editing}
                          className="whitespace-nowrap text-sm font-medium text-brand hover:underline"
                        >
                          {editing ? "Fechar" : "Ajustar prazo"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {editing && (
                    <tr className="border-b border-border bg-canvas/40 last:border-b-0">
                      <td colSpan={5} className="px-4 pb-5 pt-1">
                        <DeadlineEditor row={row} onDone={() => setEditingId(null)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeadlineEditor({ row, onDone }: { row: TimelineRow; onDone: () => void }) {
  const router = useRouter();
  const [date, setDate] = useState(() => {
    // Prazo vencido: o mínimo do input é hoje, então parte de hoje.
    const current = toDateInputValue(row.deadline_at);
    const today = todayInputValue();
    return current < today ? today : current;
  });
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    const res = await fetch(`/api/admin/partners/${row.partner.id}/deadline`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deadlineDate: date, note: note.trim() || undefined }),
    });

    if (res.ok) {
      onDone();
      router.refresh();
      return;
    }
    const data = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
    setError(res.status === 400 && message ? message : "Não foi possível salvar. Tente novamente.");
    setStatus("idle");
  }

  return (
    <form
      onSubmit={save}
      className="grid gap-3 rounded-md border border-border bg-surface p-4 sm:grid-cols-[180px_1fr_auto] sm:items-end"
    >
      <div>
        <label
          htmlFor={`deadline-${row.partner.id}`}
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink"
        >
          Novo prazo
        </label>
        <input
          id={`deadline-${row.partner.id}`}
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
          htmlFor={`deadline-note-${row.partner.id}`}
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink"
        >
          Motivo{" "}
          <span className="font-normal normal-case tracking-normal text-ink-muted">
            (opcional, uso interno)
          </span>
        </label>
        <input
          id={`deadline-note-${row.partner.id}`}
          type="text"
          value={note}
          maxLength={1000}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>
      <button
        type="submit"
        disabled={status === "saving" || !date}
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
      >
        {status === "saving" ? "Salvando..." : "Salvar prazo"}
      </button>
      {error && <p className="text-sm text-pastel-red-text sm:col-span-3">{error}</p>}
      <p className="text-xs text-ink-muted sm:col-span-3">
        Vale até o fim do dia escolhido (horário de Brasília). Afeta só este parceiro.
      </p>
    </form>
  );
}
