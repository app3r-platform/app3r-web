import { apiFetch } from "@/lib/api-client";
import type { Offer } from "@/lib/types";

export const offersApi = {
  // Offers I sent as buyer
  mine: () =>
    apiFetch("/api/v1/offers/mine/").then(r => r.json()) as Promise<(Offer & {
      listing_title?: string;
      seller_name?: string;
    })[]>,

  // Offers on a listing (for seller view)
  forListing: (listingId: string) =>
    apiFetch(`/api/v1/listings/${listingId}/offers/`).then(r => r.json()) as Promise<(Offer & {
      buyer_name?: string;
    })[]>,

  create: (body: {
    listing_id: string;
    offer_price: number;
    delivery_method: string;
    message?: string;
  }) =>
    apiFetch("/api/v1/offers/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  withdraw: (id: string) =>
    apiFetch(`/api/v1/offers/${id}/withdraw/`, { method: "POST" }),
};
