// Prazo do programa: 6 meses por parceiro a partir do registro. Não há campo
// de deadline no backend ainda, então derivamos da data de criação do perfil
// em vez de inventar um valor. Usado pelo ProgressSummary e pelo ProgressFooter.
export const PROGRAM_DURATION_MONTHS = 6;

export function programDeadline(registeredAt: string): string {
  const d = new Date(registeredAt);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + PROGRAM_DURATION_MONTHS);
  // 31/08 + 6 meses vira 28/02 (último dia do mês), não 03/03.
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d.toISOString();
}
