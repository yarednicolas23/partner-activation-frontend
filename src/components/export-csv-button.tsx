"use client";

import { downloadCsv, type CsvColumn } from "@/lib/csv";

export function ExportCsvButton<T>({
  filename,
  rows,
  columns,
}: {
  filename: string;
  rows: T[];
  columns: CsvColumn<T>[];
}) {
  return (
    <button
      type="button"
      onClick={() => downloadCsv(filename, rows, columns)}
      disabled={rows.length === 0}
      className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
    >
      <DownloadIcon />
      Exportar CSV
    </button>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M12 4v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 20h16" />
    </svg>
  );
}
