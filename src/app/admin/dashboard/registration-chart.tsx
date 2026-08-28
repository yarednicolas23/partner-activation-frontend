"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import type { WeeklyCount } from "@/lib/types";

function formatWeek(week: string): string {
  const [, month, day] = week.split("-");
  return `${day}/${month}`;
}

export function RegistrationChart({ data }: { data: WeeklyCount[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-ink-muted">Sem dados suficientes ainda.</p>
    );
  }

  const chartData = data.map((d) => ({
    label: formatWeek(d.week),
    Parceiros: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--color-ink-muted)", fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "var(--color-brand-soft)" }}
          contentStyle={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="Parceiros" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
