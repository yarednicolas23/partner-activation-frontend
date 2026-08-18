"use client";

import { useState } from "react";
import type { EvidenceQueueItem } from "@/lib/types";

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

export function EvidenceHistory({ items }: { items: EvidenceQueueItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-ink-muted">
        Nenhuma evidência enviada ainda.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <EvidenceRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function EvidenceRow({ item }: { item: EvidenceQueueItem }) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  async function openFile() {
    if (fileUrl) {
      window.open(fileUrl, "_blank");
      return;
    }
    const res = await fetch(`/api/admin/evidence/${item.id}/file-url`);
    if (!res.ok) return;
    const { url } = (await res.json()) as { url: string };
    setFileUrl(url);
    window.open(url, "_blank");
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="mb-3 flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-ink">
          {item.milestone.title} — {item.task.title}
        </p>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[item.status]}`}
        >
          {STATUS_LABEL[item.status]}
        </span>
      </div>

      {item.text_value && (
        <p className="mb-3 rounded-md bg-brand-soft px-3 py-2 text-sm text-ink">
          {item.text_value}
        </p>
      )}

      {item.file_path && (
        <button
          type="button"
          onClick={openFile}
          className="mb-3 block text-sm font-medium text-brand hover:underline"
        >
          Ver arquivo enviado
        </button>
      )}

      {item.status === "rejected" && item.review_note && (
        <p className="mb-1 text-sm text-pastel-red-text">{item.review_note}</p>
      )}

      <p className="text-xs text-ink-muted">
        Enviado em {new Date(item.submitted_at).toLocaleString("pt-BR")}
        {item.reviewed_at &&
          ` · Revisado em ${new Date(item.reviewed_at).toLocaleString("pt-BR")}`}
      </p>
    </div>
  );
}
