import { apiFetch } from "@/lib/api-client";

/**
 * reviews.ts — D86 listing reviews client (W-Round-1 Wave 2)
 *
 * ยึด route จริงของ Hono backend (ไม่มี trailing slash):
 *   GET  /api/v1/listings/{id}/reviews
 *   POST /api/v1/listings/{id}/reviews                → { rating: 1-5, comment? }
 *   POST /api/v1/listings/{id}/reviews/{rid}/reply    → { body }  (owner เท่านั้น)
 */

export interface ListingReviewReply {
  id: string;
  replierUserId: string;
  body: string;
  createdAt: string;
}

export interface ListingReview {
  id: string;
  reviewerUserId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  replies: ListingReviewReply[];
}

export const reviewsApi = {
  list: (listingId: string) =>
    apiFetch(`/api/v1/listings/${listingId}/reviews`).then((r) => r.json()) as Promise<{
      items: ListingReview[];
    }>,

  create: (listingId: string, body: { rating: number; comment?: string }) =>
    apiFetch(`/api/v1/listings/${listingId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  reply: (listingId: string, reviewId: string, body: string) =>
    apiFetch(`/api/v1/listings/${listingId}/reviews/${reviewId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    }),
};
