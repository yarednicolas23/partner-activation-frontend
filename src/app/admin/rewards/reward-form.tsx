"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { Reward } from "@/lib/types";
import {
  RewardImageField,
  initialRewardImage,
  rewardImagePayload,
  type RewardImage,
} from "./reward-image-field";

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand focus:ring-1 focus:ring-brand";

/**
 * Crea un reward (sin `reward`) o edita uno existente (con `reward`).
 * Tipo y estoque no se exponen: el backend crea todo reward como físico.
 */
export function RewardForm({
  milestones,
  reward,
  onSaved,
  onCancel,
}: {
  milestones: { id: string; order_index: number; title: string }[];
  reward?: Reward;
  onSaved: (reward: Reward) => void;
  onCancel?: () => void;
}) {
  const isEdit = !!reward;
  const [title, setTitle] = useState(reward?.title ?? "");
  const [description, setDescription] = useState(reward?.description ?? "");
  const [milestoneId, setMilestoneId] = useState(reward?.milestone_id ?? milestones[0]?.id ?? "");
  const [image, setImage] = useState<RewardImage>(() => initialRewardImage(reward));
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const res = await fetch(isEdit ? `/api/admin/rewards/${reward.id}` : "/api/admin/rewards", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        // Na edição, "" limpa a descrição; na criação, omite.
        description: isEdit ? description : description || undefined,
        milestoneId,
        ...rewardImagePayload(image, isEdit),
      }),
    });

    if (!res.ok) {
      setStatus("error");
      return;
    }

    onSaved((await res.json()) as Reward);
    setStatus("idle");
    if (!isEdit) {
      setTitle("");
      setDescription("");
      setImage({ kind: "none" });
    }
  }

  const idPrefix = reward ? `reward-${reward.id}-` : "";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-border bg-surface p-6"
    >
      {isEdit && <p className="text-sm font-semibold text-ink">Editar reward</p>}

      <div>
        <label htmlFor={`${idPrefix}title`} className="mb-1.5 block text-sm font-medium text-ink">
          Título
        </label>
        <input
          id={`${idPrefix}title`}
          type="text"
          required
          minLength={2}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Kit de boas-vindas Kaspersky"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}description`} className="mb-1.5 block text-sm font-medium text-ink">
          Descrição <span className="text-ink-muted">(opcional)</span>
        </label>
        <textarea
          id={`${idPrefix}description`}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}milestoneId`} className="mb-1.5 block text-sm font-medium text-ink">
          Etapa necessária
        </label>
        <select
          id={`${idPrefix}milestoneId`}
          value={milestoneId}
          onChange={(e) => setMilestoneId(e.target.value)}
          className={inputClass}
        >
          {milestones.map((m) => (
            <option key={m.id} value={m.id}>
              {m.order_index}. {m.title}
            </option>
          ))}
        </select>
      </div>

      <RewardImageField
        id={`${idPrefix}image`}
        value={image}
        onChange={setImage}
        onUploadingChange={setUploading}
      />

      {status === "error" && (
        <p className="text-sm text-pastel-red-text">
          {isEdit
            ? "Não foi possível salvar as alterações. Tente novamente."
            : "Não foi possível criar o reward. Tente novamente."}
        </p>
      )}

      {isEdit ? (
        <div className="flex gap-2">
          <Button type="submit" disabled={status === "sending" || uploading || !milestoneId}>
            {status === "sending" ? "Salvando..." : "Salvar"}
          </Button>
          <button
            type="button"
            onClick={onCancel}
            disabled={status === "sending"}
            className="w-full rounded-md border border-border px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-canvas disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <Button type="submit" disabled={status === "sending" || uploading || !milestoneId}>
          {status === "sending" ? "Criando..." : "Criar reward"}
        </Button>
      )}
    </form>
  );
}
