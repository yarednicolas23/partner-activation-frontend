"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProgramSettings } from "@/lib/types";
import { formatDate } from "@/lib/deadline";

/**
 * Prazo geral do programa. A regra (backend + trigger do pré-cadastro): vale
 * só para parceiros convidados depois da alteração; quem já está no programa
 * mantém o prazo que tinha.
 */
export function ProgramSettingsForm({ settings }: { settings: ProgramSettings }) {
  const router = useRouter();
  const [duration, setDuration] = useState(String(settings.duration_months));
  const [extension, setExtension] = useState(String(settings.extension_months));
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const changed =
    Number(duration) !== settings.duration_months ||
    Number(extension) !== settings.extension_months;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    const res = await fetch("/api/admin/program-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        durationMonths: Number(duration),
        extensionMonths: Number(extension),
      }),
    });

    if (res.ok) {
      setStatus("saved");
      router.refresh();
      return;
    }
    const data = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
    setError(res.status === 400 && message ? message : "Não foi possível salvar. Tente novamente.");
    setStatus("idle");
  }

  return (
    <section className="mb-10 rounded-lg border border-border bg-surface p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Prazo geral do programa</h2>
        <span className="rounded-full bg-pastel-yellow-bg px-2.5 py-0.5 text-xs font-medium text-pastel-yellow-text">
          Aplica-se a parceiros novos
        </span>
      </div>

      <form onSubmit={save}>
        <div className="grid gap-4 sm:grid-cols-2">
          <MonthsField
            id="duration-months"
            label="Duração do programa"
            help="Contada a partir do convite do parceiro."
            value={duration}
            max={60}
            onChange={(v) => {
              setDuration(v);
              setStatus("idle");
            }}
          />
          <MonthsField
            id="extension-months"
            label="Prorrogação"
            help="Sugerida ao aprovar uma solicitação (o admin pode ajustar a data)."
            value={extension}
            max={24}
            onChange={(v) => {
              setExtension(v);
              setStatus("idle");
            }}
          />
        </div>

        <p className="mt-4 rounded-md bg-canvas px-3 py-2 text-xs text-ink-muted">
          A alteração vale apenas para parceiros convidados a partir de agora. Parceiros
          já ativos mantêm o prazo atual — para ampliá-lo, ajuste o prazo de cada um na
          tabela abaixo.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink-muted">
            {/* updated_by só existe depois de uma alteração pelo admin; a linha
                inicial da migração também tem updated_at. */}
            {settings.updated_by && settings.updated_at
              ? `Última alteração em ${formatDate(settings.updated_at)}.`
              : "Valor inicial do programa."}
          </p>
          <div className="flex items-center gap-3">
            {status === "saved" && !changed && (
              <span className="text-sm text-pastel-green-text">Salvo</span>
            )}
            {error && <span className="text-sm text-pastel-red-text">{error}</span>}
            <button
              type="submit"
              disabled={!changed || status === "saving"}
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
            >
              {status === "saving" ? "Salvando..." : "Salvar prazo geral"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function MonthsField({
  id,
  label,
  help,
  value,
  max,
  onChange,
}: {
  id: string;
  label: string;
  help: string;
  value: string;
  max: number;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          required
          min={1}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
        <span className="text-sm text-ink-muted">meses</span>
      </div>
      <p className="mt-1 text-xs text-ink-muted">{help}</p>
    </div>
  );
}
