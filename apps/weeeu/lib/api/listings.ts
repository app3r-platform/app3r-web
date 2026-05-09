import { apiFetch } from "@/lib/api-client";
import type { Listing } from "@/lib/types";

export const listingsApi = {
  // My sell listings
  mine: (params?: { status?: string; listingType?: string }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.listingType) sp.set("listing_type", params.listingType);
    const q = sp.toString() ? `?${sp}` : "";
    return apiFetch(`/api/v1/listings/mine${q}`).then(r => r.json()) as Promise<Listing[]>;
  },

  // Marketplace browse
  browse: (params?: { listingType?: string; minPrice?: number; maxPrice?: number; page?: number }) => {
    const sp = new URLSearchParams();
    if (params?.listingType) sp.set("listing_type", params.listingType);
    if (params?.minPrice != null) sp.set("min_price", String(params.minPrice));
    if (params?.maxPrice != null) sp.set("max_price", String(params.maxPrice));
    if (params?.page) sp.set("page", String(params.page));
    const q = sp.toString() ? `?${sp}` : "";
    return apiFetch(`/api/v1/listings${q}`).then(r => r.json()) as Promise<{ results: Listing[]; count: number }>;
  },

  get: (id: string) =>
    apiFetch(`/api/v1/listings/${id}`).then(r => r.json()) as Promise<Listing & {
      appliance_name?: string;
      seller_name?: string;
      images?: { url: string }[];
      description?: string;
    }>,

  create: (body: {
    listing_type: string;
    appliance_id?: string;
    condition_grade?: string;
    working_parts?: string[];
    price: number;
    delivery_methods: string[];
    source_warranty?: number;
    additional_warranty?: number;
    description?: string;
  }) =>
    apiFetch("/api/v1/listings/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Partial<{ price: number; delivery_methods: string[]; description: string; working_parts: string[] }>) =>
    apiFetch(`/api/v1/listings/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  cancel: (id: string) =>
    apiFetch(`/api/v1/listings/${id}/cancel/`, { method: "POST" }),

  selectOffer: (listingId: string, offerId: string) =>
    apiFetch(`/api/v1/listings/${listingId}/select-offer/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offer_id: offerId }),
    }),
};
