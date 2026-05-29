/**
 * W-Round-1 Wave 2 (WeeeR) — listing_meta + reviews + questions wire contract
 *
 * Source of truth = LIVE Backend routes (verified on main 9f86df9):
 *   apps/backend/src/routes/listings.ts          → GET /api/v1/listings/{id}
 *   apps/backend/src/routes/listing-reviews.ts   → GET /api/v1/listings/{id}/reviews
 *   apps/backend/src/routes/listing-questions.ts → GET /api/v1/listings/{id}/questions
 *   apps/backend/src/routes/location-master.ts   → GET /api/v1/locations/tambons/{id}
 *
 * Wire convention for these READ endpoints: **camelCase + { items }** (matches Backend + app3r).
 *   NOTE: Ruling 1E/1F (snake_case + {results,count}) applies to the BROWSE/MINE list feeds
 *   (GET /listings/browse, /listings/mine), NOT to these detail/reviews/questions reads.
 *
 * GR-8 visibility (server-side): viewCount always public; offerCount null when matched + outsider.
 */

export type ListingType = "repair" | "maintain" | "resell" | "scrap" | "parts";

export type ListingState =
  | "draft"
  | "published"
  | "has_offer"
  | "matched"
  | "completed"
  | "cancelled"
  // live-feed states emitted by Backend listing_meta (D59)
  | "announced"
  | "receiving_offers"
  | "offer_selected";

/** GET /api/v1/listings/{id} */
export interface ListingMeta {
  listingId: string;
  listingType: ListingType;
  state: ListingState;
  ownerId: string;
  tambonId: number | null;
  viewCount: number;
  offerCount: number | null; // GR-8 — null = hidden (matched + outsider)
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
  rating: number; // 1-5
  comment: string | null;
  createdAt: string;
  replies: ReviewReply[];
}

/** GET /api/v1/listings/{id}/reviews (D86) */
export interface ReviewsList {
  items: Review[];
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

/** GET /api/v1/listings/{id}/questions (GR-5) */
export interface QuestionsList {
  isClosed: boolean;
  items: Question[];
}

/** GET /api/v1/locations/tambons/{id} */
export interface TambonDetail {
  id: number;
  amphoeId: number;
  nameTh: string;
  nameEn: string | null;
  zipcode: string | null;
  lat: number | null;
  lng: number | null;
}
