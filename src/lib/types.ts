// Espejo de backend/src/partners/partner-profile.interface.ts
export interface PartnerProfile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: "partner" | "admin";
  created_at: string;
  updated_at: string;
}

// Espejo de backend/src/milestones/milestone.interfaces.ts
export type EvidenceType = "text" | "file" | "none";
export type EvidenceStatus = "pending" | "approved" | "rejected";

export interface MilestoneTask {
  id: string;
  milestone_id: string;
  order_index: number;
  title: string;
  description: string | null;
  evidence_type: EvidenceType;
}

export interface TaskEvidence {
  id: string;
  task_id: string;
  partner_id: string;
  text_value: string | null;
  file_path: string | null;
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
}

export interface RedemptionQueueItem extends RewardRedemption {
  reward: Reward;
  partner: { id: string; email: string; full_name: string | null };
}
