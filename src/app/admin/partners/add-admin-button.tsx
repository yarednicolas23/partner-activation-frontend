"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PartnerProfile } from "@/lib/types";

/**
 * "Adicionar administrador": escolhe um parceiro existente e o promove a
 * admin (mesmo PATCH /partners/:id/role do botão no perfil).
 */
export function AddAdminButton({
  partners,
}: {
  partners: Pick<PartnerProfile, "id" | "full_name" | "email">[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  const sorted = [...partners].sort((a, b) =>
    (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email, "pt-BR"),
  );

  function close() {
    setOpen(false);
    setSelectedId("");
    setError(null);
  }

  async function promote() {
    if (!selectedId) return;
    setStatus("saving");
    setError(null);
    const res = await fetch(`/api/admin/partners/${selectedId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "admin" }),
    });
    setStatus("idle");

    if (res.ok) {
      close();
      router.refresh();
      return;
    }
    setError("Não foi possível adicionar o administrador. Tente novamente.");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
      >
        Adicionar administrador
      </button>
    );
  }

  return (
    <div className="mb-4 w-full rounded-lg border border-border bg-surface p-4">
      <label htmlFor="new-admin" className="mb-1.5 block text-sm font-medium text-ink">
        Parceiro que receberá acesso de administrador
      </label>
      {sorted.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Nenhum parceiro disponível. Convide a pessoa como parceiro primeiro.
        </p>
      ) : (
        <select
          id="new-admin"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={status === "saving"}
          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:opacity-60"
        >
          <option value="">Selecione um parceiro...</option>
          {sorted.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name ? `${p.full_name} — ${p.email}` : p.email}
            </option>
          ))}
        </select>
      )}
      <p className="mt-2 text-xs text-ink-muted">
        A pessoa passa a entrar no painel admin e deixa de ver a jornada do parceiro.
      </p>

      {error && <p className="mt-2 text-sm text-pastel-red-text">{error}</p>}

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={close}
          disabled={status === "saving"}
          className="rounded-md px-3 py-2 text-sm font-medium text-ink transition hover:bg-canvas disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={promote}
          disabled={!selectedId || status === "saving"}
          className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saving" ? "Salvando..." : "Tornar administrador"}
        </button>
      </div>
    </div>
  );
}
