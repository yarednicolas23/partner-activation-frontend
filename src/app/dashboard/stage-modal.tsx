"use client";

import { useEffect } from "react";
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
      className="fixed inset-0 z-50 bg-canvas"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex h-full flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <div className="relative flex flex-1 shrink-0 flex-col items-center justify-center px-8 py-12 lg:py-16">
          <motion.div
            key={`${milestone.id}-image`}
            className="relative h-56 w-56 sm:h-72 sm:w-72 lg:h-[26rem] lg:w-[26rem]"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            <Image
              src={stageImageSrc(milestone.order_index, status)}
              alt=""
              fill
              sizes="(min-width: 1024px) 26rem, 18rem"
              className="object-contain"
              priority
            />
          </motion.div>

          <div className="mt-8 flex w-full max-w-md items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-ink-muted">Etapa {milestone.order_index} de 5</p>
              <p className="truncate text-lg font-semibold text-ink">
                {milestone.locked ? "Bloqueada" : milestone.title}
              </p>
              {!milestone.locked && progress.total > 0 && (
                <div className="mt-2 flex items-center gap-3">
                  <span className="whitespace-nowrap text-xs text-ink-muted">
                    {progress.completed} de {progress.total} missões
                  </span>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-brand transition-[width] duration-500"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <span className="whitespace-nowrap text-xs font-medium text-ink">
                    {progress.percent}%
                  </span>
                </div>
              )}
            </div>

            {next && (
              <button
                type="button"
                onClick={() => onSelect(next.id)}
                aria-label="Ver próxima etapa"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink transition hover:bg-canvas"
              >
                <ChevronRightIcon />
              </button>
            )}
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col border-t border-border bg-surface p-6 sm:p-10 lg:h-full lg:w-[560px] lg:overflow-y-auto lg:border-l lg:border-t-0">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-brand">Etapa {milestone.order_index} de 5</p>
              <h2 className="text-2xl font-bold tracking-tight text-ink">
                {milestone.locked ? "Etapa bloqueada" : milestone.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-ink-muted transition hover:text-ink"
            >
              <CloseIcon />
            </button>
          </div>

          {milestone.locked ? (
            <p className="flex items-center gap-1.5 text-sm text-ink-muted">
              <LockIcon />
              Conclua a etapa anterior para desbloquear esta etapa.
            </p>
          ) : (
            <>
              {progress.total > 0 && (
                <div className="mb-4 flex items-center gap-3">
                  <span className="whitespace-nowrap text-sm text-ink-muted">
                    {progress.completed} de {progress.total} missões concluídas
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-brand transition-[width] duration-500"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <span className="whitespace-nowrap text-sm font-medium text-ink">
                    {progress.percent}%
                  </span>
                </div>
              )}

              {milestone.description && (
                <p className="mb-2 text-sm text-ink-muted">{milestone.description}</p>
              )}

              <div className="divide-y divide-border border-t border-border">
                {milestone.tasks?.map((task, i) => (
                  <TaskAccordionRow
                    key={task.id}
                    task={task}
                    index={i + 1}
                    defaultOpen={task.id === defaultOpenTaskId}
                  />
                ))}
              </div>

              <div className="mt-6 flex items-center gap-4 rounded-xl bg-canvas p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface">
                  <GiftIcon />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-brand">Recompensa da etapa</p>
                  <p className="text-sm font-semibold text-ink">
                    {status === "completed"
                      ? "Recompensa desbloqueada"
                      : "Complete esta etapa para desbloquear sua recompensa"}
                  </p>
                  {progress.total > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-brand transition-[width] duration-500"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                      <span className="whitespace-nowrap text-xs text-ink-muted">
                        {progress.completed} de {progress.total}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

function GiftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-brand">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7" />
      <path d="M12 8c-1.5 0-4-1-4-3.2A2.3 2.3 0 0 1 10.3 2c1.8 0 1.7 3 1.7 6ZM12 8c1.5 0 4-1 4-3.2A2.3 2.3 0 0 0 13.7 2c-1.8 0-1.7 3-1.7 6Z" />
    </svg>
  );
}
