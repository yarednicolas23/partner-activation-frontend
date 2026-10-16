"use client";

import { useEffect, useState } from "react";
import type { RedemptionEvent, RedemptionStatus } from "@/lib/types";

/**
 * Carrega o histórico de uma solicitação de resgate. Recarrega quando o status
 * muda (ex.: o admin revisou com o painel aberto): um resultado de outro
 * url/status conta como "carregando".
 */
export function useRedemptionHistory(url: string, status: RedemptionStatus) {
  const requestKey = `${url}:${status}`;
  const [result, setResult] = useState<{
    key: string;
    events: RedemptionEvent[] | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = (await res.json()) as RedemptionEvent[];
        if (!cancelled) setResult({ key: requestKey, events: data });
      })
      .catch(() => {
        if (!cancelled) setResult({ key: requestKey, events: null });
      });
    return () => {
      cancelled = true;
    };
  }, [url, requestKey]);

  const current = result?.key === requestKey ? result : null;
  return {
    events: current?.events ?? null,
    error: current !== null && current.events === null,
  };
}
