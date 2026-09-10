"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth-layout";

/**
 * Completa o login para links gerados pela Admin API (convite, magic link
 * via inviteUserByEmail/generateLink) — esses usam o fluxo implícito
 * (#access_token=... no fragmento da URL), que só o navegador consegue ler.
 * `/auth/callback` (route.ts) redireciona pra cá quando não recebe `code`.
 */
export default function AuthCallbackFinishPage() {
  return (
    <Suspense fallback={null}>
      <FinishLogin />
    </Suspense>
  );
}

function FinishLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    const next = searchParams.get("next") ?? "/dashboard";
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      router.replace("/login?error=auth");
      return;
    }

    const supabase = createClient();
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setStatus("error");
          router.replace("/login?error=auth");
          return;
        }
        router.replace(next);
      });
  }, [router, searchParams]);

  return (
    <AuthLayout>
      <p className="text-sm text-ink-muted">
        {status === "loading" ? "Entrando..." : "Não foi possível entrar."}
      </p>
    </AuthLayout>
  );
}
