"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { Reward, RewardType } from "@/lib/types";

const TYPE_LABEL: Record<RewardType, string> = {
  physical: "Físico",
  digital: "Digital",
  mixed: "Misto",
};

export function RewardForm({
  milestones,
  onCreated,
}: {
  milestones: { id: string; order_index: number; title: string }[];
  onCreated: (reward: Reward) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<RewardType>("physical");
  const [milestoneId, setMilestoneId] = useState(milestones[0]?.id ?? "");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const res = await fetch("/api/admin/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || undefined,
        type,
        milestoneId,
        stock: stock === "" ? undefined : Number(stock),
      }),
    });

    if (!res.ok) {
      setStatus("error");
      return;
    }

    const reward = (await res.json()) as Reward;
    onCreated(reward);
    setStatus("idle");
    setTitle("");
    setDescription("");
    setStock("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-border bg-surface p-6"
    >
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-ink">
          Título
        </label>
        <input
          id="title"
          type="text"
          required
          minLength={2}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Kit de boas-vindas Kaspersky"
          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-ink">
          Descrição <span className="text-ink-muted">(opcional)</span>
        </label>
        <textarea
          id="description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="type" className="mb-1.5 block text-sm font-medium text-ink">
            Tipo
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as RewardType)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          >
            {Object.entries(TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="stock" className="mb-1.5 block text-sm font-medium text-ink">
            Estoque <span className="text-ink-muted">(opcional)</span>
          </label>
          <input
            id="stock"
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="Ilimitado"
            className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      <div>
        <label htmlFor="milestoneId" className="mb-1.5 block text-sm font-medium text-ink">
          Etapa necessária
        </label>
        <select
          id="milestoneId"
          value={milestoneId}
          onChange={(e) => setMilestoneId(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        >
          {milestones.map((m) => (
            <option key={m.id} value={m.id}>
              {m.order_index}. {m.title}
            </option>
          ))}
        </select>
      </div>

      {status === "error" && (
        <p className="text-sm text-pastel-red-text">
          Não foi possível criar o reward. Tente novamente.
        </p>
      )}

      <Button type="submit" disabled={status === "sending" || !milestoneId}>
        {status === "sending" ? "Criando..." : "Criar reward"}
      </Button>
    </form>
  );
}
