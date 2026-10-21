"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProgramDeadline } from "@/lib/types";
import { formatDate } from "@/lib/deadline";

// Aviso de prorrogação aprovada: some depois de alguns dias.
const APPROVED_NOTICE_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Aviso do prazo no painel do parceiro. Quando o prazo vence sem concluir a
 * jornada, libera o botão de solicitar prorrogação; depois mostra o estado
 * da solicitação (em análise, recusada ou aprovada). As regras de quem pode
 * pedir ficam no backend (`can_request_extension`).
 */
export function ExtensionBanner({ deadline }: { deadline: ProgramDeadline }) {
  // Inicializador do useState: lê o relógio uma vez, não a cada render.
  const [now] = useState(() => Date.now());
  const latest = deadline.requests[0] ?? null;

  if (deadline.journey_completed) return null;

  if (!deadline.expired) {
    const recentlyApproved =
      latest?.status === "approved" &&
      latest.reviewed_at !== null &&
      now - Date.parse(latest.reviewed_at) < APPROVED_NOTICE_MS;
    if (!recentlyApproved) return null;

    return (
      <Banner tone="success" title="Prorrogação aprovada">
        Seu novo prazo para concluir a jornada é{" "}
        <strong className="font-semibold">{formatDate(deadline.deadline_at)}</strong>.
        {latest.admin_note && <Note text={latest.admin_note} />}
      </Banner>
    );
  }

  const title = `Seu prazo terminou em ${formatDate(deadline.deadline_at)}`;

  if (latest?.status === "pending") {
    return (
      <Banner tone="info" title="Solicitação de prorrogação em análise">
        Você solicitou a prorrogação em {formatDate(latest.requested_at)}. A equipe
        Kaspersky vai analisar e você verá a resposta aqui.
      </Banner>
    );
  }

  if (deadline.can_request_extension) {
    return <RequestForm deadline={deadline} title={title} />;
  }

  if (
    latest?.status === "rejected" &&
    Date.parse(latest.previous_deadline_at) === Date.parse(deadline.deadline_at)
  ) {
    return (
      <Banner tone="warning" title={title}>
        Sua solicitação de prorrogação foi recusada.
        {latest.admin_note && <Note text={latest.admin_note} />}
      </Banner>
    );
  }

  return (
    <Banner tone="warning" title={title}>
      Para continuar a jornada, fale com a equipe Kaspersky.
    </Banner>
  );
}

function RequestForm({ deadline, title }: { deadline: ProgramDeadline; title: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const res = await fetch("/api/deadline/extension-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason.trim() || undefined }),
    });

    if (res.ok) {
      router.refresh();
      return;
    }
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    setError(
      res.status === 400 || res.status === 409
        ? (data?.message ?? "Não foi possível enviar a solicitação.")
        : "Não foi possível enviar a solicitação. Tente novamente.",
    );
    setStatus("error");
  }

  return (
    <Banner tone="warning" title={title}>
      <p>
        Você pode solicitar uma prorrogação de {deadline.extension_months} meses para
        concluir a jornada. A solicitação será analisada pela equipe Kaspersky.
      </p>
      <form onSubmit={submit} className="mt-3">
        <label htmlFor="extension-reason" className="mb-1 block text-xs font-medium text-ink">
          Por que você precisa de mais tempo? <span className="text-ink-muted">(opcional)</span>
        </label>
        <textarea
          id="extension-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          maxLength={1000}
          className="mb-3 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
        {error && <p className="mb-3 text-sm text-pastel-red-text">{error}</p>}
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
        >
          {status === "sending" ? "Enviando..." : "Solicitar prorrogação"}
        </button>
      </form>
    </Banner>
  );
}

const TONE_CLASS = {
  info: "border-border bg-surface",
  success: "border-pastel-green-text/30 bg-pastel-green-bg",
  warning: "border-pastel-yellow-text/30 bg-pastel-yellow-bg",
} as const;

function Banner({
  tone,
  title,
  children,
}: {
  tone: keyof typeof TONE_CLASS;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      role="status"
      className={`mb-6 rounded-[10px] border p-5 shadow-[0px_3px_6px_rgba(0,0,0,0.08)] ${TONE_CLASS[tone]}`}
    >
      <h2 className="mb-1 text-base font-semibold text-ink">{title}</h2>
      <div className="text-sm text-ink">{children}</div>
    </section>
  );
}

function Note({ text }: { text: string }) {
  return <p className="mt-2 text-sm text-ink-muted">“{text}”</p>;
}
