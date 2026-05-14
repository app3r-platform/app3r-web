/**
 * lib/types/service-progress.ts — WeeeU local mirror
 *
 * ★ SOURCE-OF-TRUTH: apps/backend/src/types/service-progress.ts
 *   (merged: Sub-CMD-5, main HEAD 9aa64a1)
 *
 * กฎ (Carry-over F1 Ruling: 360813ec-7277-8187-a1b4-f38a11cb8539):
 *   - ห้าม edit โดยตรง — ต้อง update Backend ก่อน แล้ว sync ที่นี่
 *   - ห้ามเพิ่ม field ที่ Backend ไม่มี (ahead-of-spec = F1 Warning ซ้ำ)
 *   - ถ้า Backend เพิ่ม field ใหม่ → sync พร้อม PR ที่ Backend merge แล้วเท่านั้น
 *
 * DEPRECATED (ลบแล้ว): MainStage, ServiceType, OnSiteSubStage, PickupSubStage,
 * WalkInSubStage, ParcelSubStage, ProgressStepMedia, ProgressStep, ServiceProgress
 * → ถูกแทนที่ด้วย Backend types จาก Sub-CMD-5
 */

// ── Legacy client-side types (jobs/ flow — localStorage-based) ───────────────
// ใช้ใน: app/(app)/jobs/, lib/dal/, lib/utils/service-progress-sync
// หมายเหตุ: ยังอยู่ใน codebase — F1 Ruling ไม่ได้สั่งลบ (เป็น client model ไม่ใช่ Backend stub)
// TODO: Sub-6 — migrate jobs/ flow ไปใช้ Backend API เมื่อ spec พร้อม

export type MainStage = 'posted' | 'offer_accepted' | 'in_progress' | 'completed' | 'reviewed';
export type ServiceType = 'on_site' | 'pickup' | 'walk_in' | 'parcel';

export interface ProgressStepMedia {
  images: Array<{
    id: string;
    url: string;
    caption: string;
    uploaded_by: string;
    uploaded_at: string;
  }>;
  videos: Array<{
    id: string;
    url: string;
    caption?: string;
    duration_seconds?: number;
    uploaded_by?: string;
    uploaded_at?: string;
  }>;
}

export interface ProgressStep {
  stage: MainStage;
  subStage?: string;
  enteredAt: string;
  exitedAt?: string;
  recordedBy: { role: string; userId: string; name: string };
  notes: string;
  media: ProgressStepMedia;
}

export interface ServiceProgress {
  jobId: string;
  serviceType: ServiceType;
  currentStage: MainStage;
  currentSubStage?: string;
  createdAt: string;
  updatedAt: string;
  history: ProgressStep[];
  review?: {
    rating: 1 | 2 | 3 | 4 | 5;
    comment: string;
    submittedAt: string;
  };
}

// ── Enum strings — mirror of Backend ServiceProgressStatus ───────────────────
export type ServiceProgressStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled'

// ── Status → Thai label (สำหรับ UI display) ──────────────────────────────────
export const SERVICE_PROGRESS_STATUS_LABEL: Record<ServiceProgressStatus, string> = {
  pending:     'รอดำเนินการ',
  accepted:    'รับงานแล้ว',
  in_progress: 'กำลังดำเนินการ',
  paused:      'หยุดพักชั่วคราว',
  completed:   'เสร็จสิ้น',
  cancelled:   'ยกเลิก',
}

// ── API Response DTO — mirror of Backend ServiceProgressDto ───────────────────
export interface ServiceProgressDto {
  id: string
  serviceId: string
  status: ServiceProgressStatus
  progressPercent: number       // 0–100
  note: string | null
  photoR2Key: string | null     // R2 key (ไม่ใช่ URL — ใช้ presign endpoint)
  updatedBy: string             // userId ของ WeeeT ที่ update
  createdAt: string             // ISO-8601
}

// ── WS event payload — mirror of Backend ProgressUpdatedPayload ───────────────
export interface ProgressUpdatedPayload {
  serviceId: string
  progress: ServiceProgressDto
}

// ── Timeline response — mirror of Backend ServiceProgressTimelineDto ──────────
export interface ServiceProgressTimelineDto {
  serviceId: string
  entries: ServiceProgressDto[] // เรียงจากเก่าไปใหม่ (ASC created_at)
  latestStatus: ServiceProgressStatus | null
  latestPercent: number         // 0–100, 0 ถ้าไม่มี entry
}
