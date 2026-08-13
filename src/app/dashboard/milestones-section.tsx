"use client";

import { useState, type FormEvent } from "react";
import type { MilestoneView, TaskWithEvidence } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "Em análise",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-pastel-yellow-bg text-pastel-yellow-text",
  approved: "bg-pastel-green-bg text-pastel-green-text",
  rejected: "bg-pastel-red-bg text-pastel-red-text",
};

export function MilestonesSection({ milestones }: { milestones: MilestoneView[] }) {
  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Missões</h2>

      {milestones.map((milestone) =>
        milestone.locked ? (
          <div
            key={milestone.id}
            className="rounded-lg border border-border bg-surface p-6 text-sm text-ink-muted"
          >
            Milestone {milestone.order_index} — bloqueado
          </div>
        ) : (
          <div key={milestone.id} className="rounded-lg border border-border bg-surface p-6">
            <h3 className="mb-1 text-base font-semibold text-ink">
              {milestone.order_index}. {milestone.title}
            </h3>
            {milestone.description && (
              <p className="mb-4 text-sm text-ink-muted">{milestone.description}</p>
            )}

            <div className="space-y-3">
              {milestone.tasks?.map((task) => <TaskRow key={task.id} task={task} />)}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

function TaskRow({ task }: { task: TaskWithEvidence }) {
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

    let res: Response;
    if (task.evidence_type === "file") {
      if (!file) {
        setStatus("error");
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      res = await fetch(`/api/milestones/tasks/${task.id}/evidence`, {
        method: "POST",
        body: formData,
      });
    } else {
      res = await fetch(`/api/milestones/tasks/${task.id}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textValue }),
      });
    }

    if (!res.ok) {
      setStatus("error");
      return;
    }

    setEvidence(await res.json());
    setStatus("idle");
    setTextValue("");
    setFile(null);
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
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="flex-1 text-sm text-ink-muted"
            />
          )}
          <button
            type="submit"
            disabled={status === "sending"}
            className="shrink-0 rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
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
