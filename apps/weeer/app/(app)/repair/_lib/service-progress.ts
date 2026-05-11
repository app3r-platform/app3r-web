// ── Repair Service Progress Types — D79 (Phase C-5) ──────────────────────────

import type { RepairJobStatus } from "./types";

/** Each milestone stage in a repair job lifecycle */
export interface RepairProgressStage {
  key: RepairJobStatus;
  label: string;
  icon: string;
  description: string;
}

/** One log entry recorded when a stage is reached */
export interface RepairProgressEntry {
  stage: RepairJobStatus;
  timestamp: string;            // ISO datetime
  actor: "weeet" | "weeer" | "system";
  actor_name?: string;
  notes?: string;
  media?: string[];             // photo/video URLs
}

/** Full progress tracker for a single RepairJob */
export interface RepairServiceProgress {
  job_id: string;
  current_stage: RepairJobStatus;
  entries: RepairProgressEntry[];
  updated_at: string;
}

// ── Ordered stage pipeline (WeeeR view — on_site) ─────────────────────────────

export const REPAIR_STAGES: RepairProgressStage[] = [
  {
    key: "assigned",
    label: "มอบหมายงาน",
    icon: "📋",
    description: "มอบหมาย WeeeT แล้ว รอออกเดินทาง",
  },
  {
    key: "traveling",
    label: "เดินทาง",
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
    key: "awaiting_entry",
    label: "รอเข้าบ้าน",
    icon: "🚪",
    description: "รอ WeeeU อนุมัติให้เข้า",
  },
  {
    key: "inspecting",
    label: "ตรวจสภาพ",
    icon: "🔍",
    description: "WeeeT กำลังตรวจสภาพอุปกรณ์",
  },
  {
    key: "awaiting_decision",
    label: "รออนุมัติร้าน",
    icon: "⚠️",
    description: "WeeeT ส่งผลตรวจ — รอร้านอนุมัติ",
  },
  {
    key: "awaiting_user",
    label: "รอ WeeeU ตัดสิน",
    icon: "👤",
    description: "รอลูกค้าตัดสินใจ",
  },
  {
    key: "in_progress",
    label: "กำลังซ่อม",
    icon: "🔧",
    description: "WeeeT กำลังดำเนินการซ่อม",
  },
  {
    key: "completed",
    label: "ซ่อมเสร็จ",
    icon: "✅",
    description: "WeeeT ซ่อมเสร็จ รอ WeeeU ตรวจรับ",
  },
  {
    key: "awaiting_review",
    label: "รอตรวจรับ",
    icon: "🧐",
    description: "WeeeU กำลังตรวจรับงาน",
  },
  {
    key: "closed",
    label: "ปิดงาน",
    icon: "🎉",
    description: "งานเสร็จสมบูรณ์ ปิดแล้ว",
  },
];

/** Stages where WeeeR (shop) has authority to advance */
export const WEEER_ADVANCEABLE_STAGES: RepairJobStatus[] = [
  "assigned",       // → traveling (assign WeeeT and dispatch)
  "awaiting_decision", // → in_progress (approve) or cancelled
];

/** Map stage key → order index for progress bar */
export const REPAIR_STAGE_ORDER: Record<RepairJobStatus, number> = {
  assigned: 0,
  traveling: 1,
  arrived: 2,
  awaiting_entry: 3,
  inspecting: 4,
  awaiting_decision: 5,
  awaiting_user: 6,
  in_progress: 7,
  completed: 8,
  awaiting_review: 9,
  closed: 10,
  cancelled: -1,
  converted_scrap: -1,
};
