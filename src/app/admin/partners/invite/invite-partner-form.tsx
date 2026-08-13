"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "sending" | "success" | "error" | "conflict";

export function InvitePartnerForm() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const res = await fetch("/api/admin/invite-partner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, fullName, companyName: companyName || undefined }),
    });

    if (res.ok) {
      setStatus("success");
      setEmail("");
      setFullName("");
      setCompanyName("");
      return;
    }

    setStatus(res.status === 409 ? "conflict" : "error");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-ink"
        >
          E-mail
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="parceiro@empresa.com.br"
          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>

      <div>
        <label
          htmlFor="fullName"
          className="mb-1.5 block text-sm font-medium text-ink"
        >
          Nome completo
        </label>
        <input
          id="fullName"
          type="text"
          required
          minLength={2}
          autoComplete="off"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nome do parceiro"
          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>

      <div>
        <label
          htmlFor="companyName"
          className="mb-1.5 block text-sm font-medium text-ink"
        >
          Empresa <span className="text-ink-muted">(opcional)</span>
        </label>
        <input
          id="companyName"
          type="text"
          autoComplete="off"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Nome da empresa"
          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>

      {status === "success" && (
        <div className="rounded-lg border border-border bg-pastel-green-bg px-4 py-3 text-sm text-pastel-green-text">
          Convite enviado com sucesso.
        </div>
      )}

      {status === "conflict" && (
        <p className="text-sm text-pastel-red-text">
          Já existe um usuário com esse e-mail.
        </p>
      )}

      {status === "error" && (
        <p className="text-sm text-pastel-red-text">
          Não foi possível enviar o convite. Tente novamente.
        </p>
      )}

      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Enviando..." : "Enviar convite"}
      </Button>
    </form>
  );
}
