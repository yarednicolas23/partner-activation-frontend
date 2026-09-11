"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { MilestoneView, TaskWithEvidence } from "@/lib/types";
import { TaskRow } from "./task-row";

type NodeStatus = "locked" | "current" | "completed";

const NODE_SIZE = 56;
const ROW_HEIGHT = 108;
// Zigzag horizontal, alternando de lado — look "trilha" tipo Duolingo sem
// precisar de arte isométrica custom (ver discussão de escopo do Dashboard
// do Sócio).
const X_OFFSETS = [0, 64, -64, 64, 0];

function isMilestoneComplete(milestone: MilestoneView): boolean {
  const requiredTasks = (milestone.tasks ?? []).filter(
    (t) => t.evidence_type !== "none",
  );
  return (
    requiredTasks.length > 0 &&
    requiredTasks.every((t) => t.evidence?.status === "approved")
  );
}

function statusOf(milestone: MilestoneView): NodeStatus {
  if (milestone.locked) return "locked";
  return isMilestoneComplete(milestone) ? "completed" : "current";
}

export function JourneyMap({ milestones }: { milestones: MilestoneView[] }) {
  const completedCount = milestones.filter(
    (m) => !m.locked && isMilestoneComplete(m),
  ).length;

  const defaultSelected = useMemo(() => {
    const inProgress = milestones.find((m) => statusOf(m) === "current");
    return (inProgress ?? milestones[0])?.id ?? null;
  }, [milestones]);

  const [selectedId, setSelectedId] = useState<string | null>(defaultSelected);
  const selected = milestones.find((m) => m.id === selectedId) ?? null;

  const width = 240;
  const centerX = width / 2;
  const points = milestones.map((m, i) => ({
    x: centerX + X_OFFSETS[i % X_OFFSETS.length],
    y: NODE_SIZE / 2 + i * ROW_HEIGHT,
  }));
  const height = points.length > 0 ? points[points.length - 1].y + NODE_SIZE / 2 : 0;

  const pathD = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const midY = (prev.y + p.y) / 2;
      return `C ${prev.x} ${midY}, ${p.x} ${midY}, ${p.x} ${p.y}`;
    })
    .join(" ");

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Missões</h2>
        <span className="text-sm text-ink-muted">
          {completedCount}/{milestones.length} concluídas
        </span>
      </div>

      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <motion.div
          className="h-full rounded-full bg-brand"
          initial={{ width: 0 }}
          animate={{
            width: `${milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0}%`,
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
          <div
            className="relative mx-auto shrink-0"
            style={{ width, height: height || undefined }}
          >
            <svg
              width={width}
              height={height}
              className="absolute inset-0"
              aria-hidden="true"
            >
              <motion.path
                d={pathD}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth={3}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            </svg>

            {milestones.map((milestone, i) => (
              <MilestoneNode
                key={milestone.id}
                milestone={milestone}
                status={statusOf(milestone)}
                point={points[i]}
                selected={milestone.id === selectedId}
                onSelect={() => !milestone.locked && setSelectedId(milestone.id)}
                delay={i * 0.08}
              />
            ))}
          </div>

          <div className="min-w-0">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="mb-1 text-base font-semibold text-ink">
                  {selected.order_index}. {selected.title}
                </h3>
                {selected.description && (
                  <p className="mb-4 text-sm text-ink-muted">
                    {selected.description}
                  </p>
                )}
                <div className="space-y-3">
                  {selected.tasks?.map((task: TaskWithEvidence) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </div>
              </motion.div>
            ) : (
              <p className="text-sm text-ink-muted">
                Nenhuma missão desbloqueada ainda.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MilestoneNode({
  milestone,
  status,
  point,
  selected,
  onSelect,
  delay,
}: {
  milestone: MilestoneView;
  status: NodeStatus;
  point: { x: number; y: number };
  selected: boolean;
  onSelect: () => void;
  delay: number;
}) {
  const statusClass: Record<NodeStatus, string> = {
    locked: "bg-border text-ink-muted",
    current: "bg-brand text-white",
    completed: "bg-pastel-green-text text-white",
  };

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={status === "locked"}
      title={milestone.locked ? `Etapa ${milestone.order_index} — bloqueada` : milestone.title}
      className={`absolute flex items-center justify-center rounded-full text-sm font-semibold shadow-sm transition ${statusClass[status]} ${
        status === "locked" ? "cursor-not-allowed" : "cursor-pointer"
      } ${selected ? "ring-2 ring-brand ring-offset-2 ring-offset-surface" : ""}`}
      style={{
        width: NODE_SIZE,
        height: NODE_SIZE,
        left: point.x - NODE_SIZE / 2,
        top: point.y - NODE_SIZE / 2,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.35, delay, type: "spring", stiffness: 260, damping: 18 }}
      whileHover={status !== "locked" ? { scale: 1.08 } : undefined}
      whileTap={status !== "locked" ? { scale: 0.96 } : undefined}
    >
      {status === "locked" && <LockIcon />}
      {status === "completed" && <CheckIcon />}
      {status === "current" && (
        <>
          <span>{milestone.order_index}</span>
          <motion.span
            className="absolute inset-0 rounded-full bg-brand"
            animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.35, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ zIndex: -1 }}
          />
        </>
      )}
    </motion.button>
  );
}

function LockIcon() {
  return (
    <svg
      width="20"
      height="20"
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

function CheckIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
