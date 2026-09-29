import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PartnerProfile } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { ProfileForm } from "./profile-form";

async function getProfile(accessToken: string): Promise<PartnerProfile | null> {
  const res = await fetch(`${process.env.BACKEND_URL}/partners/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const profile = await getProfile(session.access_token);
  if (profile?.role === "admin") {
    redirect("/admin/dashboard");
  }

  // Só aceita destinos internos do painel do parceiro (evita open redirect).
  const { next } = await searchParams;
  const returnTo = next?.startsWith("/dashboard") ? next : undefined;

  return (
    <>
      <Navbar profile={profile} />
      <main className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">
          Meu perfil
        </h1>
        <p className="mb-8 text-sm text-ink-muted">
          Mantenha seus dados atualizados para receber suas recompensas.
        </p>

        {profile ? (
          <ProfileForm profile={profile} returnTo={returnTo} />
        ) : (
          <div className="rounded-lg border border-border bg-surface p-6">
            <p className="text-sm text-pastel-red-text">
              Não foi possível carregar seu perfil no backend. Verifique se a
              API está rodando e o `.env` está configurado.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
