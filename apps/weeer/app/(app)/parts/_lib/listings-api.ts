// ── B2 listing_meta API client — W-R1 Wave 2 (Ruling: wire on listingMetaId) ──
//
// Consume /api/v1/listings/{id}/* บน listing_meta.listing_id (= catalog listingMetaId)
//   - get         → GET  /listings/{id}                  (bare object)
//   - transition  → POST /listings/{id}/transition       (D59/D83 state machine)
//   - reviews     → GET/POST /listings/{id}/reviews       (envelope { items })  [D86]
//   - questions   → GET/POST /listings/{id}/questions     (envelope { isClosed, items }) [GR-5]
//
// Contract source (verified, ห้ามเดา): backend c313ed3 — camelCase FINAL
//   listings.ts / listing-reviews.ts / listing-questions.ts (READ-ONLY — guardrail ⑥)
// error envelope: { error: { code, message } }

// TODO: REMOVE BEFORE PROD — dev auth bypass
import { getDevTestToken } from "../../../../lib/dev-auth";

const BASE = "/api/v1";

async function listingsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // TODO: REMOVE BEFORE PROD — dev auth bypass
  const token =
    process.env.NODE_ENV === "development" ? await getDevTestToken() : null;

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    const msg =
      (j as { error?: { message?: string } }).error?.message ??
      `Listings API error ${res.status}`;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

// ── State machine (mirror ของ backend lib/listing-state.ts — D59/D83) ─────────
export const LISTING_STATES = [
  "draft", "announced", "receiving_offers", "offer_selected", "buyer_confirmed",
  "in_progress", "delivered", "inspection_period", "completed", "cancelled", "disputed",
] as const;
export type ListingState = (typeof LISTING_STATES)[number];

/** verbatim mirror ของ TRANSITIONS ใน backend listing-state.ts (c313ed3) */
export const LISTING_TRANSITIONS: Record<ListingState, ListingState[]> = {
  draft: ["announced", "cancelled"],
  announced: ["receiving_offers", "cancelled"],
  receiving_offers: ["offer_selected", "cancelled"],
  offer_selected: ["buyer_confirmed", "cancelled", "disputed"],
  buyer_confirmed: ["in_progress", "cancelled", "disputed"],
  in_progress: ["delivered", "disputed", "cancelled"],
  delivered: ["inspection_period", "disputed", "cancelled"],
  inspection_period: ["completed", "disputed"],
  completed: [],
  cancelled: [],
  disputed: ["completed", "cancelled"],
};

export const LISTING_STATE_LABEL: Record<ListingState, string> = {
  draft: "ร่าง", announced: "ประกาศแล้ว", receiving_offers: "รับข้อเสนอ",
  offer_selected: "เลือกข้อเสนอแล้ว", buyer_confirmed: "ผู้ซื้อยืนยัน",
  in_progress: "กำลังดำเนินการ", delivered: "จัดส่งแล้ว", inspection_period: "ช่วงตรวจรับ",
  completed: "เสร็จสิ้น", cancelled: "ยกเลิก", disputed: "พิพาท",
};

// ── DTOs (camelCase — ตรง backend) ────────────────────────────────────────────
export interface ListingMetaDto {
  listingId: string;
  listingType: string;
  state: ListingState;
  ownerId: string;
  tambonId: number | null;
  viewCount: number;
  offerCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewReply {
  id: string;
  replierUserId: string;
  body: string;
  createdAt: string;
}
export interface Review {
  id: string;
  reviewerUserId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  replies: ReviewReply[];
}

export interface QuestionReply {
  id: string;
  replierUserId: string;
  body: string;
  createdAt: string;
}
export interface Question {
  id: string;
  askerUserId: string;
  body: string;
  isClosed: boolean;
  isVisible: boolean;
  createdAt: string;
  replies: QuestionReply[];
}

export const listingsApi = {
  get: (id: string) => listingsFetch<ListingMetaDto>(`/listings/${id}`),

  /** D83 transition → { listingId, state } */
  transition: (
    id: string,
    body: { to: ListingState; buyerUserId?: string; pointAmount?: number },
  ) =>
    listingsFetch<{ listingId: string; state: ListingState }>(
      `/listings/${id}/transition`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  // ── Reviews (D86) ───────────────────────────────────────────────────────────
  listReviews: (id: string) =>
    listingsFetch<{ items: Review[] }>(`/listings/${id}/reviews`),
  createReview: (id: string, body: { rating: number; comment?: string }) =>
    listingsFetch<{ id: string; rating: number }>(`/listings/${id}/reviews`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  replyReview: (id: string, rid: string, body: { body: string }) =>
    listingsFetch<{ id: string; body: string }>(
      `/listings/${id}/reviews/${rid}/reply`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  // ── Questions (GR-5) ──────────────────────────────────────────────────────────
  listQuestions: (id: string) =>
    listingsFetch<{ isClosed: boolean; items: Question[] }>(
      `/listings/${id}/questions`,
    ),
  createQuestion: (id: string, body: { body: string }) =>
    listingsFetch<{ id: string; body: string }>(`/listings/${id}/questions`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  replyQuestion: (id: string, qid: string, body: { body: string }) =>
    listingsFetch<{ id: string; body: string }>(
      `/listings/${id}/questions/${qid}/reply`,
      { method: "POST", body: JSON.stringify(body) },
    ),
};
