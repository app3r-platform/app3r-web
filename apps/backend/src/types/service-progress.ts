/**
 * types/service-progress.ts — Sub-CMD-5 Wave 2: Service Progress Tracker
 *
 * ★ SOURCE-OF-TRUTH (Lesson #34 / memory #26)
 *   FE chats (WeeeU, WeeeT) ต้อง import จาก Backend เท่านั้น
 *   ห้าม stub local type เต็ม — ถ้า Backend ยังไม่ merge ใช้:
 *   `@ts-expect-error // TODO: Sub-5` เป็น placeholder ชั่วคราว
 *
 * Status flow:
 *   pending → accepted → in_progress → paused → completed
 *                                              ↘ cancelled (any state)
 */

// ── Enum strings ─────────────────────────────────────────────────────────────
export type ServiceProgressStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled'

// ── API Response DTO ─────────────────────────────────────────────────────────
export interface ServiceProgressDto {
  id: string
  serviceId: string
  status: ServiceProgressStatus
  progressPercent: number        // 0–100
  note: string | null
  photoR2Key: string | null      // R2 key (ไม่ใช่ URL — ใช้ presign endpoint)
  updatedBy: string              // userId ของ WeeeT ที่ update
  createdAt: string              // ISO-8601
}

// ── WS event payload (progress:updated) ──────────────────────────────────────
export interface ProgressUpdatedPayload {
  serviceId: string
  progress: ServiceProgressDto
}

// ── Create (POST body) ───────────────────────────────────────────────────────
export interface CreateServiceProgressDto {
  serviceId: string
  status: ServiceProgressStatus
  progressPercent: number        // 0–100
  note?: string
  photoR2Key?: string
}

// ── Update (PATCH body) ──────────────────────────────────────────────────────
export interface UpdateServiceProgressDto {
  status?: ServiceProgressStatus
  progressPercent?: number
  note?: string
  photoR2Key?: string | null
}

// ── Timeline response ────────────────────────────────────────────────────────
export interface ServiceProgressTimelineDto {
  serviceId: string
  entries: ServiceProgressDto[]  // เรียงจากเก่าไปใหม่ (ASC created_at)
  latestStatus: ServiceProgressStatus | null
  latestPercent: number          // 0–100, 0 ถ้าไม่มี entry
}
