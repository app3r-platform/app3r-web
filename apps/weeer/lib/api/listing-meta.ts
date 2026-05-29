/**
 * W-Round-1 Wave 2 (WeeeR) — listing_meta + reviews + questions API client
 *
 * Wired to LIVE Backend routes (main 9f86df9). camelCase + { items } contract.
 * Client-side (WeeeR app is authenticated): goes through the app's /api/v1 proxy with the
 * dev-auth bearer token, mirroring apps/weeer/app/(app)/resell/_lib/api.ts.
 *
 * Route paths are defined WITHOUT trailing slash on the Backend (path: '/{id}', '/{id}/reviews',
 * '/{id}/questions', '/tambons/{id}') — match exactly.
 *
 * getListingMeta: 404 → null (genuine not-found). reviews/questions: error → null (caller
 * renders an empty section). Auth header is sent so GR-5/GR-8 owner-vs-outsider filtering works.
 */
import type {
  ListingMeta,
  ReviewsList,
  QuestionsList,
  TambonDetail,
} from "@/lib/types/listing-meta";
// TODO: REMOVE BEFORE PROD — dev auth bypass (same pattern as resell/_lib/api.ts)
import { getDevTestToken } from "@/lib/dev-auth";

const BASE = "/api/v1";

async function safeFetch<T>(path: string): Promise<T | null> {
  try {
    const token =
      process.env.NODE_ENV === "development" ? await getDevTestToken() : null;
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** GET /api/v1/listings/{id} (GR-8 visibility applied server-side) */
export function getListingMeta(id: string) {
  return safeFetch<ListingMeta>(`/listings/${id}`);
}

/** GET /api/v1/listings/{id}/reviews (D86) */
export function getListingReviews(id: string) {
  return safeFetch<ReviewsList>(`/listings/${id}/reviews`);
}

/** GET /api/v1/listings/{id}/questions (GR-5 — visibility filtered server-side by auth) */
export function getListingQuestions(id: string) {
  return safeFetch<QuestionsList>(`/listings/${id}/questions`);
}

/** GET /api/v1/locations/tambons/{id} */
export function getTambonDetail(id: number) {
  return safeFetch<TambonDetail>(`/locations/tambons/${id}`);
}
