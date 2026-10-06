"use client";

import { useState, type FormEvent } from "react";
import type { EvidenceInputType, TaskWithEvidence } from "@/lib/types";

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

const AUTO_NOTE =
  "Nenhuma ação é necessária. Esta missão é concluída automaticamente pelo sistema.";

// Placeholder do campo conforme o tipo de comprovação (documento de conteúdo
// das telas — ex.: "voce@suaempresa.com.br", "https://...").
const TEXT_INPUT: Record<Exclude<EvidenceInputType, "file">, { type: string; placeholder: string }> = {
  email: { type: "email", placeholder: "voce@suaempresa.com.br" },
  url: { type: "url", placeholder: "https://..." },
  text: { type: "text", placeholder: "Digite o número" },
};

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
  // Missões "choice": a opção escolhida define o tipo de comprovação.
  const [optionKey, setOptionKey] = useState<string | null>(task.evidence?.option_key ?? null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
  const isChoice = task.evidence_type === "choice";
  const selectedOption = isChoice
    ? (task.evidence_options?.find((o) => o.key === optionKey) ?? null)
    : null;
  // null = missão "choice" sem opção escolhida ainda.
  const inputType: EvidenceInputType | null = isAuto
    ? null
    : isChoice
      ? (selectedOption?.evidence_type ?? null)
      : (task.evidence_type as EvidenceInputType);
  const evidenceLabel = selectedOption?.evidence_label ?? task.evidence_label;
  const isDone = isAuto || evidence?.status === "approved";
  const statusLabel = isAuto ? "Concluída" : evidence ? STATUS_LABEL[evidence.status] : "Disponível";
  const statusClass = isAuto ? "text-brand" : evidence ? STATUS_TEXT_CLASS[evidence.status] : "text-ink";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage(null);
    const choice = isChoice ? { optionKey } : {};

    if (inputType === "file") {
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
          body: JSON.stringify({ contentType: file.type, ...choice }),
        },
      );

      if (!uploadUrlRes.ok) {
        await failWith(uploadUrlRes);
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
        body: JSON.stringify({ filePath, ...choice }),
      });

      if (!res.ok) {
        await failWith(res);
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
      body: JSON.stringify({ textValue, ...choice }),
    });

    if (!res.ok) {
      await failWith(res);
      return;
    }

    setEvidence(await res.json());
    setStatus("idle");
    setTextValue("");
  }

  // Erros 400 do backend trazem a mensagem para o parceiro (ex.: "Digite um
  // e-mail válido."); qualquer outro erro cai no texto genérico.
  async function failWith(res: Response) {
    if (res.status === 400) {
      const body = (await res.json().catch(() => null)) as { message?: unknown } | null;
      if (typeof body?.message === "string") setErrorMessage(body.message);
    }
    setStatus("error");
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
                <p className="font-medium text-ink">Comprovação exigida</p>
                <p className="text-ink-muted">{isAuto ? AUTO_NOTE : evidenceLabel}</p>
              </div>
              <div>
                <p className="font-medium text-ink">Verificação</p>
                <p className="text-ink-muted">
                  {isAuto
                    ? "A conclusão é registrada automaticamente pelo sistema."
                    : "Revisado manualmente pela equipe Kaspersky."}
                </p>
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
                  {isChoice && (
                    <fieldset className="w-full">
                      <legend className="mb-2 text-sm font-medium text-ink">Escolha uma opção</legend>
                      <div className="flex flex-col gap-2">
                        {task.evidence_options?.map((option) => (
                          <label
                            key={option.key}
                            className={`flex cursor-pointer items-center gap-3 rounded-[10px] border px-4 py-2.5 text-sm transition ${
                              option.key === optionKey
                                ? "border-brand bg-brand-soft text-ink"
                                : "border-border bg-surface text-ink hover:border-brand"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`option-${task.id}`}
                              value={option.key}
                              checked={option.key === optionKey}
                              onChange={() => {
                                setOptionKey(option.key);
                                setFile(null);
                                setFileError(null);
                                setTextValue("");
                              }}
                              className="accent-[var(--color-brand)]"
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}

                  {inputType && inputType !== "file" && (
                    <input
                      type={TEXT_INPUT[inputType].type}
                      required
                      value={textValue}
                      onChange={(e) => setTextValue(e.target.value)}
                      placeholder={TEXT_INPUT[inputType].placeholder}
                      aria-label={evidenceLabel ?? "Comprovação"}
                      className="w-full rounded-[10px] border border-border bg-surface px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                  )}

                  {inputType === "file" && (
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
                    disabled={status === "sending" || !inputType || (inputType === "file" && !file)}
                    className="flex h-[52px] w-full max-w-[17rem] items-center justify-center gap-6 rounded-[10px] border-2 border-brand bg-surface text-base font-medium text-brand transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {status === "sending" ? "Enviando..." : "Enviar comprovação"}
                    {status !== "sending" && <SendIcon />}
                  </button>
                </form>
              )}

              {status === "error" && (
                <p className="text-xs text-pastel-red-text">
                  {errorMessage ?? "Não foi possível enviar. Tente novamente."}
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
