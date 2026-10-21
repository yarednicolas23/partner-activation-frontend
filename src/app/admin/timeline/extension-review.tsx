"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toDateInputValue, todayInputValue } from "@/lib/deadline";

/**
 * Aprovar ou recusar uma solicitação de prorrogação. Na aprovação, a data
 * vem pré-preenchida com o prazo sugerido pelo backend (+3 meses) e o admin
 * pode ajustá-la. A nota aparece para o parceiro no painel dele.
 */
export function ExtensionReview({
  requestId,
  suggestedDeadlineAt,
}: {
  requestId: string;
  suggestedDeadlineAt: string;
}) {
  const router = useRouter();
  const [date, setDate] = useState(() => toDateInputValue(suggestedDeadlineAt));
  const [note, setNote] = useState("");
  const [noteRequired, setNoteRequired] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  async function review(next: "approved" | "rejected") {
    // Sem motivo o parceiro só vê "recusada", sem saber o porquê.
    if (next === "rejected" && !note.trim()) {
      setNoteRequired(true);
      return;
    }
    setStatus("saving");
    setError(null);
    const res = await fetch(`/api/admin/deadline-requests/${requestId}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: next,
        deadlineDate: next === "approved" ? date : undefined,
        note: note.trim() || undefined,
      }),
    });

    if (res.ok) {
      router.refresh();
      return;
    }
    const data = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
    setError(
      (res.status === 400 || res.status === 409) && message
        ? message
        : "Não foi possível salvar. Tente novamente.",
    );
    setStatus("idle");
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
      <div>
        <label
          htmlFor={`extension-date-${requestId}`}
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink"
        >
          Novo prazo
        </label>
        <input
          id={`extension-date-${requestId}`}
          type="date"
          value={date}
          min={todayInputValue()}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>
      <div>
        <label
          htmlFor={`extension-note-${requestId}`}
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink"
        >
          Nota para o parceiro{" "}
          <span className="font-normal normal-case tracking-normal text-ink-muted">
            (obrigatória ao recusar)
          </span>
        </label>
        <textarea
          id={`extension-note-${requestId}`}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (e.target.value.trim()) setNoteRequired(false);
          }}
          rows={2}
          maxLength={1000}
          aria-invalid={noteRequired}
          className={`w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-1 ${
            noteRequired
              ? "border-pastel-red-text focus:border-pastel-red-text focus:ring-pastel-red-text"
              : "border-border focus:border-brand focus:ring-brand"
          }`}
        />
      </div>

      <div className="sm:col-span-2">
        {noteRequired && (
          <p className="mb-2 text-sm text-pastel-red-text">
            Escreva o motivo da recusa — o parceiro verá no painel dele.
          </p>
        )}
        {error && <p className="mb-2 text-sm text-pastel-red-text">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => review("rejected")}
            disabled={status === "saving"}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-pastel-red-text transition hover:bg-pastel-red-bg disabled:opacity-60"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => review("approved")}
            disabled={status === "saving" || !date}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
          >
            {status === "saving" ? "Salvando..." : "Aprovar prorrogação"}
          </button>
        </div>
      </div>
    </div>
  );
}
