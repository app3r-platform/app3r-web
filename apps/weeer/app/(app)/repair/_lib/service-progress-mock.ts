// ── Repair Service Progress Mock Data — D79 (Phase C-5) ──────────────────────

import type { RepairServiceProgress } from "./service-progress";

export const REPAIR_PROGRESS_MOCK: RepairServiceProgress[] = [
  {
    job_id: "RJ-001",
    current_stage: "awaiting_decision",
    updated_at: "2026-05-11T09:30:00Z",
    entries: [
      {
        stage: "assigned",
        timestamp: "2026-05-11T07:00:00Z",
        actor: "weeer",
        actor_name: "ร้าน ABC",
        notes: "มอบหมายให้นายวิทยา",
      },
      {
        stage: "traveling",
        timestamp: "2026-05-11T07:45:00Z",
        actor: "weeet",
        actor_name: "นายวิทยา ซ่อมเก่ง",
      },
      {
        stage: "arrived",
        timestamp: "2026-05-11T08:30:00Z",
        actor: "weeet",
        actor_name: "นายวิทยา ซ่อมเก่ง",
        media: ["https://placehold.co/400x300?text=Arrival+Photo"],
      },
      {
        stage: "awaiting_entry",
        timestamp: "2026-05-11T08:32:00Z",
        actor: "system",
      },
      {
        stage: "inspecting",
        timestamp: "2026-05-11T08:40:00Z",
        actor: "weeet",
        actor_name: "นายวิทยา ซ่อมเก่ง",
        media: [
          "https://placehold.co/400x300?text=Pre-Inspect+1",
          "https://placehold.co/400x300?text=Pre-Inspect+2",
        ],
      },
      {
        stage: "awaiting_decision",
        timestamp: "2026-05-11T09:30:00Z",
        actor: "weeet",
        actor_name: "นายวิทยา ซ่อมเก่ง",
        notes: "คอมเพรสเซอร์เสีย ต้องเปลี่ยนอะไหล่ — ราคาเพิ่มขึ้น 1,500 pts",
      },
    ],
  },
  {
    job_id: "RJ-002",
    current_stage: "in_progress",
    updated_at: "2026-05-11T10:15:00Z",
    entries: [
      {
        stage: "assigned",
        timestamp: "2026-05-11T08:00:00Z",
        actor: "weeer",
        actor_name: "ร้าน ABC",
      },
      {
        stage: "traveling",
        timestamp: "2026-05-11T08:30:00Z",
        actor: "weeet",
        actor_name: "นายสมชาย ช่างดี",
      },
      {
        stage: "arrived",
        timestamp: "2026-05-11T09:10:00Z",
        actor: "weeet",
        actor_name: "นายสมชาย ช่างดี",
      },
      {
        stage: "awaiting_entry",
        timestamp: "2026-05-11T09:12:00Z",
        actor: "system",
      },
      {
        stage: "inspecting",
        timestamp: "2026-05-11T09:20:00Z",
        actor: "weeet",
        actor_name: "นายสมชาย ช่างดี",
      },
      {
        stage: "awaiting_decision",
        timestamp: "2026-05-11T09:50:00Z",
        actor: "weeet",
        actor_name: "นายสมชาย ช่างดี",
        notes: "ซ่อมได้ตามเงื่อนไขเดิม — B1.1",
      },
      {
        stage: "in_progress",
        timestamp: "2026-05-11T10:15:00Z",
        actor: "weeer",
        actor_name: "ร้าน ABC",
        notes: "อนุมัติ — B1.1",
      },
    ],
  },
  {
    job_id: "RJ-003",
    current_stage: "closed",
    updated_at: "2026-05-10T16:00:00Z",
    entries: [
      {
        stage: "assigned",
        timestamp: "2026-05-10T09:00:00Z",
        actor: "weeer",
        actor_name: "ร้าน ABC",
      },
      {
        stage: "traveling",
        timestamp: "2026-05-10T09:20:00Z",
        actor: "weeet",
        actor_name: "นายวิทยา ซ่อมเก่ง",
      },
      {
        stage: "arrived",
        timestamp: "2026-05-10T10:00:00Z",
        actor: "weeet",
        actor_name: "นายวิทยา ซ่อมเก่ง",
      },
      {
        stage: "awaiting_entry",
        timestamp: "2026-05-10T10:02:00Z",
        actor: "system",
      },
      {
        stage: "inspecting",
        timestamp: "2026-05-10T10:10:00Z",
        actor: "weeet",
        actor_name: "นายวิทยา ซ่อมเก่ง",
      },
      {
        stage: "awaiting_decision",
        timestamp: "2026-05-10T10:45:00Z",
        actor: "weeet",
        actor_name: "นายวิทยา ซ่อมเก่ง",
        notes: "B1.1 — ซ่อมได้ตามเงื่อนไขเดิม",
      },
      {
        stage: "in_progress",
        timestamp: "2026-05-10T11:00:00Z",
        actor: "weeer",
        actor_name: "ร้าน ABC",
      },
      {
        stage: "completed",
        timestamp: "2026-05-10T14:30:00Z",
        actor: "weeet",
        actor_name: "นายวิทยา ซ่อมเก่ง",
        media: [
          "https://placehold.co/400x300?text=Post-Repair+1",
          "https://placehold.co/400x300?text=Post-Repair+2",
        ],
        notes: "ซ่อมเสร็จเรียบร้อย",
      },
      {
        stage: "awaiting_review",
        timestamp: "2026-05-10T14:35:00Z",
        actor: "system",
      },
      {
        stage: "closed",
        timestamp: "2026-05-10T16:00:00Z",
        actor: "system",
        notes: "WeeeU ตรวจรับแล้ว — งานปิด",
      },
    ],
  },
];

/** Look up mock progress by job_id */
export function getMockRepairProgress(jobId: string): RepairServiceProgress | undefined {
  return REPAIR_PROGRESS_MOCK.find((p) => p.job_id === jobId);
}
