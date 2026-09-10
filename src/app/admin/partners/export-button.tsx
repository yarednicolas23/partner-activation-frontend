"use client";

import { ExportCsvButton } from "@/components/export-csv-button";
import type { CsvColumn } from "@/lib/csv";
import type { PartnerProfile } from "@/lib/types";

const columns: CsvColumn<PartnerProfile>[] = [
  { header: "Nome", accessor: (p) => p.full_name ?? "" },
  { header: "E-mail", accessor: (p) => p.email },
  { header: "Empresa", accessor: (p) => p.company_name ?? "" },
  {
    header: "Convidado em",
    accessor: (p) => new Date(p.created_at).toLocaleDateString("pt-BR"),
  },
];

export function PartnersExportButton({ rows }: { rows: PartnerProfile[] }) {
  return <ExportCsvButton filename="parceiros.csv" rows={rows} columns={columns} />;
}
