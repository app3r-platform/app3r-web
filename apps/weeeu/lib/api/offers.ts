import { apiFetch } from "@/lib/api-client";
import type { Offer } from "@/lib/types";

// Contract: camelCase + ไม่มี trailing slash (Hono strict routing · HUB Gen 37 casing FINAL)
export const offersApi = {
  // Offers I sent as buyer — GET /api/v1/offers/mine → Offer[] (camelCase offerDto)
  mine: () =>
    apiFetch("/api/v1/offers/mine").then(r => r.json()) as Promise<(Offer & {
      listingTitle?: string;
      sellerName?: string;
    })[]>,

  // Offers on a listing (seller view) — GET /api/v1/listings/{id}/offers → Offer[]
  forListing: (listingId: string) =>
    apiFetch(`/api/v1/listings/${listingId}/offers`).then(r => r.json()) as Promise<(Offer & {
      buyerName?: string;
    })[]>,

  // Create offer — POST /api/v1/offers { listingId, offerPrice, deliveryMethod, message? }
  create: (body: {
    listingId: string;
    offerPrice: number;
    deliveryMethod: string;
    message?: string;
  }) =>
    apiFetch("/api/v1/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  withdraw: (id: string) =>
    apiFetch(`/api/v1/offers/${id}/withdraw`, { method: "POST" }),
};
