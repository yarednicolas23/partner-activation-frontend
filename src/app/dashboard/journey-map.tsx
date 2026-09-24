"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { MilestoneView } from "@/lib/types";
import { StageModal } from "./stage-modal";
import {
  findCurrentMilestone,
  isMilestoneComplete,
  stageImageSrc,
  stageTaskProgress,
  stageVisualStatus,
  type StageVisualStatus,
} from "./stage-art";

const STAGE_GAP = 14;

// Cor final do gradiente de progresso (spec XD): transparent linear-gradient(90deg, #29CCB1 0%, #F1F5F8 100%)
const PROGRESS_GRADIENT_END = "#f1f5f8";

const BADGE_CLASS: Record<StageVisualStatus, string> = {
  locked: "bg-surface text-ink-muted ring-2 ring-border",
  base: "text-white",
  review: "bg-pastel-yellow-text text-white ring-4 ring-pastel-yellow-bg",
  alert: "bg-pastel-red-text text-white ring-4 ring-pastel-red-bg",
  completed: "bg-brand text-white ring-4 ring-surface shadow-sm",
};

export function JourneyMap({ milestones }: { milestones: MilestoneView[] }) {
  const defaultSelected = useMemo(() => {
    return (findCurrentMilestone(milestones) ?? milestones[0])?.id ?? null;
  }, [milestones]);

  const [selectedId, setSelectedId] = useState<string | null>(defaultSelected);
  const [modalOpen, setModalOpen] = useState(false);
  const selected = milestones.find((m) => m.id === selectedId) ?? null;
  const current = findCurrentMilestone(milestones);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Sua jornada</h2>
      </div>

      <div className="-mx-6 overflow-x-auto px-6 pb-2 sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="relative min-w-[640px] sm:min-w-0 [--stage-w:120px] sm:[--stage-w:180px] lg:[--stage-w:224px]">
          {/* Linha contínua atrás dos badges — um segmento por transição entre etapas. */}
          <div
            className="pointer-events-none absolute inset-x-0"
            style={{ top: `calc(var(--stage-w) + ${STAGE_GAP}px)` }}
          >
            <div className="relative h-1.5 -translate-y-1/2">
              {milestones.slice(0, -1).map((milestone, i) => {
                const n = milestones.length;
                const left = ((i + 0.5) / n) * 100;
                const width = (1 / n) * 100;
                // Diseño XD: tramo recorrido (etapa concluida → siguiente) en
                // verde sólido; desde la etapa en curso, gradiente #29CCB1 →
                // #F1F5F8 que se desvanece. Más adelante no se dibuja.
                const complete = isMilestoneComplete(milestone);
                const isCurrent = milestone.id === current?.id;
                if (!complete && !isCurrent) return null;
                return (
                  <motion.div
                    key={milestone.id}
                    className={`absolute top-0 h-full rounded-full ${complete ? "bg-brand" : ""}`}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      transformOrigin: "left",
                      background: isCurrent
                        ? `linear-gradient(90deg, var(--color-brand) 0%, ${PROGRESS_GRADIENT_END} 100%)`
                        : undefined,
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.08, ease: "easeOut" }}
                  />
                );
              })}
            </div>
          </div>

          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${milestones.length}, minmax(0, 1fr))` }}
          >
            {milestones.map((milestone, i) => (
              <StageColumn
                key={milestone.id}
                milestone={milestone}
                onSelect={() => {
                  setSelectedId(milestone.id);
                  setModalOpen(true);
                }}
                delay={i * 0.08}
              />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && selected && (
          <StageModal
            key={selected.id}
            milestones={milestones}
            milestone={selected}
            onClose={() => setModalOpen(false)}
            onSelect={setSelectedId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StageColumn({
  milestone,
  onSelect,
  delay,
}: {
  milestone: MilestoneView;
  onSelect: () => void;
  delay: number;
}) {
  const [hovered, setHovered] = useState(false);
  const status = stageVisualStatus(milestone);
  const progress = stageTaskProgress(milestone);
  // Diseño XD: la etapa en curso muestra siempre el % (también en revisión).
  const showPercent = !milestone.locked && status !== "completed";
  const showHover = hovered && status === "base";

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={
        milestone.locked
          ? `Etapa ${milestone.order_index} — bloqueada`
          : `${milestone.order_index}. ${milestone.title}`
      }
      className="flex cursor-pointer flex-col items-center px-1 text-center"
    >
      <motion.div
        className="relative mx-auto"
        style={{ width: "var(--stage-w)", height: "var(--stage-w)" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: hovered && status === "base" ? -4 : 0 }}
        transition={{ opacity: { duration: 0.4, delay }, y: { duration: 0.18 } }}
      >
        <Image
          src={stageImageSrc(milestone.order_index, showHover ? "hover" : status)}
          alt=""
          fill
          sizes="200px"
          className="object-contain drop-shadow-sm"
          priority={milestone.order_index <= 2}
        />
      </motion.div>

      <div style={{ height: STAGE_GAP }} />

      <div
        // 44px, centrado sobre la línea de progreso (-mt = mitad del alto).
        className={`relative z-10 -mt-[22px] flex h-11 w-11 items-center justify-center rounded-full text-xs font-semibold transition ${showPercent ? "text-white" : BADGE_CLASS[status]}`}
        style={
          showPercent
            ? { background: `conic-gradient(var(--color-brand) ${progress.percent * 3.6}deg, #bdeee4 0deg)` }
            : undefined
        }
      >
        {status === "locked" && <LockIcon />}
        {status === "completed" && <CheckIcon />}
        
        
        {showPercent && (
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-surface text-[11px] font-bold leading-none text-brand">
            {progress.percent}%
          </span>
        )}
      </div>

      {/* Diseño XD: bloque alineado a la izquierda, centrado bajo el badge. */}
      <div className="mt-3 w-[calc(var(--stage-w)*0.8)] text-left font-display">
        <p className="text-[13px] text-ink-muted">
          Etapa {milestone.order_index} de 5
        </p>
        {milestone.locked ? (
          <p className="mt-1 flex items-center gap-2.5 text-base font-medium text-ink">
            <LockFilledIcon /> Bloqueada
          </p>
        ) : (
          <>
            <p className="mt-0.5 text-[17px] font-bold leading-snug text-ink">
              {milestone.title}
            </p>
            {progress.total > 0 && (
              <>
                <p className="mt-1 text-[13px] text-ink">
                  {progress.completed} de {progress.total} missões concluídas
                </p>
                {status === "completed" ? (
                  <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-brand">
                    <CheckIcon small /> Concluída
                  </p>
                ) : (
                <div
                    className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-track"
                    role="progressbar"
                    aria-valuenow={progress.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <motion.div
                      className="h-full rounded-full bg-brand"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.percent}%` }}
                      transition={{ duration: 0.6, delay: 0.3 + delay, ease: "easeOut" }}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </button>
  );
}

function LockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function LockFilledIcon() {
  return (
    <svg width="14" height="17" viewBox="0 0 14 17" aria-hidden="true">
      <path d="M3.5 7V4.5a3.5 3.5 0 0 1 7 0V7" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="0.5" y="6.5" width="13" height="10" rx="2" fill="currentColor" />
      <path d="M7 10.5v2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ small }: { small?: boolean }) {
  const size = small ? 12 : 16;
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

