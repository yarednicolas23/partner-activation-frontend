"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PartnerProfile } from "@/lib/types";

/**
 * Promove um usuário a admin ou remove o acesso de admin, com confirmação
 * inline. As regras (não remover o próprio acesso, manter ao menos um
 * admin) são garantidas pelo backend; aqui só se evita o caso óbvio.
 */
export function RoleButton({
  user,
  isSelf,
}: {
  user: Pick<PartnerProfile, "id" | "role" | "full_name" | "email">;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  const promote = user.role !== "admin";
  const name = user.full_name ?? user.email;

  if (!promote && isSelf) {
    return <span className="text-xs text-ink-muted">Você</span>;
  }

  async function changeRole() {
    setStatus("saving");
    setError(null);
    const res = await fetch(`/api/admin/partners/${user.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: promote ? "admin" : "partner" }),
    });

    if (res.ok) {
      setConfirming(false);
      setStatus("idle");
      router.refresh();
      return;
    }

    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    setError(
      res.status === 400 && data?.message
        ? data.message
        : "Não foi possível alterar o acesso. Tente novamente.",
    );
    setStatus("idle");
    setConfirming(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {confirming ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-xs text-ink-muted">
            {promote
              ? `Dar acesso de administrador a ${name}?`
              : `Remover o acesso de administrador de ${name}?`}
          </span>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={status === "saving"}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-canvas disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={changeRole}
            disabled={status === "saving"}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-60 ${
              promote ? "bg-brand hover:bg-brand-hover" : "bg-pastel-red-text hover:opacity-90"
            }`}
          >
            {status === "saving" ? "Salvando..." : "Confirmar"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setConfirming(true);
          }}
          className={`whitespace-nowrap text-sm font-medium hover:underline ${
            promote ? "text-brand" : "text-pastel-red-text"
          }`}
        >
          {promote ? "Tornar administrador" : "Remover acesso de admin"}
        </button>
      )}
      {error && <p className="text-xs text-pastel-red-text">{error}</p>}
    </div>
  );
}
