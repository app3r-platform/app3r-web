/**
 * W-Round-1 Wave 2: listing_meta + reviews + questions API client (public read-only)
 *
 * Server Component-safe (no "use client") — uses Next.js fetch with revalidate.
 * Calls Hono Backend at BACKEND_URL (default http://localhost:8787).
 */
import type {
  ListingMetaDto,
  ReviewsListDto,
  QuestionsListDto,
  TambonDetailDto,
} from "@/lib/types/listing-meta";

const BACKEND_URL =
  process.env.BACKEND_URL ?? process.env.CMS_BACKEND_URL ?? "http://localhost:8787";

const REVALIDATE_LIST = 60; // 1 min cache for listing detail
const REVALIDATE_REVIEW = 300; // 5 min for reviews (lower churn)
const REVALIDATE_LOCATION = 86400; // 1 day for location master

async function safeFetch<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      next: { revalidate },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** GET /api/v1/listings/{id} (public-friendly — GR-8 visibility applied server-side) */
export function getListingMeta(id: string) {
  return safeFetch<ListingMetaDto>(`/api/v1/listings/${id}`, REVALIDATE_LIST);
}

/** GET /api/v1/listings/{id}/reviews (D86) */
export function getListingReviews(id: string) {
  return safeFetch<ReviewsListDto>(`/api/v1/listings/${id}/reviews`, REVALIDATE_REVIEW);
}

/** GET /api/v1/listings/{id}/questions (GR-5 — public anonymous view returns isVisible=true only) */
export function getListingQuestions(id: string) {
  return safeFetch<QuestionsListDto>(`/api/v1/listings/${id}/questions`, REVALIDATE_REVIEW);
}

/** GET /api/v1/locations/tambons/{id} — tambon detail with parent amphoe/province names */
export function getTambonDetail(id: number) {
  return safeFetch<TambonDetailDto>(`/api/v1/locations/tambons/${id}`, REVALIDATE_LOCATION);
}
