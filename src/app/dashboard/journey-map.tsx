"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { MilestoneView, TaskWithEvidence } from "@/lib/types";
import { TaskRow } from "./task-row";
import {
  isMilestoneComplete,
  stageImageSrc,
  stageTaskProgress,
  stageVisualStatus,
  type StageVisualStatus,
} from "./stage-art";

const STAGE_GAP = 14;

const BADGE_CLASS: Record<StageVisualStatus, string> = {
  locked: "bg-surface text-ink-muted ring-2 ring-border",
  base: "bg-brand text-white ring-4 ring-brand-soft",
  review: "bg-pastel-yellow-text text-white ring-4 ring-pastel-yellow-bg",
  alert: "bg-pastel-red-text text-white ring-4 ring-pastel-red-bg",
  completed: "bg-pastel-green-text text-white ring-2 ring-transparent",
};

export function JourneyMap({ milestones }: { milestones: MilestoneView[] }) {
  const defaultSelected = useMemo(() => {
    const inProgress = milestones.find((m) => stageVisualStatus(m) !== "locked" && stageVisualStatus(m) !== "completed");
    return (inProgress ?? milestones[0])?.id ?? null;
  }, [milestones]);

  const [selectedId, setSelectedId] = useState<string | null>(defaultSelected);
  const selected = milestones.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Sua jornada</h2>
      </div>

      <div className="-mx-6 overflow-x-auto px-6 pb-2 sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="relative min-w-[640px] sm:min-w-0 [--stage-w:96px] sm:[--stage-w:132px] lg:[--stage-w:168px]">
          {/* Linha contínua atrás dos badges — um segmento por transição entre etapas. */}
          <div
            className="pointer-events-none absolute inset-x-0"
            style={{ top: `calc(var(--stage-w) + ${STAGE_GAP}px)` }}
          >
            <div className="relative h-[3px] -translate-y-1/2">
              {milestones.slice(0, -1).map((milestone, i) => {
                const n = milestones.length;
                const left = ((i + 0.5) / n) * 100;
                const width = (1 / n) * 100;
                return (
                  <motion.div
                    key={milestone.id}
                    className={`absolute top-0 h-full rounded-full ${
                      isMilestoneComplete(milestone) ? "bg-brand" : "bg-border"
                    }`}
                    style={{ left: `${left}%`, width: `${width}%`, transformOrigin: "left" }}
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
                onSelect={() => setSelectedId(milestone.id)}
                delay={i * 0.08}
              />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="mt-8 border-t border-border pt-6"
          >
            <h3 className="mb-1 text-base font-semibold text-ink">
              {selected.order_index}. {selected.locked ? "Etapa bloqueada" : selected.title}
            </h3>
            {selected.locked ? (
              <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                <LockIcon />
                Conclua a etapa anterior para desbloquear esta etapa.
              </p>
            ) : (
              <>
                {selected.description && (
                  <p className="mb-4 text-sm text-ink-muted">{selected.description}</p>
                )}
                <div className="space-y-3">
                  {selected.tasks?.map((task: TaskWithEvidence) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </div>
              </>
            )}
          </motion.div>
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
      >
        {status === "locked" && <LockIcon />}
        {status === "completed" && <CheckIcon />}
        {status === "review" && <ClockIcon />}
        {status === "alert" && <AlertIcon />}
        {status === "base" && <span>{progress.percent}%</span>}
      </div>

      <div className="mt-3 space-y-0.5">
        <p className="text-xs text-ink-muted">
          Etapa {milestone.order_index} de 5
        </p>
        <p className="text-sm font-semibold text-ink">
          {milestone.locked ? (
            <span className="inline-flex items-center gap-1 text-ink-muted">
              <LockIcon /> Bloqueada
            </span>
          ) : (
            milestone.title
          )}
        </p>
        {!milestone.locked && progress.total > 0 && (
          <p className="text-xs text-ink-muted">
            {progress.completed} de {progress.total} missões
          </p>
        )}
        {status === "completed" && (
          <p className="flex items-center justify-center gap-1 text-xs font-medium text-pastel-green-text">
            <CheckIcon small /> Concluída
          </p>
        )}
        {status === "review" && (
          <p className="text-xs font-medium text-pastel-yellow-text">Em análise</p>
        )}
        {status === "alert" && (
          <p className="text-xs font-medium text-pastel-red-text">Requer atenção</p>
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
