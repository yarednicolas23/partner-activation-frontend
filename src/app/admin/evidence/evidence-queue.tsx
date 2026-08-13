"use client";

import { useState } from "react";
import type { EvidenceQueueItem } from "@/lib/types";

export function EvidenceQueue({ initialItems }: { initialItems: EvidenceQueueItem[] }) {
  const [items, setItems] = useState(initialItems);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-ink-muted">
        Nenhuma evidência pendente.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <EvidenceCard
          key={item.id}
          item={item}
          onReviewed={() =>
            setItems((current) => current.filter((i) => i.id !== item.id))
          }
        />
      ))}
    </div>
  );
}

function EvidenceCard({
  item,
  onReviewed,
}: {
  item: EvidenceQueueItem;
  onReviewed: () => void;
}) {
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  async function review(decision: "approved" | "rejected") {
    setStatus("loading");
    const res = await fetch(`/api/admin/evidence/${item.id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: decision, note: note || undefined }),
    });

    if (res.ok) {
      onReviewed();
      return;
    }
    setStatus("error");
  }

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
        <div>
          <p className="text-sm font-medium text-ink">
            {item.milestone.title} — {item.task.title}
          </p>
          <p className="text-sm text-ink-muted">
            {item.partner.full_name ?? item.partner.email} · {item.partner.email}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-pastel-yellow-bg px-2.5 py-0.5 text-xs font-medium text-pastel-yellow-text">
          Pendente
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
          className="mb-3 text-sm font-medium text-brand hover:underline"
        >
          Ver arquivo enviado
        </button>
      )}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Nota (opcional)"
        rows={2}
        className="mb-3 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand focus:ring-1 focus:ring-brand"
      />

      {status === "error" && (
        <p className="mb-3 text-sm text-pastel-red-text">
          Não foi possível salvar a revisão. Tente novamente.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => review("approved")}
          disabled={status === "loading"}
          className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Aprovar
        </button>
        <button
          type="button"
          onClick={() => review("rejected")}
          disabled={status === "loading"}
          className="rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-pastel-red-bg disabled:cursor-not-allowed disabled:opacity-60"
        >
          Rejeitar
        </button>
      </div>
    </div>
  );
}
