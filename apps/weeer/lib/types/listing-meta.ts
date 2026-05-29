/**
 * W-Round-1 Wave 2 (WeeeR) — listing_meta + reviews + questions wire contract
 *
 * Source contract: 36f813ec-7277-81d8-a50b-c012f1ced65f (B2 listing_meta)
 * Wire convention (LOCKED · Ruling 1E/1F): snake_case fields + { results, count } list envelope.
 *   NOTE: differs from apps/app3r reference (camelCase + { items }) — app3r predates Ruling 1E/1F.
 *   apps/app3r/components/listings/* used as STRUCTURAL reference only.
 *
 * GR-8 visibility rules (applied server-side by Backend):
 *   - view_count: always public
 *   - offer_count: null when listing is in `matched` state and viewer is an outsider
 *
 * Contract-first (Ruling 3 = A): these DTOs describe the REAL routes Backend Part1 will
 * publish (GET /api/v1/listings/{id}, .../reviews, .../questions). No mock / no stub —
 * the API client consumes the live routes; until they land, fetch fails soft to null.
 */

export type ListingType = "repair" | "maintain" | "resell" | "scrap" | "parts";

export type ListingState =
  | "draft"
  | "published"
  | "has_offer"
  | "matched"
  | "completed"
  | "cancelled";

/** GET /api/v1/listings/{id} */
export interface ListingMeta {
  listing_id: string;
  listing_type: ListingType;
  state: ListingState;
  owner_id: string;
  tambon_id: number | null;
  view_count: number;
  offer_count: number | null; // GR-8 — null = hidden (matched + outsider)
  created_at: string;
  updated_at: string;
}

export interface ReviewReply {
  id: string;
  replier_user_id: string;
  body: string;
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_user_id: string;
  rating: number; // 1-5
  comment: string | null;
  created_at: string;
  replies: ReviewReply[];
}

/** GET /api/v1/listings/{id}/reviews (D86) */
export interface ReviewsList {
  results: Review[];
  count: number;
}

export interface QuestionReply {
  id: string;
  replier_user_id: string;
  body: string;
  created_at: string;
}

export interface Question {
  id: string;
  asker_user_id: string;
  body: string;
  is_closed: boolean;
  is_visible: boolean;
  created_at: string;
  replies: QuestionReply[];
}

/** GET /api/v1/listings/{id}/questions (GR-5 — anonymous view returns is_visible=true only) */
export interface QuestionsList {
  results: Question[];
  count: number;
  is_closed: boolean;
}

/** GET /api/v1/locations/tambons/{id} */
export interface TambonDetail {
  id: number;
  amphoe_id: number;
  name_th: string;
  name_en: string | null;
  zipcode: string | null;
  lat: number | null;
  lng: number | null;
}
