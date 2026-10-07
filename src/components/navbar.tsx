"use client";

import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import type { PartnerProfile } from "@/lib/types";
import { ProfileMenu } from "./profile-menu";

// La campana todavía no tiene funcionalidad: oculta hasta que existan las
// notificaciones dentro de la plataforma.
const SHOW_NOTIFICATIONS = false;

export function Navbar({
  profile,
  role,
}: {
  profile: PartnerProfile | null;
  // Para as telas de carregamento (loading.tsx), que ainda não têm o perfil
  // mas sabem a área: mostra os links certos e um avatar placeholder.
  role?: PartnerProfile["role"];
}) {
  const isAdmin = (profile?.role ?? role) === "admin";
  const pathname = usePathname();

  return (
    <>
      {/* Mobile (< md): sin card — barra a todo el ancho sobre el fondo gris
          (bg-canvas para tapar el contenido al hacer scroll). Desde md: card
          blanca flotante del diseño desktop. */}
      <header className="sticky top-0 z-40 mx-auto w-full bg-canvas md:top-[22px] md:mt-[22px] md:w-[calc(100%-96px)] md:max-w-[1800px] md:rounded-[17px] md:bg-surface md:shadow-[0px_3px_6px_rgba(0,0,0,0.16)]">
        <div className="flex w-full items-center justify-between gap-3 px-6 py-4 sm:px-12 md:px-8 md:py-5">
          <Link
            href={isAdmin ? "/admin/dashboard" : "/dashboard"}
            // min-w-0 + w-full: o logo encolhe antes de quebrar a linha.
            className="flex min-w-0 shrink items-center"
          >
            {/* Logo horizontal armado con los trazos de logo-partnert-quest.svg
              (tipografía Kaspersky Sans Display ya vectorizada) — no depende
              de cargar la fuente. */}
            <Image
              src="/logo-navbar.svg"
              alt="Kaspersky Partner Quest"
              width={319}
              height={25}
              priority
              className="h-auto w-full max-w-[255px] sm:max-w-[306px]"
            />
          </Link>

          {/* Links no header a partir de md (admin: lg, tem 4 links); abaixo
              disso vão para a BottomNav. */}
          <nav className={`hidden shrink-0 items-center gap-2 ${isAdmin ? "lg:flex" : "md:flex"}`}>
            <NavLinks isAdmin={isAdmin} pathname={pathname} />
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            {SHOW_NOTIFICATIONS && (
              <button
                type="button"
                title="Notificações"
                aria-label="Notificações"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-canvas hover:text-ink"
              >
                <BellIcon />
              </button>
            )}

            {profile || !role ? (
              <ProfileMenu profile={profile} isAdmin={isAdmin} />
            ) : (
              <span className="flex items-center gap-2.5 border-l border-border py-1 pl-3 pr-2" aria-hidden="true">
                <span className="h-8 w-8 animate-pulse rounded-full bg-canvas" />
                <span className="hidden h-3 w-20 animate-pulse rounded bg-canvas sm:block" />
              </span>
            )}
          </div>
        </div>
      </header>
      <BottomNav isAdmin={isAdmin} pathname={pathname} />
    </>
  );
}

function NavLinks({
  isAdmin,
  pathname,
  compact,
}: {
  isAdmin: boolean;
  pathname: string;
  compact?: boolean;
}) {
  return isAdmin ? (
    <>
      <NavLink
        compact={compact}
        href="/admin/dashboard"
        active={pathname === "/admin/dashboard"}
      >
        Dashboard
      </NavLink>
      <NavLink
        compact={compact}
        href="/admin/partners"
        active={pathname.startsWith("/admin/partners")}
      >
        Parceiros
      </NavLink>
      <NavLink
        compact={compact}
        href="/admin/evidence"
        active={pathname === "/admin/evidence"}
      >
        Evidências
      </NavLink>
      <NavLink
        compact={compact}
        href="/admin/rewards"
        active={pathname === "/admin/rewards"}
      >
        Recompensas
      </NavLink>
    </>
  ) : (
    <>
      <NavLink
        compact={compact}
        href="/dashboard"
        icon={(active) => <MapIcon active={active} />}
        active={pathname === "/dashboard"}
      >
        Jornada
      </NavLink>
      <NavLink
        compact={compact}
        href="/dashboard/rewards"
        icon={(active) => <GiftIcon active={active} />}
        active={pathname === "/dashboard/rewards"}
      >
        Recompensas
      </NavLink>
    </>
  );
}

// Diseño mobile: barra blanca fija abajo con los items repartidos a lo ancho.
// El id/data-until lo usa globals.css (body:has(#bottom-nav)) para reservar
// su alto mientras está visible.
function BottomNav({
  isAdmin,
  pathname,
}: {
  isAdmin: boolean;
  pathname: string;
}) {
  return (
    <nav
      id="bottom-nav"
      data-until={isAdmin ? "lg" : "md"}
      aria-label="Navegação principal"
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface px-6 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))] ${isAdmin ? "lg:hidden" : "md:hidden"}`}
    >
      <div className="mx-auto grid max-w-md auto-cols-fr grid-flow-col gap-2">
        <NavLinks isAdmin={isAdmin} pathname={pathname} compact />
      </div>
    </nav>
  );
}

function NavLink({
  href,
  children,
  icon,
  active,
  compact,
}: {
  href: string;
  children: React.ReactNode;
  icon?: (active: boolean) => React.ReactNode;
  active?: boolean;
  // Variante da BottomNav: mais baixa e centrada na célula.
  compact?: boolean;
}) {
  // Diseño XD: item activo con fondo #F1F5F8, radius 16px, 60px de alto.
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 font-display font-medium text-ink transition ${
        compact
          ? "h-[50px] justify-center rounded-[12px] px-3 text-[15px]"
          : "h-[60px] whitespace-nowrap rounded-[16px] px-4 text-base xl:px-6"
      } ${active ? "bg-nav-pill" : "hover:bg-nav-pill"}`}
    >
      {icon?.(!!active)}
      {children}
      <PendingIndicator />
    </Link>
  );
}

// Spinner no link clicado enquanto a navegação não termina — feedback de
// que a página está carregando (e evita cliques repetidos).
function PendingIndicator() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      role="status"
      aria-label="Carregando"
      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand border-t-transparent"
    />
  );
}

function MapIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={active ? "text-brand" : "text-ink"}
    >
      <path
        d="M3 8.5 9 6l6 2.5L21 6v15l-6 2.5L9 21l-6 2.5Z M9 6v15 M15 8.5v15"
        stroke="currentColor"
      />
      <path d="M12 11v9" stroke="currentColor" strokeDasharray="1.6 2.2" />
      {active && (
        <circle cx="21.5" cy="5" r="3.5" fill="currentColor" stroke="white" strokeWidth="1.5" />
      )}
    </svg>
  );
}

function GiftIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={active ? "text-brand" : "text-ink"}
    >
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7" />
      <path d="M12 8c-1.5 0-4-1-4-3.2A2.3 2.3 0 0 1 10.3 2c1.8 0 1.7 3 1.7 6ZM12 8c1.5 0 4-1 4-3.2A2.3 2.3 0 0 0 13.7 2c-1.8 0-1.7 3-1.7 6Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}
