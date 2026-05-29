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

  // Marketplace browse — Hono GET /api/v1/listings/browse → { results, count } (snake_case DTO)
  browse: (params?: { listingType?: string; tambonId?: number; minPrice?: number; maxPrice?: number; page?: number; pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params?.listingType) sp.set("listing_type", params.listingType);
    if (params?.tambonId != null) sp.set("tambon_id", String(params.tambonId));
    if (params?.minPrice != null) sp.set("min_price", String(params.minPrice));
    if (params?.maxPrice != null) sp.set("max_price", String(params.maxPrice));
    if (params?.page) sp.set("page", String(params.page));
    if (params?.pageSize) sp.set("page_size", String(params.pageSize));
    const q = sp.toString() ? `?${sp}` : "";
    return apiFetch(`/api/v1/listings/browse${q}`).then(r => r.json()) as Promise<{ results: Listing[]; count: number }>;
  },

  get: (id: string) =>
    apiFetch(`/api/v1/listings/${id}`).then(r => r.json()) as Promise<Listing & {
      appliance_name?: string;
      seller_name?: string;
      images?: { url: string }[];
      description?: string;
    }>,

  // Create — Hono POST /api/v1/listings (listing_meta + used_appliance_listings txn)
  // listing_type ตาม contract จริง: 'used_appliance' | 'scrap' · status: draft→ฉบับร่าง / announced→เผยแพร่ (เก็บ listing_fee)
  create: (body: {
    listing_type: "used_appliance" | "scrap";
    appliance_id?: string;
    condition_grade?: string;
    working_parts?: string[];
    price: number;
    delivery_methods: string[];
    source_warranty?: number;
    additional_warranty?: number;
    scrap_item_id?: string;
    tambon_id?: number;
    status?: "draft" | "announced";
  }) =>
    apiFetch("/api/v1/listings", {
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

  // Seller selects offer — Hono POST /{id}/select-offer { offer_id } → offer_selected + escrow hold
  selectOffer: (listingId: string, offerId: string) =>
    apiFetch(`/api/v1/listings/${listingId}/select-offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offer_id: offerId }),
    }),

  // Buyer creates offer — Hono POST /{id}/offers { offer_price, delivery_method, message? } → 201
  createOffer: (listingId: string, body: { offer_price: number; delivery_method: string; message?: string }) =>
    apiFetch(`/api/v1/listings/${listingId}/offers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  // List offers on a listing (seller view) — Hono GET /{id}/offers → Offer[]
  listOffers: (listingId: string) =>
    apiFetch(`/api/v1/listings/${listingId}/offers`).then(r => r.json()) as Promise<unknown[]>,

  // R5 — withdraw selected offer (ถอนการเลือกผู้ซื้อ)
  withdrawSelection: (listingId: string) =>
    apiFetch(`/api/v1/listings/${listingId}/withdraw-selection/`, { method: "POST" }),

  // R2 — appeal suspension (อุทธรณ์การระงับประกาศ)
  appealSuspension: (listingId: string, reason: string) =>
    apiFetch(`/api/v1/listings/${listingId}/appeal-suspension/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }),
};
