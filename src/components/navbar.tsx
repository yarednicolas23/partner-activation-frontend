import Link from "next/link";
import type { PartnerProfile } from "@/lib/types";
import { LogoutButton } from "./logout-button";

export function Navbar({ profile }: { profile: PartnerProfile | null }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 px-6 py-4">
        <Link
          href="/dashboard"
          className="text-sm font-semibold tracking-tight text-ink"
        >
          kaspersky
          <span className="ml-1 font-normal text-ink-muted">| partners</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <NavLink href="/dashboard">Dashboard</NavLink>
          {profile?.role === "admin" && (
            <>
              <NavLink href="/admin/partners">Parceiros</NavLink>
              <NavLink href="/admin/evidence">Evidências</NavLink>
              <NavLink href="/admin/rewards">Recompensas</NavLink>
            </>
          )}
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 font-medium text-ink-muted transition hover:bg-brand-soft hover:text-ink"
    >
      {children}
    </Link>
  );
}
