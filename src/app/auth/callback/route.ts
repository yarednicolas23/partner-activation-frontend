import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Atrás del proxy de Railway/App Runner, `request.url` puede reflejar la
// dirección interna del contenedor en vez de la URL pública HTTPS —
// x-forwarded-host es el valor confiable en producción. Patrón documentado
// por Supabase para este mismo caso.
function resolveOrigin(request: NextRequest, fallbackOrigin: string): string {
  if (process.env.NODE_ENV === "development") {
    return fallbackOrigin;
  }
  const forwardedHost = request.headers.get("x-forwarded-host");
  return forwardedHost ? `https://${forwardedHost}` : fallbackOrigin;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin: rawOrigin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const origin = resolveOrigin(request, rawOrigin);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  // Sem "code": pode ser um link de magic link/convite gerado pela Admin
  // API (inviteUserByEmail, generateLink) — esses usam o fluxo implícito
  // (#access_token=... no fragmento da URL), que nunca chega ao servidor
  // (os navegadores não enviam o fragmento na request). Redireciona para
  // uma página client-side que lê o fragmento e completa o login ali.
  return NextResponse.redirect(
    `${origin}/auth/callback/finish?next=${encodeURIComponent(next)}`,
  );
}
