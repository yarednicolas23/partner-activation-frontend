import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth-layout";
import { LoginForm } from "@/app/login/login-form";

export const metadata: Metadata = {
  title: "Painel de gestão | Kaspersky Partner Quest",
};

export default function AdminLoginPage() {
  return (
    <AuthLayout>
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-ink">
        Painel de gestão,
        <br />
        <span className="text-brand">administrador</span>
      </h1>
      <p className="mb-8 text-sm text-ink-muted">
        Área exclusiva para administradores do Partner Quest. Use seu e-mail
        @kaspersky.com para continuar.
      </p>
      <LoginForm variant="admin" />
    </AuthLayout>
  );
}
