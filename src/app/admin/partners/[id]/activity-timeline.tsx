"use client";

import { useState } from "react";
import type { TimelineCategory, TimelineEvent, TimelineTone } from "./timeline-events";

const FILTERS: { value: TimelineCategory | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "missions", label: "Missões" },
  { value: "stages", label: "Etapas" },
  { value: "rewards", label: "Resgates" },
  { value: "access", label: "Acessos" },
];

const DOT_CLASS: Record<TimelineTone, string> = {
  neutral: "bg-track",
  info: "bg-pastel-blue-text",
  success: "bg-brand",
  warning: "bg-pastel-yellow-text",
  danger: "bg-pastel-red-text",
};

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export function ActivityTimeline({ events }: { events: TimelineEvent[] }) {
  const [filter, setFilter] = useState<TimelineCategory | "all">("all");
  const visible = filter === "all" ? events : events.filter((e) => e.category === filter);

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filtrar eventos">
        {FILTERS.map((f) => {
          const count =
            f.value === "all" ? events.length : events.filter((e) => e.category === f.value).length;
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active ? "bg-ink text-surface" : "bg-nav-pill text-ink-muted hover:text-ink"
              }`}
            >
              {f.label} <span className={active ? "opacity-70" : "opacity-60"}>{count}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-ink-muted">Nenhum evento nesta categoria.</p>
      ) : (
        <ol className="relative">
          {visible.map((event, i) => {
            const { date, time } = formatDateTime(event.at);
            const last = i === visible.length - 1;
            return (
              <li key={event.key} className="grid grid-cols-[5.5rem_1rem_1fr] gap-x-3">
                <div className="pt-0.5 text-right">
                  <p className="text-xs font-medium text-ink">{date}</p>
                  <p className="text-xs text-ink-muted">{time}</p>
                </div>
                <div className="flex flex-col items-center">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT_CLASS[event.tone]}`} />
                  {!last && <span className="w-px flex-1 bg-border" />}
                </div>
                <div className={last ? "" : "pb-6"}>
                  <p className="text-sm font-medium text-ink">{event.title}</p>
                  {event.detail && <p className="text-xs text-ink-muted">{event.detail}</p>}
                  {event.note && (
                    <p className="mt-1.5 rounded bg-canvas/60 px-3 py-2 text-xs text-ink">
                      “{event.note}”
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-6 border-t border-border pt-4 text-xs text-ink-muted">
        Cada missão e cada resgate mostram só o último envio ou status — reenvios substituem o
        registro anterior.
      </p>
    </div>
  );
}
