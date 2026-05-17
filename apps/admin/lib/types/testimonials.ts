// ⚠️ STUB MIRROR from Backend Schema Plan (363813ec-7277-81dc-ac96-fd41d4fcdabf) Sec 2
// Sub-2 D-4 Testimonials — mirrors packages/shared/dal/testimonial.types.ts (Backend-owned)
// ห้าม import โดยตรงจาก packages/shared/dal/ (Lesson #33) — ห้ามสร้าง type นอก Schema Plan (Lesson #34)
// T+2: switch to real import หลัง Backend merge
// OBS-1 RESOLVED: status enum ('draft'|'published') แทน isActive (Advisor Gen 49)

export type TestimonialStatus = 'draft' | 'published'

export interface TestimonialDto {
  id: string // UUID
  name: string // ชื่อผู้รีวิว
  role: string // บทบาท / ที่มา เช่น "ลูกค้า WeeeU — กรุงเทพฯ"
  stars: string // "★★★★★" (mapped from starsRating 1-5 ใน service layer)
  starsRating: number // 1–5 (raw numeric — FE ใช้ sort/filter)
  text: string // ข้อความรีวิว
  avatar: string // emoji หรือ image URL
  sortOrder: number // ลำดับการแสดงผล (default 0)
  status: TestimonialStatus // OBS-1
  publishedAt: string | null // ISO-8601 — null = ยังไม่ publish
  createdAt: string // ISO-8601
  updatedAt: string // ISO-8601
}

export interface CreateTestimonialInput {
  name: string
  role: string
  starsRating: number // 1–5
  text: string
  avatar: string
  sortOrder?: number // default 0
  status?: TestimonialStatus // default 'draft'
}

export interface UpdateTestimonialInput {
  name?: string
  role?: string
  starsRating?: number
  text?: string
  avatar?: string
  sortOrder?: number
  status?: TestimonialStatus
}
