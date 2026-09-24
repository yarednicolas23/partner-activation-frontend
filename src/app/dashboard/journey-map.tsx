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
  completed: "bg-pastel-green-text text-white ring-2 ring-transparent",
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
            <div className="relative h-1 -translate-y-1/2">
              {milestones.slice(0, -1).map((milestone, i) => {
                const n = milestones.length;
                const left = ((i + 0.5) / n) * 100;
                const width = (1 / n) * 100;
                const complete = isMilestoneComplete(milestone);
                // O trecho que leva até a etapa em andamento usa o gradiente de
                // progresso (spec XD); os demais seguem sólidos (percorrido vs. pendente).
                const leadsToCurrent = complete && milestones[i + 1]?.id === current?.id;
                return (
                  <motion.div
                    key={milestone.id}
                    className={`absolute top-0 h-full rounded-full ${
                      leadsToCurrent ? "" : complete ? "bg-brand" : "bg-border"
                    }`}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      transformOrigin: "left",
                      background: leadsToCurrent
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
                selected={milestone.id === selectedId}
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
  selected,
  onSelect,
  delay,
}: {
  milestone: MilestoneView;
  selected: boolean;
  onSelect: () => void;
  delay: number;
}) {
  const [hovered, setHovered] = useState(false);
  const status = stageVisualStatus(milestone);
  const progress = stageTaskProgress(milestone);
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
        className={`relative z-10 -mt-4 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold shadow-sm transition ${BADGE_CLASS[status]} ${
          selected ? "outline outline-2 outline-offset-2 outline-ink/20" : ""
        }`}
        style={
          status === "base"
            ? { background: `conic-gradient(var(--color-brand) ${progress.percent * 3.6}deg, var(--color-brand-soft) 0deg)` }
            : undefined
        }
      >
        {status === "locked" && <LockIcon />}
        {status === "completed" && <CheckIcon />}
        {status === "review" && <ClockIcon />}
        {status === "alert" && <AlertIcon />}
        {status === "base" && (
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-surface text-[9px] font-bold leading-none text-brand">
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
                <div
                  className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#d6d6d6]"
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

function ClockIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function AlertIcon() {
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
      <path d="M12 9v4" />
      <path d="M10.3 3.9 1.8 18a1.5 1.5 0 0 0 1.3 2.3h17.8a1.5 1.5 0 0 0 1.3-2.3L13.7 3.9a1.5 1.5 0 0 0-2.6 0Z" />
      <path d="M12 17h.01" />
    </svg>
  );
}
