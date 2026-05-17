// ============================================================
// lib/testimonials-api.ts — API client สำหรับ Testimonials
// Phase D-4 Sub-2 — ISR revalidate:60 + fallback to static content
// ห้าม import จาก packages/shared/dal/ โดยตรง (Lesson #33)
// ============================================================

const REVALIDATE = 60;

// ============================================================
// Stub mirror — TestimonialDto (source: Schema Plan T+0.6)
// ============================================================

/** TestimonialDto — stub mirror ของ Backend DTO (Lesson #33) */
export interface TestimonialDto {
  id: string;
  name: string;
  role: string;
  /** "★★★★★" — mapped จาก starsRating (1-5) โดย service layer */
  stars: string;
  starsRating: number;
  text: string;
  /** emoji หรือ image URL */
  avatar: string;
  sortOrder: number;
  status: 'draft' | 'published';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Fallback content (static) — ข้อมูลเดิมจาก Testimonials.tsx
// ============================================================

/** Fallback testimonials เมื่อ API ไม่ตอบสนอง */
export const FALLBACK_TESTIMONIALS: TestimonialDto[] = [
  {
    id: 'fallback-1',
    name: 'คุณสมหญิง ว.',
    role: 'ลูกค้า WeeeU — กรุงเทพฯ',
    stars: '★★★★★',
    starsRating: 5,
    text: 'หาช่างแอร์ได้ง่ายมาก ราคาสมเหตุสมผล ช่างมาตรงเวลา ทำงานสะอาด แนะนำให้ทุกคนลองใช้ App3R',
    avatar: '👩‍🦱',
    sortOrder: 1,
    status: 'published',
    publishedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'fallback-2',
    name: 'ร้านซ่อมคุณวิชัย',
    role: 'เจ้าของร้านซ่อม WeeeR — เชียงใหม่',
    stars: '★★★★★',
    starsRating: 5,
    text: 'รับงานเพิ่มขึ้น 30% หลังเข้าร่วม App3R ระบบจัดการง่าย ลูกค้าชำระเงินผ่าน Escrow ปลอดภัยทั้งสองฝ่าย',
    avatar: '👨‍🔧',
    sortOrder: 2,
    status: 'published',
    publishedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'fallback-3',
    name: 'ช่างสมชาย ต.',
    role: 'ช่าง WeeeT — นนทบุรี',
    stars: '★★★★☆',
    starsRating: 4,
    text: 'กำหนดการงานชัดเจน มีแผนที่นำทางในแอป บันทึกผลงานง่าย เงินโอนเร็ว ไม่ต้องรอนาน',
    avatar: '👷',
    sortOrder: 3,
    status: 'published',
    publishedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'fallback-4',
    name: 'คุณประภา น.',
    role: 'ผู้ขายเครื่องใช้ไฟฟ้า WeeeU — สมุทรปราการ',
    stars: '★★★★★',
    starsRating: 5,
    text: 'ขายตู้เย็นเก่าได้ราคาดี ลงประกาศง่ายมาก มีผู้สนใจติดต่อเข้ามาภายใน 2 ชั่วโมง ปิดดีลได้วันเดียว',
    avatar: '👩‍💼',
    sortOrder: 4,
    status: 'published',
    publishedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

// ============================================================
// API fetch
// ============================================================

/**
 * ดึง TestimonialDto[] จาก GET /api/testimonials
 * - คืนเฉพาะ status='published' (Backend กรองให้แล้ว)
 * - ISR revalidate:60 วินาที
 * - fallback → FALLBACK_TESTIMONIALS เมื่อ API ล้มเหลว
 */
export async function getTestimonials(): Promise<TestimonialDto[]> {
  try {
    const res = await fetch('http://localhost:8000/api/testimonials', {
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return FALLBACK_TESTIMONIALS;
    const data: unknown = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data as TestimonialDto[];
    }
    return FALLBACK_TESTIMONIALS;
  } catch {
    return FALLBACK_TESTIMONIALS;
  }
}
