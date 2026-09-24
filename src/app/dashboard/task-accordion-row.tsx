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
    return "Envie o arquivo solicitado (PDF, JPG ou PNG) no campo ao lado.";
  }
  return "Envie o link, e-mail ou número solicitado no campo ao lado.";
}

function verificationNote(evidenceType: EvidenceType): string {
  if (evidenceType === "none") {
    return "Nenhuma comprovação é necessária — a conclusão é registrada automaticamente pelo sistema.";
  }
  return "Revisado manualmente pela equipe Kaspersky.";
}

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

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
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Mismos límites que valida el backend (backend/src/aws/s3.service.ts) —
  // acá solo para avisar antes de subir.
  function pickFile(picked: File | null) {
    if (picked && !ACCEPTED_TYPES.includes(picked.type)) {
      setFileError("Formato não suportado. Envie um PDF, JPG ou PNG.");
      return;
    }
    if (picked && picked.size > MAX_FILE_BYTES) {
      setFileError("O arquivo excede o limite de 10 MB.");
      return;
    }
    setFileError(null);
    setFile(picked);
  }

  const isAuto = task.evidence_type === "none";
  const isDone = isAuto || evidence?.status === "approved";
  const statusLabel = isAuto ? "Concluída" : evidence ? STATUS_LABEL[evidence.status] : "Disponível";
  const statusClass = isAuto ? "text-brand" : evidence ? STATUS_TEXT_CLASS[evidence.status] : "text-ink";

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
        className="flex w-full items-center gap-6 px-4 py-4 text-left"
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center"
        >
          {isDone ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white">
              <CheckIcon />
            </span>
          ) : (
            <span className="h-3 w-3 rounded-full bg-[#5b5b5b]" />
          )}
        </span>
        <span className="w-6 shrink-0 text-sm font-medium text-brand">
          {String(index).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1 truncate text-base font-semibold text-ink">{task.title}</span>
        <span className={`shrink-0 text-sm font-medium ${statusClass}`}>{statusLabel}</span>
        <ChevronIcon className={`${open ? "rotate-90" : ""} ${isDone ? "text-brand" : "text-ink"}`} />
      </button>

      {open && (
        <div
          className={`grid gap-6 px-4 pb-6 pt-2 ${
            isAuto ? "" : "md:grid-cols-[1.2fr_1fr] md:divide-x md:divide-border"
          }`}
        >
          {/* Diseño XD: columna izquierda con el detalle de la misión. */}
          <div className="flex items-start gap-5 md:pr-6">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-nav-pill">
              <TaskDocIcon />
            </span>
            <div className="space-y-5 text-[15px] leading-snug">
              {task.description && <p className="text-ink-muted">{task.description}</p>}
              <div>
                <p className="font-medium text-ink">Como concluir</p>
                <p className="text-ink-muted">{howToComplete(task.evidence_type)}</p>
              </div>
              <div>
                <p className="font-medium text-ink">Verificação</p>
                <p className="text-ink-muted">{verificationNote(task.evidence_type)}</p>
              </div>
            </div>
          </div>

          {!isAuto && (
            <div className="space-y-3 md:pl-6">
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
                <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
                  {task.evidence_type === "text" ? (
                    <input
                      type="text"
                      required
                      value={textValue}
                      onChange={(e) => setTextValue(e.target.value)}
                      placeholder="Link, e-mail ou número"
                      className="w-full rounded-[10px] border border-border bg-surface px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                  ) : (
                    <label
                      htmlFor={`file-${task.id}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragging(false);
                        pickFile(e.dataTransfer.files?.[0] ?? null);
                      }}
                      className={`flex w-full cursor-pointer flex-col items-center rounded-[16px] border-2 border-dashed px-6 py-6 text-center transition ${
                        dragging ? "border-brand bg-brand-soft" : "border-border bg-[#f8fafb] hover:border-brand"
                      }`}
                    >
                      <DocumentUploadIcon />
                      <span className="mt-3 text-sm text-ink">
                        {file ? (
                          <span className="font-semibold">{file.name}</span>
                        ) : (
                          <>
                            Arraste e solte o arquivo aqui ou{" "}
                            <span className="font-semibold underline underline-offset-2">
                              Escolha o arquivo
                            </span>
                          </>
                        )}
                      </span>
                      <span className="mt-1 text-xs text-[#c4c4c4]">
                        {file ? "Clique para trocar o arquivo" : "PDF, JPG ou PNG (máx. 10 MB)"}
                      </span>
                      <input
                        id={`file-${task.id}`}
                        type="file"
                        accept={ACCEPTED_TYPES.join(",")}
                        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                        className="hidden"
                      />
                    </label>
                  )}

                  {fileError && <p className="text-xs text-pastel-red-text">{fileError}</p>}

                  <button
                    type="submit"
                    disabled={status === "sending" || (task.evidence_type === "file" && !file)}
                    className="flex h-[52px] w-full max-w-[17rem] items-center justify-center gap-6 rounded-[10px] border-2 border-brand bg-surface text-base font-medium text-brand transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {status === "sending" ? "Enviando..." : "Enviar comprovação"}
                    {status !== "sending" && <SendIcon />}
                  </button>
                </form>
              )}

              {status === "error" && (
                <p className="text-xs text-pastel-red-text">
                  Não foi possível enviar. Tente novamente.
                </p>
              )}
            </div>
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 transition-transform ${className}`}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function TaskDocIcon() {
  return (
    <svg width="26" height="28" viewBox="0 0 26 28" fill="none" stroke="var(--color-brand)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 26H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3h13a3 3 0 0 1 3 3v10" />
      <path d="M7 9h9M7 14h6" />
      <path d="m15.5 22 3 3 5.5-6" />
    </svg>
  );
}

function DocumentUploadIcon() {
  return (
    <svg width="48" height="56" viewBox="0 0 48 56" aria-hidden="true">
      <path d="M6 2h20l12 12v32a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Z" fill="#e3e6e9" />
      <path d="M26 2v8a4 4 0 0 0 4 4h8Z" fill="#cfd4d8" />
      <circle cx="34" cy="42" r="12" fill="var(--color-brand)" />
      <path d="M34 47v-9m-4 3.5 4-4 4 4M29.5 48.5h9" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}
