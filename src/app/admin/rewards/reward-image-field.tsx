"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// Imágenes disponibles en frontend/public/rewards — agregar acá al sumar una.
export const REWARD_IMAGES = [
  { value: "/rewards/kit_onboarding.png", label: "Kit onboarding" },
  { value: "/rewards/caneca.png", label: "Caneca" },
  { value: "/rewards/lunchbox.png", label: "Lancheira" },
  { value: "/rewards/case.png", label: "Case" },
  { value: "/rewards/fone.jpg", label: "Fone de ouvido" },
  { value: "/rewards/kindle.webp", label: "Kindle" },
];

// Espejo de REWARD_IMAGE_CONTENT_TYPES / REWARD_IMAGE_MAX_BYTES (backend/src/aws/s3.service.ts)
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export type RewardImage =
  | { kind: "none" }
  | { kind: "preset"; url: string }
  | { kind: "upload"; key: string; preview: string };

export function initialRewardImage(reward?: {
  image_url: string | null;
  image_key: string | null;
}): RewardImage {
  if (reward?.image_key && reward.image_url) {
    return { kind: "upload", key: reward.image_key, preview: reward.image_url };
  }
  if (reward?.image_url) return { kind: "preset", url: reward.image_url };
  return { kind: "none" };
}

/** Campos que el backend espera para la imagen (create/update). */
export function rewardImagePayload(image: RewardImage, isEdit: boolean) {
  if (image.kind === "upload") return { imageKey: image.key };
  if (image.kind === "preset") return { imageUrl: image.url };
  // Sin imagen: en la edición "" limpia ambas; en la creación se omite.
  return isEdit ? { imageUrl: "", imageKey: "" } : {};
}

/**
 * Imagen del reward: subir un archivo (directo a S3 con presigned POST,
 * mismo flujo que las evidencias) o elegir una de la biblioteca estática.
 */
export function RewardImageField({
  id,
  value,
  onChange,
  onUploadingChange,
}: {
  id: string;
  value: RewardImage;
  onChange: (image: RewardImage) => void;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Libera el object URL de la vista previa local al reemplazarla.
  useEffect(() => {
    const preview = value.kind === "upload" ? value.preview : null;
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [value]);

  async function handleFile(file: File) {
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Formato não permitido. Use PNG, JPG ou WEBP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("A imagem deve ter no máximo 5 MB.");
      return;
    }

    setUploading(true);
    onUploadingChange(true);
    try {
      const urlRes = await fetch("/api/admin/rewards/images/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type }),
      });
      if (!urlRes.ok) throw new Error("upload-url");

      const { url, fields, key } = (await urlRes.json()) as {
        url: string;
        fields: Record<string, string>;
        key: string;
      };

      const formData = new FormData();
      Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
      formData.append("file", file);

      const uploadRes = await fetch(url, { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("s3");

      onChange({ kind: "upload", key, preview: URL.createObjectURL(file) });
    } catch {
      setError("Não foi possível enviar a imagem. Tente novamente.");
    } finally {
      setUploading(false);
      onUploadingChange(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const preview =
    value.kind === "upload" ? value.preview : value.kind === "preset" ? value.url : null;

  return (
    <div>
      <p className="mb-1.5 block text-sm font-medium text-ink">
        Imagem <span className="text-ink-muted">(opcional)</span>
      </p>

      <div className="flex items-start gap-4">
        <span className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-canvas">
          {preview ? (
            <Image
              src={preview}
              alt="Pré-visualização da imagem do reward"
              fill
              sizes="96px"
              // blob: (vista previa local) no pasa por el optimizador.
              unoptimized={preview.startsWith("blob:")}
              className="object-contain p-1.5"
            />
          ) : (
            <span className="px-2 text-center text-xs text-ink-muted">Sem imagem</span>
          )}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-surface/80 text-xs font-medium text-ink">
              Enviando...
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            id={`${id}-file`}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <label
              htmlFor={`${id}-file`}
              className={`cursor-pointer rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-canvas ${
                uploading ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {value.kind === "upload" ? "Trocar imagem" : "Enviar imagem"}
            </label>
            {value.kind !== "none" && (
              <button
                type="button"
                onClick={() => onChange({ kind: "none" })}
                disabled={uploading}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-pastel-red-text transition hover:bg-pastel-red-bg disabled:opacity-60"
              >
                Remover
              </button>
            )}
          </div>
          <p className="text-xs text-ink-muted">PNG, JPG ou WEBP, até 5 MB.</p>

          <select
            id={id}
            aria-label="Ou escolha uma imagem da biblioteca"
            value={value.kind === "preset" ? value.url : ""}
            disabled={uploading}
            onChange={(e) =>
              onChange(e.target.value ? { kind: "preset", url: e.target.value } : { kind: "none" })
            }
            className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-ink outline-none focus:border-brand disabled:opacity-60"
          >
            <option value="">
              {value.kind === "upload" ? "Imagem enviada" : "Ou escolha da biblioteca..."}
            </option>
            {REWARD_IMAGES.map((img) => (
              <option key={img.value} value={img.value}>
                {img.label}
              </option>
            ))}
          </select>

          {error && <p className="text-xs text-pastel-red-text">{error}</p>}
        </div>
      </div>
    </div>
  );
}
