"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PartnerProfile } from "@/lib/types";
import { LogoutButton } from "./logout-button";

export function Navbar({ profile }: { profile: PartnerProfile | null }) {
  const isAdmin = profile?.role === "admin";
  const pathname = usePathname();

  return (
    <header className="sticky top-[22px] z-40 mx-6 mt-[22px] rounded-[17px] bg-surface shadow-[0px_3px_6px_rgba(0,0,0,0.16)] sm:mx-12">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4 sm:py-5">
        <Link
          href={isAdmin ? "/admin/dashboard" : "/dashboard"}
          className="flex items-center gap-2.5"
        >
          <Image
            src="/Kaspersky_logo.svg.webp"
            alt="Kaspersky"
            width={110}
            height={23}
            priority
          />
          <span className="h-4 w-px bg-border" aria-hidden="true" />
          <span className="text-sm font-medium text-ink-muted">Partner Quest</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {isAdmin ? (
            <>
              <NavLink href="/admin/dashboard" active={pathname === "/admin/dashboard"}>Dashboard</NavLink>
              <NavLink href="/admin/partners" active={pathname.startsWith("/admin/partners")}>Parceiros</NavLink>
              <NavLink href="/admin/evidence" active={pathname === "/admin/evidence"}>Evidências</NavLink>
              <NavLink href="/admin/rewards" active={pathname === "/admin/rewards"}>Recompensas</NavLink>
            </>
          ) : (
            <>
              <NavLink href="/dashboard" icon={<MapIcon />} active={pathname === "/dashboard"}>
                Jornada
              </NavLink>
              <NavLink href="/dashboard/rewards" icon={<GiftIcon />} active={pathname === "/dashboard/rewards"}>
                Recompensas
              </NavLink>
              <NavLink href="/dashboard/historico" active={pathname === "/dashboard/historico"}>
                Histórico
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            title="Notificações"
            aria-label="Notificações"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-canvas hover:text-ink"
          >
            <BellIcon />
          </button>

          <div className="flex items-center gap-2.5 border-l border-border pl-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
              {initials(profile)}
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-medium text-ink">{profile?.full_name ?? "—"}</p>
              <p className="text-xs text-ink-muted">{isAdmin ? "Administrador" : "Parceiro"}</p>
            </div>
          </div>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

function initials(profile: PartnerProfile | null): string {
  const source = profile?.full_name?.trim() || profile?.email;
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function NavLink({
  href,
  children,
  icon,
  active,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition ${
        active ? "bg-brand-soft text-brand" : "text-ink-muted hover:bg-brand-soft hover:text-ink"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

function MapIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
      <path d="M9 3v15M15 6v15" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
