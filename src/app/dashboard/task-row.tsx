"use client";

import { useState, type FormEvent } from "react";
import type { TaskWithEvidence } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "Em análise",
  approved: "Aprovado",
  rejected: "Não aprovado",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-pastel-yellow-bg text-pastel-yellow-text",
  approved: "bg-pastel-green-bg text-pastel-green-text",
  rejected: "bg-pastel-red-bg text-pastel-red-text",
};

export function TaskRow({ task }: { task: TaskWithEvidence }) {
  const [evidence, setEvidence] = useState(task.evidence);
  const [textValue, setTextValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  if (task.evidence_type === "none") {
    return (
      <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
        <p className="text-sm text-ink">{task.title}</p>
        <span className="rounded-full bg-pastel-green-bg px-2.5 py-0.5 text-xs font-medium text-pastel-green-text">
          Concluído
        </span>
      </div>
    );
  }

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
    <div className="border-b border-border pb-3 last:border-0 last:pb-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm text-ink">{task.title}</p>
        {evidence && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[evidence.status]}`}
          >
            {STATUS_LABEL[evidence.status]}
          </span>
        )}
      </div>
      {task.description && (
        <p className="mb-2 text-xs text-ink-muted">{task.description}</p>
      )}

      {evidence?.status === "rejected" && evidence.review_note && (
        <p className="mb-2 text-xs text-pastel-red-text">{evidence.review_note}</p>
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
        <p className="mt-1 text-xs text-pastel-red-text">
          Não foi possível enviar. Tente novamente.
        </p>
      )}
    </div>
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
