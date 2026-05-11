// ── Maintain Service Progress Types — D79 (Phase C-5) ────────────────────────

import type { MaintainStatus } from "./types";

/** Each milestone stage in a maintain job lifecycle */
export interface MaintainProgressStage {
  key: MaintainStatus;
  label: string;
  icon: string;
  description: string;
}

/** One log entry recorded when a stage is reached */
export interface MaintainProgressEntry {
  stage: MaintainStatus;
  timestamp: string;            // ISO datetime
  actor: "weeet" | "weeer" | "system";
  actor_name?: string;
  notes?: string;
  media?: string[];             // photo/video URLs
}

/** Full progress tracker for a single MaintainJob */
export interface MaintainServiceProgress {
  job_id: string;
  current_stage: MaintainStatus;
  entries: MaintainProgressEntry[];
  updated_at: string;
}

// ── Ordered stage pipeline (WeeeR view — maintain) ────────────────────────────

export const MAINTAIN_STAGES: MaintainProgressStage[] = [
  {
    key: "pending",
    label: "รอรับงาน",
    icon: "📋",
    description: "งานอยู่ในคิว รอมอบหมายช่าง",
  },
  {
    key: "assigned",
    label: "มอบหมายแล้ว",
    icon: "👷",
    description: "มอบหมาย WeeeT แล้ว รอออกเดินทาง",
  },
  {
    key: "departed",
    label: "ออกเดินทาง",
    icon: "🚗",
    description: "WeeeT กำลังเดินทางไปหาลูกค้า",
  },
  {
    key: "arrived",
    label: "ถึงแล้ว",
    icon: "📍",
    description: "WeeeT ถึงที่หมายแล้ว",
  },
  {
    key: "in_progress",
    label: "กำลังล้าง",
    icon: "🫧",
    description: "WeeeT กำลังให้บริการล้างเครื่อง",
  },
  {
    key: "completed",
    label: "เสร็จแล้ว",
    icon: "✅",
    description: "งานล้างเสร็จสมบูรณ์",
  },
];

/** Stages where WeeeR (shop) has authority to advance */
export const MAINTAIN_ADVANCEABLE_STAGES: MaintainStatus[] = [
  "pending",    // → assigned (assign WeeeT)
];

/** Map stage key → order index for progress bar */
export const MAINTAIN_STAGE_ORDER: Record<MaintainStatus, number> = {
  pending: 0,
  assigned: 1,
  departed: 2,
  arrived: 3,
  in_progress: 4,
  completed: 5,
  cancelled: -1,
};
