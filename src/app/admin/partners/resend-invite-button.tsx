"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export function ResendInviteButton({ partnerId }: { partnerId: string }) {
  const [status, setStatus] = useState<Status>("idle");

  async function resend() {
    setStatus("sending");
    const res = await fetch(`/api/admin/partners/${partnerId}/resend-invite`, {
      method: "POST",
    });
    setStatus(res.ok ? "sent" : "error");
  }

  if (status === "sent") {
    return <span className="text-sm text-pastel-green-text">Enviado</span>;
  }

  return (
    <button
      type="button"
      onClick={resend}
      disabled={status === "sending"}
      className="whitespace-nowrap text-sm font-medium text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-60"
    >
      {status === "sending"
        ? "Enviando..."
        : status === "error"
          ? "Falhou — tentar de novo"
          : "Reenviar convite"}
    </button>
  );
}
