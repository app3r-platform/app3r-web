import { apiFetch } from "@/lib/api-client";
import type { Listing } from "@/lib/types";

export const listingsApi = {
  // My sell listings — Hono GET /api/v1/listings/mine → Listing[] (camelCase query+DTO)
  mine: (params?: { status?: string; listingType?: string }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.listingType) sp.set("listingType", params.listingType);
    const q = sp.toString() ? `?${sp}` : "";
    return apiFetch(`/api/v1/listings/mine${q}`).then(r => r.json()) as Promise<Listing[]>;
  },

  // Marketplace browse — Hono GET /api/v1/listings/browse → { results, count } (camelCase)
  browse: (params?: { listingType?: string; tambonId?: number; minPrice?: number; maxPrice?: number; page?: number; pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params?.listingType) sp.set("listingType", params.listingType);
    if (params?.tambonId != null) sp.set("tambonId", String(params.tambonId));
    if (params?.minPrice != null) sp.set("minPrice", String(params.minPrice));
    if (params?.maxPrice != null) sp.set("maxPrice", String(params.maxPrice));
    if (params?.page) sp.set("page", String(params.page));
    if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
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

  // Create — Hono POST /api/v1/listings (camelCase ตรง source 6f15d39)
  // listingType: 'used_appliance' | 'scrap' · status: draft→ฉบับร่าง / announced→เผยแพร่ (เก็บ listing_fee)
  create: (body: {
    listingType: "used_appliance" | "scrap";
    applianceId?: string;
    conditionGrade?: string;
    workingParts?: string[];
    price: number;
    deliveryMethods: string[];
    sourceWarranty?: number;
    additionalWarranty?: number;
    scrapItemId?: string;
    tambonId?: number;
    status?: "draft" | "announced";
  }) =>
    apiFetch("/api/v1/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  // Cancel listing — D59 state machine: POST /{id}/transition { to:'cancelled' } (escrow refund ผู้ซื้อ ถ้า hold อยู่)
  cancel: (id: string) =>
    apiFetch(`/api/v1/listings/${id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "cancelled" }),
    }),

  // Seller selects offer — Hono POST /{id}/select-offer { offerId } → offer_selected + escrow hold
  selectOffer: (listingId: string, offerId: string) =>
    apiFetch(`/api/v1/listings/${listingId}/select-offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId }),
    }),

  // Buyer creates offer — Hono POST /{id}/offers { offerPrice, deliveryMethod, message? } → 201
  createOffer: (listingId: string, body: { offerPrice: number; deliveryMethod: string; message?: string }) =>
    apiFetch(`/api/v1/listings/${listingId}/offers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  // List offers on a listing (seller view) — Hono GET /{id}/offers → Offer[]
  listOffers: (listingId: string) =>
    apiFetch(`/api/v1/listings/${listingId}/offers`).then(r => r.json()) as Promise<unknown[]>,

  // Buyer confirms funding — POST /{id}/confirm-funding {} → thin {listingId,state,lockedAmount} [LOCK escrow]
  // guard: selected buyer + funding window + balance≥0 (BE enforces · FE checks non-2xx)
  confirmFunding: (listingId: string) =>
    apiFetch(`/api/v1/listings/${listingId}/confirm-funding`, { method: "POST" })
      .then(async r => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw Object.assign(new Error(body?.error?.message ?? "confirm-funding failed"), { status: r.status, code: body?.error?.code });
        }
        return r.json() as Promise<{ listingId: string; state: string; lockedAmount: number | null }>;
      }),

  // Buyer confirms inspection — POST /{id}/inspect-confirm {} → thin {listingId,state} [RELEASE escrow]
  // guard: selected buyer + state=inspection_period (BE enforces)
  inspectConfirm: (listingId: string) =>
    apiFetch(`/api/v1/listings/${listingId}/inspect-confirm`, { method: "POST" })
      .then(async r => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw Object.assign(new Error(body?.error?.message ?? "inspect-confirm failed"), { status: r.status, code: body?.error?.code });
        }
        return r.json() as Promise<{ listingId: string; state: string }>;
      }),
};
