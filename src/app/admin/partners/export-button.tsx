"use client";

import { ExportCsvButton } from "@/components/export-csv-button";
import type { CsvColumn } from "@/lib/csv";
import type { PartnerProfile } from "@/lib/types";
import { formatCep } from "@/lib/address";

const columns: CsvColumn<PartnerProfile>[] = [
  { header: "Nome", accessor: (p) => p.full_name ?? "" },
  { header: "E-mail", accessor: (p) => p.email },
  { header: "Empresa", accessor: (p) => p.company_name ?? "" },
  { header: "Logradouro", accessor: (p) => p.address_street ?? "" },
  { header: "Número", accessor: (p) => p.address_number ?? "" },
  { header: "Complemento", accessor: (p) => p.address_complement ?? "" },
  { header: "Bairro", accessor: (p) => p.address_neighborhood ?? "" },
  { header: "Cidade", accessor: (p) => p.address_city ?? "" },
  { header: "UF", accessor: (p) => p.address_state ?? "" },
  {
    header: "CEP",
    accessor: (p) => (p.address_cep ? formatCep(p.address_cep) : ""),
  },
  {
    header: "Convidado em",
    accessor: (p) => new Date(p.created_at).toLocaleDateString("pt-BR"),
  },
];

export function PartnersExportButton({ rows }: { rows: PartnerProfile[] }) {
  return <ExportCsvButton filename="parceiros.csv" rows={rows} columns={columns} />;
}
