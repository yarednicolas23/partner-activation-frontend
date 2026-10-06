"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { MilestoneView } from "@/lib/types";
import { StageModal } from "./stage-modal";
import {
  findCurrentMilestone,
  stageImageSrc,
  stageTaskProgress,
  stageVisualStatus,
} from "./stage-art";

// Versión mobile del mapa de la jornada: un card por etapa en un carrusel
// horizontal con scroll-snap nativo (swipe sin librerías) y paginación por
// dots. Comparte datos, reglas (stage-art) y el StageModal con JourneyMap
// (desktop), que no se toca.
export function JourneyCarousel({ milestones }: { milestones: MilestoneView[] }) {
  const initialIndex = useMemo(() => {
    const current = findCurrentMilestone(milestones);
    const idx = current ? milestones.findIndex((m) => m.id === current.id) : 0;
    return Math.max(idx, 0);
  }, [milestones]);

  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = milestones.find((m) => m.id === selectedId) ?? null;

  // Arranca posicionado en la etapa en curso, sin animación.
  useEffect(() => {
    const track = trackRef.current;
    const slide = slideRefs.current[initialIndex];
    if (track && slide) track.scrollLeft = slide.offsetLeft - track.offsetLeft;
  }, [initialIndex]);

  // El dot activo sigue al card más visible del carrusel.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveIndex(Number((entry.target as HTMLElement).dataset.index));
          }
        }
      },
      { root: track, threshold: 0.6 },
    );
    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [milestones.length]);

  function scrollToIndex(index: number) {
    const track = trackRef.current;
    const slide = slideRefs.current[index];
    if (!track || !slide) return;
    track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: "smooth" });
  }

  return (
    <div>
      <h2 className="sr-only">Sua jornada</h2>

      <div
        ref={trackRef}
        // -mx-6/px-6: el carrusel llega al borde de la pantalla para que se vea
        // asomar el siguiente card (mismo gutter que el <main>).
        className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-6 px-6 pt-2 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-roledescription="carrossel"
      >
        {milestones.map((milestone, i) => (
          <div
            key={milestone.id}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            data-index={i}
            className="w-[86%] max-w-[420px] shrink-0 snap-start"
            aria-roledescription="slide"
            aria-label={`Etapa ${milestone.order_index} de ${milestones.length}`}
          >
            <StageCard
              milestone={milestone}
              total={milestones.length}
              onOpen={() => setSelectedId(milestone.id)}
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-center gap-3">
        {milestones.map((milestone, i) => (
          <PaginationDot
            key={milestone.id}
            milestone={milestone}
            active={i === activeIndex}
            onClick={() => scrollToIndex(i)}
          />
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <StageModal
            key={selected.id}
            milestones={milestones}
            milestone={selected}
            onClose={() => setSelectedId(null)}
            onSelect={setSelectedId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StageCard({
  milestone,
  total,
  onOpen,
}: {
  milestone: MilestoneView;
  total: number;
  onOpen: () => void;
}) {
  const status = stageVisualStatus(milestone);
  const progress = stageTaskProgress(milestone);

  return (
    <article className="relative flex h-full flex-col rounded-[10px] bg-surface p-5 shadow-[0px_3px_6px_rgba(0,0,0,0.16)]">
      {status === "completed" && <CompletedRibbon />}

      <div className="min-h-[76px] pr-24 font-display">
        <p className="text-[13px] text-ink-muted">
          Etapa {milestone.order_index} de {total}
        </p>
        {milestone.locked ? (
          <p className="mt-1 flex items-center gap-2.5 text-[22px] font-bold text-ink">
            <LockFilledIcon /> Bloqueada
          </p>
        ) : (
          <>
            <p className="mt-0.5 text-[22px] font-bold leading-tight text-ink">
              {milestone.title}
            </p>
            {progress.total > 0 && (
              <p className="mt-1 text-[13px] text-ink">
                {progress.completed} de {progress.total} missões concluídas
              </p>
            )}
          </>
        )}
      </div>

      <div className="relative mx-auto my-3 aspect-square w-full max-w-[300px]">
        <Image
          src={stageImageSrc(milestone.order_index, status)}
          alt=""
          fill
          sizes="(max-width: 768px) 80vw, 300px"
          className="object-contain drop-shadow-sm"
        />
      </div>

      {!milestone.locked && status !== "completed" && progress.total > 0 && (
        <div
          className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-track"
          role="progressbar"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            className="h-full rounded-full bg-brand"
            initial={{ width: 0 }}
            animate={{ width: `${progress.percent}%` }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          />
        </div>
      )}

      <button
        type="button"
        onClick={onOpen}
        disabled={milestone.locked}
        className="mx-auto flex h-11 w-full max-w-[260px] items-center justify-center gap-3 rounded-[5px] bg-brand text-[15px] font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-track disabled:text-ink-muted"
      >
        {milestone.locked ? "Etapa bloqueada" : "Continuar jornada"}
        {!milestone.locked && <ChevronIcon />}
      </button>
    </article>
  );
}

// Diseño mobile: banderín colgando del borde superior derecho.
function CompletedRibbon() {
  return (
    <div
      className="absolute top-0 right-5 flex w-[88px] flex-col items-center bg-brand pt-2.5 pb-6 text-white"
      style={{ clipPath: "polygon(0 0, 100% 0, 100% 82%, 50% 100%, 0 82%)" }}
    >
      <span className="text-center text-[10px] font-medium leading-tight">
        Etapa
        <br />
        concluída
      </span>
      <span className="mt-1.5">
        <CheckIcon size={30} />
      </span>
    </div>
  );
}

function PaginationDot({
  milestone,
  active,
  onClick,
}: {
  milestone: MilestoneView;
  active: boolean;
  onClick: () => void;
}) {
  const status = stageVisualStatus(milestone);
  const size = active ? "h-9 w-9" : "h-[22px] w-[22px]";
  const look =
    status === "completed"
      ? "bg-brand text-white"
      : milestone.locked
        ? "bg-surface text-ink"
        : "bg-brand";
  const ring = active ? "ring-4 ring-brand-soft" : "";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ir para a etapa ${milestone.order_index}`}
      aria-current={active ? "true" : undefined}
      className={`flex shrink-0 items-center justify-center rounded-full transition-all duration-200 ${size} ${look} ${ring}`}
    >
      {status === "completed" && <CheckIcon size={active ? 18 : 12} />}
      {milestone.locked && <LockFilledIcon small />}
    </button>
  );
}

function LockFilledIcon({ small }: { small?: boolean }) {
  return (
    <svg
      width={small ? 8 : 14}
      height={small ? 10 : 17}
      viewBox="0 0 14 17"
      aria-hidden="true"
    >
      <path d="M3.5 7V4.5a3.5 3.5 0 0 1 7 0V7" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="0.5" y="6.5" width="13" height="10" rx="2" fill="currentColor" />
      <path d="M7 10.5v2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
