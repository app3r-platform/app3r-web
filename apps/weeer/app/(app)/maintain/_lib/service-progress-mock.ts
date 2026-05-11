// ── Maintain Service Progress Mock Data — D79 (Phase C-5) ────────────────────

import type { MaintainServiceProgress } from "./service-progress";

export const MAINTAIN_PROGRESS_MOCK: MaintainServiceProgress[] = [
  {
    job_id: "MJ-001",
    current_stage: "in_progress",
    updated_at: "2026-05-11T10:00:00Z",
    entries: [
      {
        stage: "pending",
        timestamp: "2026-05-11T07:00:00Z",
        actor: "system",
        notes: "งานเข้าระบบ",
      },
      {
        stage: "assigned",
        timestamp: "2026-05-11T07:30:00Z",
        actor: "weeer",
        actor_name: "ร้าน ABC",
        notes: "มอบหมายให้นายวิทยา",
      },
      {
        stage: "departed",
        timestamp: "2026-05-11T08:00:00Z",
        actor: "weeet",
        actor_name: "นายวิทยา ซ่อมเก่ง",
      },
      {
        stage: "arrived",
        timestamp: "2026-05-11T09:00:00Z",
        actor: "weeet",
        actor_name: "นายวิทยา ซ่อมเก่ง",
        media: ["https://placehold.co/400x300?text=Arrived"],
      },
      {
        stage: "in_progress",
        timestamp: "2026-05-11T09:15:00Z",
        actor: "weeet",
        actor_name: "นายวิทยา ซ่อมเก่ง",
        media: [
          "https://placehold.co/400x300?text=Before+Clean",
          "https://placehold.co/400x300?text=During+Clean",
        ],
        notes: "เริ่มล้างแอร์ — deep clean",
      },
    ],
  },
  {
    job_id: "MJ-002",
    current_stage: "assigned",
    updated_at: "2026-05-11T08:00:00Z",
    entries: [
      {
        stage: "pending",
        timestamp: "2026-05-11T06:00:00Z",
        actor: "system",
      },
      {
        stage: "assigned",
        timestamp: "2026-05-11T08:00:00Z",
        actor: "weeer",
        actor_name: "ร้าน ABC",
        notes: "มอบหมายให้นายสมชาย",
      },
    ],
  },
  {
    job_id: "MJ-003",
    current_stage: "completed",
    updated_at: "2026-05-10T15:00:00Z",
    entries: [
      {
        stage: "pending",
        timestamp: "2026-05-10T08:00:00Z",
        actor: "system",
      },
      {
        stage: "assigned",
        timestamp: "2026-05-10T08:30:00Z",
        actor: "weeer",
        actor_name: "ร้าน ABC",
      },
      {
        stage: "departed",
        timestamp: "2026-05-10T09:00:00Z",
        actor: "weeet",
        actor_name: "นายสมชาย ช่างดี",
      },
      {
        stage: "arrived",
        timestamp: "2026-05-10T10:00:00Z",
        actor: "weeet",
        actor_name: "นายสมชาย ช่างดี",
      },
      {
        stage: "in_progress",
        timestamp: "2026-05-10T10:10:00Z",
        actor: "weeet",
        actor_name: "นายสมชาย ช่างดี",
        media: ["https://placehold.co/400x300?text=Before"],
      },
      {
        stage: "completed",
        timestamp: "2026-05-10T15:00:00Z",
        actor: "weeet",
        actor_name: "นายสมชาย ช่างดี",
        media: [
          "https://placehold.co/400x300?text=After+Clean+1",
          "https://placehold.co/400x300?text=After+Clean+2",
        ],
        notes: "ล้างเสร็จเรียบร้อย ส่งงาน",
      },
    ],
  },
];

/** Look up mock progress by job_id */
export function getMockMaintainProgress(jobId: string): MaintainServiceProgress | undefined {
  return MAINTAIN_PROGRESS_MOCK.find((p) => p.job_id === jobId);
}
