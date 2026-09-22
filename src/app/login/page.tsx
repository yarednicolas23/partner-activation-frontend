import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth-layout";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar | Kaspersky Partner Quest",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-ink">
        Acesse sua jornada,
        <br />
        <span className="text-brand">parceiro</span>
      </h1>
      <p className="mb-8 text-sm text-ink-muted">
        Acesso exclusivo para parceiros pré-cadastrados pela Kaspersky. Insira
        o e-mail informado no convite para continuar.
      </p>
      <LoginForm />
    </AuthLayout>
  );
}
