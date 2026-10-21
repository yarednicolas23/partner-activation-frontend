import type { DeadlineSource, ExtensionStatus } from "./types";

// Compartilhado entre server e client components do prazo do programa.

export const EXTENSION_STATUS_LABEL: Record<ExtensionStatus, string> = {
  pending: "Pendente",
  approved: "Aprovada",
  rejected: "Recusada",
};

export const EXTENSION_STATUS_CLASS: Record<ExtensionStatus, string> = {
  pending: "bg-pastel-yellow-bg text-pastel-yellow-text",
  approved: "bg-pastel-green-bg text-pastel-green-text",
  rejected: "bg-pastel-red-bg text-pastel-red-text",
};

export const SOURCE_LABEL: Record<DeadlineSource, string> = {
  program: "Prazo geral",
  admin: "Ajustado",
  extension: "Prorrogado",
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

/**
 * ISO → valor de <input type="date"> (YYYY-MM-DD) no horário de Brasília,
 * o mesmo fuso em que o backend interpreta a data escolhida (fim do dia).
 */
export function toDateInputValue(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

/** Hoje em Brasília, como mínimo do <input type="date">. */
export function todayInputValue(): string {
  return toDateInputValue(new Date().toISOString());
}
