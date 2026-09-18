"use client";

import { useState, type FormEvent } from "react";
import type { EvidenceType, TaskWithEvidence } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "Em análise",
  approved: "Concluída",
  rejected: "Não aprovado",
};

const STATUS_TEXT_CLASS: Record<string, string> = {
  pending: "text-pastel-yellow-text",
  approved: "text-brand",
  rejected: "text-pastel-red-text",
};

// Não temos campos de "como completar"/"verificação" por tarefa no backend
// (só title/description/evidence_type) — o texto abaixo é genérico por tipo,
// não um dado inventado por tarefa específica.
function howToComplete(evidenceType: EvidenceType): string {
  if (evidenceType === "none") {
    return "Nenhuma ação é necessária. Esta missão é concluída automaticamente pelo sistema.";
  }
  if (evidenceType === "file") {
    return "Envie o arquivo solicitado (PDF, JPG ou PNG) no campo abaixo.";
  }
  return "Envie o link, e-mail ou número solicitado no campo abaixo.";
}

function verificationNote(evidenceType: EvidenceType): string {
  if (evidenceType === "none") {
    return "Nenhuma comprovação é necessária — a conclusão é registrada automaticamente pelo sistema.";
  }
  return "Revisado manualmente pela equipe Kaspersky.";
}

export function TaskAccordionRow({
  task,
  index,
  defaultOpen = false,
}: {
  task: TaskWithEvidence;
  index: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [evidence, setEvidence] = useState(task.evidence);
  const [textValue, setTextValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  const isAuto = task.evidence_type === "none";
  const isDone = isAuto || evidence?.status === "approved";
  const statusLabel = isAuto ? "Concluída" : evidence ? STATUS_LABEL[evidence.status] : "Disponível";
  const statusClass = isAuto ? "text-brand" : evidence ? STATUS_TEXT_CLASS[evidence.status] : "text-ink-muted";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    if (task.evidence_type === "file") {
      if (!file) {
        setStatus("error");
        return;
      }

      // 1. Pedimos un presigned POST — o backend valida tipo/tamanho e devolve
      //    a URL + campos assinados do bucket S3.
      const uploadUrlRes = await fetch(
        `/api/milestones/tasks/${task.id}/evidence/upload-url`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: file.type }),
        },
      );

      if (!uploadUrlRes.ok) {
        setStatus("error");
        return;
      }

      const { url, fields, filePath } = (await uploadUrlRes.json()) as {
        url: string;
        fields: Record<string, string>;
        filePath: string;
      };

      // 2. Subimos direto pro S3 — o arquivo nunca passa pelo nosso backend.
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
      formData.append("file", file);

      const s3Res = await fetch(url, { method: "POST", body: formData });
      if (!s3Res.ok) {
        setStatus("error");
        return;
      }

      // 3. Registramos a evidência com o path já enviado.
      const res = await fetch(`/api/milestones/tasks/${task.id}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setEvidence(await res.json());
      setStatus("idle");
      setFile(null);
      return;
    }

    const res = await fetch(`/api/milestones/tasks/${task.id}/evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textValue }),
    });

    if (!res.ok) {
      setStatus("error");
      return;
    }

    setEvidence(await res.json());
    setStatus("idle");
    setTextValue("");
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 py-4 text-left"
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            isDone ? "bg-brand text-white" : "bg-border"
          }`}
        >
          {isDone && <CheckIcon />}
        </span>
        <span className="w-6 shrink-0 text-sm font-semibold text-brand">
          {String(index).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{task.title}</span>
        <span className={`shrink-0 text-sm font-medium ${statusClass}`}>{statusLabel}</span>
        <ChevronIcon className={open ? "rotate-90" : ""} />
      </button>

      {open && (
        <div className="ml-10 space-y-4 pb-5 pr-2">
          {task.description && <p className="text-sm text-ink-muted">{task.description}</p>}

          <div>
            <p className="text-sm font-medium text-ink">Como completar</p>
            <p className="text-sm text-ink-muted">{howToComplete(task.evidence_type)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-ink">Verificação</p>
            <p className="text-sm text-ink-muted">{verificationNote(task.evidence_type)}</p>
          </div>

          {!isAuto && (
            <>
              {evidence?.status === "rejected" && evidence.review_note && (
                <p className="text-sm text-pastel-red-text">{evidence.review_note}</p>
              )}
              {evidence?.status === "pending" && (
                <p className="text-sm text-pastel-yellow-text">Sua evidência está em análise.</p>
              )}
              {evidence?.status === "approved" && (
                <p className="text-sm text-pastel-green-text">Evidência aprovada.</p>
              )}

              {(!evidence || evidence.status === "rejected") && (
                <form onSubmit={handleSubmit} className="flex gap-2">
                  {task.evidence_type === "text" ? (
                    <input
                      type="text"
                      required
                      value={textValue}
                      onChange={(e) => setTextValue(e.target.value)}
                      placeholder="Link, e-mail ou número"
                      className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                  ) : (
                    <label
                      htmlFor={`file-${task.id}`}
                      className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-surface px-3 py-1.5 text-sm text-ink-muted transition hover:border-brand hover:bg-brand-soft hover:text-ink"
                    >
                      <UploadIcon />
                      <span className="truncate">
                        {file ? file.name : "Escolher arquivo (PDF, JPG ou PNG)"}
                      </span>
                      <input
                        id={`file-${task.id}`}
                        type="file"
                        required
                        accept="application/pdf,image/jpeg,image/png"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        className="hidden"
                      />
                    </label>
                  )}
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="flex shrink-0 items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status !== "sending" && <SendIcon />}
                    {status === "sending" ? "Enviando..." : "Enviar"}
                  </button>
                </form>
              )}

              {status === "error" && (
                <p className="text-xs text-pastel-red-text">
                  Não foi possível enviar. Tente novamente.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 text-ink-muted transition-transform ${className}`}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M4 12h16" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}
