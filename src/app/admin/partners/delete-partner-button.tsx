"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PartnerProfile } from "@/lib/types";

/**
 * Exclui um parceiro de vez (perfil, evidências e resgates), com confirmação
 * inline. Admins não aparecem aqui: o backend exige remover o acesso de
 * admin antes e recusa excluir a própria conta.
 */
export function DeletePartnerButton({
  partner,
}: {
  partner: Pick<PartnerProfile, "id" | "full_name" | "email">;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<"idle" | "deleting">("idle");
  const [error, setError] = useState<string | null>(null);

  const name = partner.full_name ?? partner.email;

  async function deletePartner() {
    setStatus("deleting");
    setError(null);
    const res = await fetch(`/api/admin/partners/${partner.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.refresh();
      return;
    }

    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    setError(
      res.status === 400 && data?.message
        ? data.message
        : "Não foi possível excluir. Tente novamente.",
    );
    setStatus("idle");
    setConfirming(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {confirming ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-xs text-ink-muted">
            Excluir {name}? O progresso e as evidências serão apagados.
          </span>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={status === "deleting"}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-canvas disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={deletePartner}
            disabled={status === "deleting"}
            className="rounded-md bg-pastel-red-text px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {status === "deleting" ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setConfirming(true);
          }}
          className="whitespace-nowrap text-sm font-medium text-pastel-red-text hover:underline"
        >
          Excluir
        </button>
      )}
      {error && <p className="text-xs text-pastel-red-text">{error}</p>}
    </div>
  );
}
