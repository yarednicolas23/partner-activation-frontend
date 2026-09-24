"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

// El login ADM (/admin/login) reusa este mismo form: solo cambian los
// textos y a dónde vuelve el usuario después del link.
const COPY = {
  partner: {
    label: "E-mail corporativo",
    placeholder: "voce@suaempresa.com",
    submit: "Enviar link de acesso",
    next: "/dashboard",
  },
  admin: {
    label: "E-mail Kaspersky",
    placeholder: "nome.sobrenome@kaspersky.com",
    submit: "Acessar painel",
    next: "/admin/dashboard",
  },
} as const;

export function LoginForm({
  variant = "partner",
}: {
  variant?: keyof typeof COPY;
}) {
  const copy = COPY[variant];
  const redirectTo = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(copy.next)}`;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  // Temporal: vuelve el login con Google mientras el envío de magic links
  // queda bloqueado (Resend en modo pruebas solo entrega al dueño de la
  // cuenta). Quitar cuando el SMTP de Supabase tenga un dominio verificado.
  const [googleStatus, setGoogleStatus] = useState<
    "idle" | "redirecting" | "error"
  >("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo(),
        // Solo usuarios pre-registrados (invitados por Kaspersky) pueden
        // entrar — sin esto, cualquier email crearía una cuenta nueva.
        shouldCreateUser: false,
      },
    });

    setStatus(error ? "error" : "sent");
  }

  async function handleGoogleSignIn() {
    setGoogleStatus("redirecting");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo(),
      },
    });

    if (error) setGoogleStatus("error");
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-border bg-pastel-green-bg px-4 py-3 text-sm text-pastel-green-text">
        Enviamos um link de acesso para <strong>{email}</strong>. Abra seu
        e-mail para continuar.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
          {copy.label}
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted">
            <MailIcon />
          </span>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={copy.placeholder}
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      {status === "error" && (
        <p className="text-sm text-pastel-red-text">
          Não foi possível enviar o link. Verifique o e-mail e tente novamente.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Enviando..." : copy.submit}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-ink-muted">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleStatus === "redirecting"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 py-3 text-sm font-semibold text-ink transition hover:bg-brand-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon />
        {googleStatus === "redirecting"
          ? "Redirecionando..."
          : "Continuar com Google"}
      </button>

      {googleStatus === "error" && (
        <p className="text-sm text-pastel-red-text">
          Não foi possível iniciar o login com Google. Tente novamente.
        </p>
      )}

      <p className="flex items-start gap-2.5 text-xs text-ink-muted">
        <LockIcon />
        Não é necessário usar senha. O link enviado por e-mail é válido por 15
        minutos.
      </p>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
