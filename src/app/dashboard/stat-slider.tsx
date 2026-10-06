"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Versión mobile del ProgressFooter: muestra un stat a la vez, con flechas a
// los lados (pegadas al borde de la pantalla), dots y swipe. Los slides llegan
// ya renderizados desde el server component.
export function StatSlider({ slides }: { slides: ReactNode[] }) {
  const [[index, direction], setState] = useState<[number, number]>([0, 0]);
  const count = slides.length;

  function go(delta: number) {
    setState(([i]) => [(i + delta + count) % count, delta]);
  }

  return (
    <div>
      <div className="-mx-6 flex items-center gap-4" aria-roledescription="carrossel">
        <ArrowButton side="left" onClick={() => go(-1)} />

        <div className="relative min-w-0 flex-1 overflow-hidden rounded-[10px] bg-surface shadow-[0px_3px_6px_rgba(0,0,0,0.16)]">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={index}
              custom={direction}
              variants={{
                enter: (d: number) => ({ x: d >= 0 ? "100%" : "-100%", opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: d >= 0 ? "-100%" : "100%", opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeOut" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              onDragEnd={(_, info) => {
                if (info.offset.x < -40) go(1);
                else if (info.offset.x > 40) go(-1);
              }}
              className="p-4"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${count}`}
            >
              {slides[index]}
            </motion.div>
          </AnimatePresence>
        </div>

        <ArrowButton side="right" onClick={() => go(1)} />
      </div>

      <div className="mt-4 flex justify-center gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setState(([cur]) => [i, i >= cur ? 1 : -1])}
            aria-label={`Ir para o item ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
            className={`h-2.5 w-2.5 rounded-full transition ${i === index ? "bg-brand" : "bg-ink-muted/35"}`}
          />
        ))}
      </div>
    </div>
  );
}

function ArrowButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Anterior" : "Próximo"}
      className={`flex h-16 w-11 shrink-0 items-center justify-center bg-surface text-ink shadow-[0px_3px_6px_rgba(0,0,0,0.16)] transition active:bg-nav-pill ${
        side === "left" ? "rounded-r-[10px]" : "rounded-l-[10px]"
      }`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={side === "left" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />
      </svg>
    </button>
  );
}
