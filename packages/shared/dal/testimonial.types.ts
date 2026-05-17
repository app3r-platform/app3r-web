/**
 * testimonial.types.ts — Sub-2 D-4: Testimonials API
 *
 * ★ SOURCE-OF-TRUTH: apps/backend/src/types/testimonial.ts
 *   (Lesson #34: FE chats import จากไฟล์นี้เท่านั้น — ห้าม import จาก backend โดยตรง)
 *
 * Master CMD: 363813ec-7277-81ae-94e8-e0e79b492eb6
 * Schema Plan: 363813ec-7277-81dc-ac96-fd41d4fcdabf (T+0.6 APPROVED)
 * OBS-1: isActive → status enum (Advisor Gen 49 อนุมัติ)
 */

// ── Status enum ───────────────────────────────────────────────────────────────
export type TestimonialStatus = 'draft' | 'published'

// ── Main DTO ──────────────────────────────────────────────────────────────────
export interface TestimonialDto {
  id: string
  name: string
  role: string
  stars: string           // "★★★★★" (mapped from starsRating 1–5)
  starsRating: number     // 1–5 raw numeric
  text: string
  avatar: string
  sortOrder: number
  status: TestimonialStatus
  publishedAt: string | null   // ISO-8601; null = ยังไม่ publish
  createdAt: string
  updatedAt: string
}

// ── Input DTOs ────────────────────────────────────────────────────────────────
export interface CreateTestimonialInput {
  name: string
  role: string
  starsRating: number     // 1–5
  text: string
  avatar: string
  sortOrder?: number      // default 0
  status?: TestimonialStatus  // default 'draft'
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
