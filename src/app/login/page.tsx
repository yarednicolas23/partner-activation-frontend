import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth-layout";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar | Partner Activation Program",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">
        Entrar
      </h1>
      <p className="mb-8 text-sm text-ink-muted">
        Acesse com o e-mail cadastrado pela Kaspersky. Sem senha — você vai
        receber um link de acesso.
      </p>
      <LoginForm />
    </AuthLayout>
  );
}
