import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Card branco centralizado sobre a cidade isométrica de fundo (mesmo motivo
 * visual da Journey/stage modal). Layout único para todas as telas de auth.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-canvas px-4 py-12 sm:px-6">
      <Image
        src="/background/background.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      <div className="relative w-full max-w-lg rounded-3xl bg-surface p-8 shadow-xl shadow-ink/5 sm:p-10">
        <Image
          src="/logo-partnert-quest.svg"
          alt="Kaspersky Partner Quest"
          width={205}
          height={139}
          priority
          className="mb-8 h-auto w-36"
        />

        {children}

        <div className="mt-8 flex items-start gap-3 border-t border-border pt-6 text-sm text-ink-muted">
          <HeadsetIcon />
          <p>
            Precisa de ajuda? Entre em contato pelo e-mail{" "}
            <a
              href="mailto:canais.brasil@kaspersky.com"
              className="font-semibold text-brand"
            >
              canais.brasil@kaspersky.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function HeadsetIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-0.5 shrink-0"
    >
      <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
      <path d="M21 14v3a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3ZM3 14v3a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z" />
    </svg>
  );
}
