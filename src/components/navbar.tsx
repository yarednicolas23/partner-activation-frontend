"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PartnerProfile } from "@/lib/types";
import { ProfileMenu } from "./profile-menu";

export function Navbar({ profile }: { profile: PartnerProfile | null }) {
  const isAdmin = profile?.role === "admin";
  const pathname = usePathname();

  return (
    <header className="sticky top-[22px] z-40 mx-auto mt-[22px] w-[calc(100%-48px)] max-w-[1800px] rounded-[17px] bg-surface shadow-[0px_3px_6px_rgba(0,0,0,0.16)] sm:w-[calc(100%-96px)]">
      <div className="flex w-full flex-wrap items-center justify-between gap-3 px-6 py-4 sm:px-8 sm:py-5">
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

          <ProfileMenu profile={profile} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
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
