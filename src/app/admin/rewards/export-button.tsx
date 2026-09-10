"use client";

import { ExportCsvButton } from "@/components/export-csv-button";
import type { CsvColumn } from "@/lib/csv";
import type { RedemptionQueueItem } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  fulfilled: "Entregue",
};

const columns: CsvColumn<RedemptionQueueItem>[] = [
  {
    header: "Parceiro",
    accessor: (r) => r.partner.full_name ?? r.partner.email,
  },
  { header: "E-mail", accessor: (r) => r.partner.email },
  { header: "Reward", accessor: (r) => r.reward.title },
  { header: "Status", accessor: (r) => STATUS_LABEL[r.status] ?? r.status },
  {
    header: "Solicitado em",
    accessor: (r) => new Date(r.requested_at).toLocaleString("pt-BR"),
  },
  {
    header: "Revisado em",
    accessor: (r) =>
      r.reviewed_at ? new Date(r.reviewed_at).toLocaleString("pt-BR") : "",
  },
  { header: "Nota", accessor: (r) => r.admin_note ?? "" },
];

export function RedemptionsExportButton({ rows }: { rows: RedemptionQueueItem[] }) {
  return <ExportCsvButton filename="resgates.csv" rows={rows} columns={columns} />;
}
