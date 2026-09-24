"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { MilestoneView } from "@/lib/types";
import { TaskAccordionRow } from "./task-accordion-row";
import { stageImageSrc, stageTaskProgress, stageVisualStatus } from "./stage-art";

export function StageModal({
  milestones,
  milestone,
  onClose,
  onSelect,
}: {
  milestones: MilestoneView[];
  milestone: MilestoneView;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  // El panel ocupa el espacio entre el navbar (que queda visible) y el borde
  // inferior — se mide el <header> en vez de fijar su alto, que cambia con el
  // breakpoint.
  const [top, setTop] = useState<number | null>(null);

  useLayoutEffect(() => {
    function measure() {
      const header = document.querySelector("header");
      setTop((header?.getBoundingClientRect().bottom ?? 0) + GAP);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const status = stageVisualStatus(milestone);
  const progress = stageTaskProgress(milestone);
  const next = milestones.find((m) => m.order_index === milestone.order_index + 1);

  const defaultOpenTaskId = milestone.locked
    ? null
    : (milestone.tasks?.find(
        (t) => t.evidence_type !== "none" && t.evidence?.status !== "approved",
      )?.id ?? null);

  return (
    <motion.div
      // z-30: por debajo del navbar (z-40), que sigue visible y usable.
      className="fixed inset-0 z-30 bg-canvas"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {top !== null && (
        <div
          className="absolute inset-x-0 mx-auto flex w-[calc(100%-48px)] max-w-[1800px] flex-col gap-6 overflow-y-auto sm:w-[calc(100%-96px)] lg:flex-row lg:overflow-hidden"
          style={{ top, bottom: GAP }}
        >
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 py-4">
            <motion.div
              key={`${milestone.id}-image`}
              className="relative aspect-square w-full max-w-[36rem] shrink lg:min-h-0 lg:flex-1 lg:max-h-[36rem]"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              <Image
                src={stageImageSrc(milestone.order_index, status)}
                alt=""
                fill
                sizes="(min-width: 1024px) 36rem, 90vw"
                className="object-contain"
                priority
              />
            </motion.div>

            <div className="flex w-full max-w-[42rem] items-center justify-between gap-6 font-display">
              <div className="min-w-0">
                <p className="text-base text-ink-muted">Etapa {milestone.order_index} de 5</p>
                <p className="truncate text-[28px] font-bold leading-tight text-ink">
                  {milestone.locked ? "Bloqueada" : milestone.title}
                </p>
              </div>

              {!milestone.locked && progress.total > 0 && (
                <div className="hidden w-[22rem] sm:block">
                  <p className="text-base text-ink">
                    {progress.completed} de {progress.total} missões concluídas
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <ProgressBar percent={progress.percent} className="flex-1" />
                    <span className="text-base text-ink">{progress.percent}%</span>
                  </div>
                </div>
              )}

              {next ? (
                <button
                  type="button"
                  onClick={() => onSelect(next.id)}
                  aria-label="Ver próxima etapa"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink transition hover:bg-surface"
                >
                  <ChevronRightIcon />
                </button>
              ) : (
                <span className="w-10 shrink-0" />
              )}
            </div>
          </div>

          <div className="flex min-h-0 w-full shrink-0 flex-col rounded-[10px] bg-surface p-6 font-display shadow-[0px_3px_6px_rgba(0,0,0,0.16)] sm:p-8 lg:w-1/2 lg:overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-brand">Etapa {milestone.order_index} de 5</p>
                <h2 className="text-[34px] font-bold leading-tight tracking-tight text-ink">
                  {milestone.locked ? "Etapa bloqueada" : milestone.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5b5b5b] text-white transition hover:bg-ink"
              >
                <CloseIcon />
              </button>
            </div>

            {milestone.locked ? (
              <p className="mt-4 flex items-center gap-1.5 text-base text-ink">
                <LockIcon />
                Conclua a etapa anterior para desbloquear esta etapa.
              </p>
            ) : (
              <>
                {progress.total > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-12 gap-y-2">
                    <span className="text-base text-ink">
                      {progress.completed} de {progress.total} missões concluídas
                    </span>
                    <div className="flex items-center gap-3">
                      <ProgressBar percent={progress.percent} className="w-[17.5rem]" />
                      <span className="text-base font-medium text-ink">{progress.percent}%</span>
                    </div>
                  </div>
                )}

                {milestone.description && (
                  <p className="mt-3 text-base text-ink-muted">{milestone.description}</p>
                )}

                <div className="mb-4 mt-6 h-0.5 bg-border" />

                <div className="divide-y divide-border rounded-[10px] border border-border">
                  {milestone.tasks?.map((task, i) => (
                    <TaskAccordionRow
                      key={task.id}
                      task={task}
                      index={i + 1}
                      defaultOpen={task.id === defaultOpenTaskId}
                    />
                  ))}
                </div>

                <div className="mt-auto flex items-center gap-6 rounded-[10px] border border-border bg-[#f8fafb] p-5 lg:mt-8">
                  <span className="relative h-24 w-28 shrink-0">
                    <Image src="/blocked-gift/blocked-gift.png" alt="" fill sizes="112px" className="object-contain" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink-muted">Recompensa da etapa</p>
                    <p className="text-base font-bold text-ink">
                      {status === "completed"
                        ? "Recompensa desbloqueada"
                        : "Conclua esta etapa para desbloquear sua recompensa"}
                    </p>
                    {progress.total > 0 && (
                      <>
                        <p className="text-sm text-ink-muted">
                          {progress.completed} de {progress.total}{" "}
                          {progress.completed === 1 ? "missão concluída" : "missões concluídas"}
                        </p>
                        <ProgressBar percent={progress.percent} className="mt-2 w-full" />
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

const GAP = 22;

function ProgressBar({ percent, className = "" }: { percent: number; className?: string }) {
  return (
    <div
      className={`h-2 overflow-hidden rounded-full bg-track ${className}`}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-brand transition-[width] duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
