// Espejo de backend/src/partners/partner-profile.interface.ts
export interface PartnerProfile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: "partner" | "admin";
  phone: string | null;
  address_cep: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  recipient_name: string | null;
  phone: string | null;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
}

// Espejo de backend/src/milestones/milestone.interfaces.ts
export type EvidenceType = "none" | "text" | "email" | "url" | "file" | "choice";
export type EvidenceInputType = "text" | "email" | "url" | "file";

// Opção de uma missão "choice" (ex.: canal de divulgação, ação de demanda).
export interface EvidenceOption {
  key: string;
  label: string;
  evidence_type: EvidenceInputType;
  evidence_label: string;
}
export type EvidenceStatus = "pending" | "approved" | "rejected";

export interface MilestoneTask {
  id: string;
  milestone_id: string;
  order_index: number;
  title: string;
  description: string | null;
  evidence_type: EvidenceType;
  // Texto de "Comprovação exigida".
  evidence_label: string | null;
  evidence_options: EvidenceOption[] | null;
}

export interface TaskEvidence {
  id: string;
  task_id: string;
  partner_id: string;
  text_value: string | null;
  file_path: string | null;
  option_key: string | null;
  status: EvidenceStatus;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
}

export interface TaskWithEvidence extends MilestoneTask {
  evidence: TaskEvidence | null;
}

export interface MilestoneView {
  id: string;
  order_index: number;
  locked: boolean;
  title?: string;
  description?: string;
  tasks?: TaskWithEvidence[];
}

export interface EvidenceQueueItem extends TaskEvidence {
  task: MilestoneTask;
  milestone: { id: string; order_index: number; title: string; description: string | null };
  partner: { id: string; email: string; full_name: string | null };
}

// Espejo de backend/src/rewards/reward.interfaces.ts
export type RewardType = "physical" | "digital" | "mixed";
export type RedemptionStatus = "pending" | "approved" | "rejected" | "fulfilled";

export interface Reward {
  id: string;
  title: string;
  description: string | null;
  type: RewardType;
  milestone_id: string;
  stock: number | null;
  // Con image_key, image_url es la URL firmada de S3 (la resuelve el backend).
  image_url: string | null;
  image_key: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RewardWithMilestone extends Reward {
  milestone: { id: string; order_index: number; title: string };
}

export interface RewardRedemption {
  id: string;
  reward_id: string;
  partner_id: string;
  status: RedemptionStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  requested_at: string;
  shipping_address: ShippingAddress | null;
}

// Espejo de RedemptionEvent en backend/src/rewards/reward.interfaces.ts
export interface RedemptionEvent {
  id: string;
  status: RedemptionStatus;
  note: string | null;
  created_at: string;
  actor: { full_name: string | null; email: string; role: string } | null;
}

export interface RedemptionQueueItem extends RewardRedemption {
  reward: Reward;
  partner: { id: string; email: string; full_name: string | null };
}

// Espejo de backend/src/stats/stats.interfaces.ts
export interface WeeklyCount {
  week: string;
  count: number;
}

export interface MilestoneDistributionEntry {
  milestoneId: string;
  orderIndex: number;
  title: string;
  partnerCount: number;
}

export interface AdminStats {
  totalPartners: number;
  activatedPartners: number;
  activationRate: number;
  avgMilestoneCompletionRate: number;
  partnersCompletedProgram: number;
  avgTimeToFirstSaleDays: number | null;
  partnersRegisteredByWeek: WeeklyCount[];
  partnersByMilestone: MilestoneDistributionEntry[];
}

// Rótulo da opção escolhida numa missão "choice" (null fora delas).
export function evidenceOptionLabel(task: MilestoneTask, optionKey: string | null): string | null {
  if (!optionKey) return null;
  return task.evidence_options?.find((o) => o.key === optionKey)?.label ?? optionKey;
}

export type StageHistoryStatus = "locked" | "not_started" | "in_progress" | "completed";

/** Histórico por etapa de um parceiro (admin) — GET /milestones/admin/partners/:id/stages. */
export interface StageHistory {
  id: string;
  order_index: number;
  title: string;
  status: StageHistoryStatus;
  started_at: string | null;
  completed_at: string | null;
  tasks: {
    id: string;
    order_index: number;
    title: string;
    evidence_type: EvidenceType;
    evidence: Pick<
      TaskEvidence,
      "id" | "status" | "submitted_at" | "reviewed_at" | "review_note"
    > | null;
  }[];
}

/** Acessos do parceiro (admin) — GET /partners/:id/access. */
export interface PartnerAccess {
  invited_at: string;
  first_sign_in_at: string | null;
  last_sign_in_at: string | null;
  reminded_at: string | null;
}

export type ExtensionStatus = "pending" | "approved" | "rejected";

/** Origem do prazo: prazo geral no convite, ajuste do admin ou prorrogação. */
export type DeadlineSource = "program" | "admin" | "extension";

/** Solicitação de prorrogação do prazo do programa. */
export interface ExtensionRequest {
  id: string;
  partner_id: string;
  status: ExtensionStatus;
  reason: string | null;
  previous_deadline_at: string;
  new_deadline_at: string | null;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  requested_at: string;
}

/**
 * Prazo do programa resolvido pelo backend — GET /deadlines/me (parceiro) e
 * GET /deadlines/admin/partners/:id (admin).
 */
export interface ProgramDeadline {
  partner_id: string;
  started_at: string;
  deadline_at: string;
  source: DeadlineSource;
  note: string | null;
  updated_at: string | null;
  expired: boolean;
  journey_completed: boolean;
  can_request_extension: boolean;
  extension_months: number;
  suggested_extension_deadline_at: string | null;
  /** Mais recente primeiro. */
  requests: ExtensionRequest[];
}

/** Fila de prorrogações do admin — GET /deadlines/admin/extension-requests. */
export interface ExtensionQueueItem extends ExtensionRequest {
  partner: Pick<PartnerProfile, "id" | "email" | "full_name" | "company_name">;
  suggested_deadline_at: string;
}

/** Prazo geral do programa — GET/PUT /deadlines/admin/settings. */
export interface ProgramSettings {
  duration_months: number;
  extension_months: number;
  updated_by: string | null;
  updated_at: string | null;
}

/** Linha da tabela de prazos do Timeline — GET /deadlines/admin/partners. */
export interface TimelineRow {
  partner: Pick<PartnerProfile, "id" | "email" | "full_name" | "company_name">;
  started_at: string;
  deadline_at: string;
  source: DeadlineSource;
  expired: boolean;
  completed_stages: number;
  total_stages: number;
  pending_request_id: string | null;
}
