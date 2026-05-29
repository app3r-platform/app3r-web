/**
 * W-Round-1 Wave 2 (WeeeR) — listing_meta + reviews + questions API client
 *
 * Contract-first (Ruling 3 = A · "ไม่ mock" = consume real routes Backend publishes).
 * Wire convention: snake_case + { results, count } (Ruling 1E/1F).
 *
 * Client-side (WeeeR app is authenticated): goes through the app's /api/v1 proxy with
 * the dev-auth bearer token, mirroring apps/weeer/app/(app)/resell/_lib/api.ts.
 *
 * Fail-soft: returns null on any non-OK / network error so UI shells render an empty
 * state until Backend Part1 routes land on main (HUB will signal wiring readiness).
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
  return safeFetch<ListingMeta>(`/listings/${id}/`);
}

/** GET /api/v1/listings/{id}/reviews (D86) */
export function getListingReviews(id: string) {
  return safeFetch<ReviewsList>(`/listings/${id}/reviews/`);
}

/** GET /api/v1/listings/{id}/questions (GR-5 — anonymous view returns is_visible=true only) */
export function getListingQuestions(id: string) {
  return safeFetch<QuestionsList>(`/listings/${id}/questions/`);
}

/** GET /api/v1/locations/tambons/{id} — tambon detail with parent amphoe/province */
export function getTambonDetail(id: number) {
  return safeFetch<TambonDetail>(`/locations/tambons/${id}/`);
}
