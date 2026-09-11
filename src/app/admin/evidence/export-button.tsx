"use client";

import { ExportCsvButton } from "@/components/export-csv-button";
import type { CsvColumn } from "@/lib/csv";
import type { EvidenceQueueItem } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "Em análise",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

const columns: CsvColumn<EvidenceQueueItem>[] = [
  {
    header: "Parceiro",
    accessor: (e) => e.partner.full_name ?? e.partner.email,
  },
  { header: "E-mail", accessor: (e) => e.partner.email },
  { header: "Etapa", accessor: (e) => e.milestone.title },
  { header: "Tarefa", accessor: (e) => e.task.title },
  { header: "Status", accessor: (e) => STATUS_LABEL[e.status] ?? e.status },
  {
    header: "Enviado em",
    accessor: (e) => new Date(e.submitted_at).toLocaleString("pt-BR"),
  },
  {
    header: "Revisado em",
    accessor: (e) =>
      e.reviewed_at ? new Date(e.reviewed_at).toLocaleString("pt-BR") : "",
  },
  { header: "Nota", accessor: (e) => e.review_note ?? "" },
];

export function EvidenceExportButton({ rows }: { rows: EvidenceQueueItem[] }) {
  return <ExportCsvButton filename="evidencias.csv" rows={rows} columns={columns} />;
}
