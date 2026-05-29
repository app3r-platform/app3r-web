/**
 * W-Round-1 Wave 2: listing_meta + reviews + questions types
 * Source contract: 36f813ec-7277-81d8-a50b-c012f1ced65f (B2 listing_meta)
 *                  Backend routes/{listings,listing-reviews,listing-questions}.ts
 *
 * GR-8 visibility rules:
 *   - viewCount: always public
 *   - offerCount: null when listing is in `matched` state and viewer is outsider
 */

export type ListingType = "repair" | "maintain" | "resell" | "scrap" | "parts";

export type ListingState =
  | "draft"
  | "published"
  | "has_offer"
  | "matched"
  | "completed"
  | "cancelled";

export interface ListingMetaDto {
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

export interface ReviewReplyDto {
  id: string;
  replierUserId: string;
  body: string;
  createdAt: string;
}

export interface ReviewDto {
  id: string;
  reviewerUserId: string;
  rating: number; // 1-5
  comment: string | null;
  createdAt: string;
  replies: ReviewReplyDto[];
}

export interface ReviewsListDto {
  items: ReviewDto[];
}

export interface QuestionReplyDto {
  id: string;
  replierUserId: string;
  body: string;
  createdAt: string;
}

export interface QuestionDto {
  id: string;
  askerUserId: string;
  body: string;
  isClosed: boolean;
  isVisible: boolean;
  createdAt: string;
  replies: QuestionReplyDto[];
}

export interface QuestionsListDto {
  isClosed: boolean;
  items: QuestionDto[];
}

export interface TambonDetailDto {
  id: number;
  amphoeId: number;
  nameTh: string;
  nameEn: string | null;
  zipcode: string | null;
  lat: number | null;
  lng: number | null;
}

export interface ProvinceDto {
  id: number;
  nameTh: string;
  nameEn: string | null;
  region: string | null;
}

export interface AmphoeDto {
  id: number;
  provinceId: number;
  nameTh: string;
  nameEn: string | null;
}

export interface TambonListItemDto {
  id: number;
  amphoeId: number;
  nameTh: string;
  nameEn: string | null;
  zipcode: string | null;
}

export interface NearbyTambonDto {
  id: number;
  amphoeId: number;
  nameTh: string;
  zipcode: string | null;
  lat: number;
  lng: number;
  distanceKm: number;
}
