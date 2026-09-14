import type { ReactNode } from "react";

/**
 * Layout de dos columnas para pantallas de auth: card blanca centrada a la
 * izquierda + panel de marca a la derecha. Estructura inspirada en
 * my.kaspersky.com (card + panel lateral), ilustración propia (no se
 * reproduce el arte de Kaspersky).
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex w-full flex-col justify-center px-6 py-16 sm:px-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 text-sm font-semibold tracking-tight text-ink">
            KASPERSKY
            <span className="ml-1 font-normal text-ink-muted">| PARTNER QUEST</span>
          </div>
          {children}
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-brand-soft lg:flex lg:w-1/2 lg:items-center lg:justify-center">
        <BrandIllustration />
      </div>
    </div>
  );
}

function BrandIllustration() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="w-2/3 max-w-md text-brand"
      fill="none"
      aria-hidden="true"
    >
      <rect x="40" y="220" width="120" height="120" rx="12" fill="currentColor" opacity="0.12" />
      <rect x="180" y="160" width="140" height="180" rx="12" fill="currentColor" opacity="0.2" />
      <rect x="90" y="60" width="160" height="120" rx="12" fill="currentColor" opacity="0.3" />
      <circle cx="330" cy="90" r="26" fill="currentColor" opacity="0.4" />
      <path
        d="M60 340 L340 340"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="6 8"
        opacity="0.4"
      />
    </svg>
  );
}
