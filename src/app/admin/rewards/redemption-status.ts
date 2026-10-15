import type { RedemptionStatus } from "@/lib/types";

// Compartilhado entre a página (server) e a fila (client): um módulo "use
// client" não pode exportar valores simples para um server component.

export const STATUS_LABEL: Record<RedemptionStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  fulfilled: "Entregue",
};

export const STATUS_CLASS: Record<RedemptionStatus, string> = {
  pending: "bg-pastel-yellow-bg text-pastel-yellow-text",
  approved: "bg-pastel-green-bg text-pastel-green-text",
  rejected: "bg-pastel-red-bg text-pastel-red-text",
  fulfilled: "bg-brand-soft text-ink",
};

/** Ordem do resumo por status: do que exige ação ao que está encerrado. */
export const STATUS_ORDER: RedemptionStatus[] = [
  "pending",
  "approved",
  "fulfilled",
  "rejected",
];
