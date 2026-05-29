import { apiFetch } from "@/lib/api-client";

/**
 * moderation.ts — D82 report/moderation client (W-Round-1 Wave 2)
 *
 * ยึด route จริงของ Hono backend:
 *   POST /api/v1/admin/moderation   → submit content เข้า moderation queue
 *
 * D82 policy: mediaType=text → auto_approved · image|video → pending
 * ผู้ใช้ทั่วไป submit/report ได้ (เฉพาะ approve/reject ที่จำกัด admin)
 */

export type ModerationContentType = "review" | "question" | "reply" | "listing" | "ad";
export type ModerationMediaType = "text" | "image" | "video";

export const moderationApi = {
  // รายงาน (report) เนื้อหา/ประกาศที่ไม่เหมาะสม เข้า moderation queue
  report: (body: {
    contentType: ModerationContentType;
    contentRefId: string;
    listingId?: string;
    mediaType?: ModerationMediaType;
  }) =>
    apiFetch(`/api/v1/admin/moderation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
};
