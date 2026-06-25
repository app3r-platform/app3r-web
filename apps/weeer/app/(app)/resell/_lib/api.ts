import type { UsedAppliance, Listing, Offer, ResellTransaction } from "./types";
// RC-1: Mock fallback data (dev/offline)
import {
  MOCK_RESELL_DASHBOARD,
  MOCK_RESELL_INVENTORY,
  MOCK_RESELL_LISTINGS,
  MOCK_MARKETPLACE_LISTINGS,
  MOCK_MY_OFFERS,
  MOCK_LISTING_OFFERS,
} from "./mock";
// TODO: REMOVE BEFORE PROD — dev auth bypass
import { getDevTestToken } from "../../../../lib/dev-auth";

const BASE = "/api/v1";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // Mock mode: ไม่มี backend → throw ทันที ให้ caller .catch() ใช้ mock fallback
  if (process.env.NEXT_PUBLIC_DEV_NAV === "true") throw new Error("[mock-mode]");
  // TODO: REMOVE BEFORE PROD — dev auth bypass
  const token =
    process.env.NODE_ENV === "development"
      ? await getDevTestToken()
      : null;

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── W3c: Phantom /resell/* → canonical (§A/C) · §B WeeeR-specific kept ──────

export const resellApi = {
  // ── §B WeeeR-specific (R-66/67 inventory slice · no canonical yet) ──────────
  dashboard: async () => {
    try { return await apiFetch<typeof MOCK_RESELL_DASHBOARD>(`/resell/dashboard/`); }
    catch (err) { console.warn("[mock fallback] resell.dashboard", err); return MOCK_RESELL_DASHBOARD; }
  },

  inventoryList: async (params?: { status?: string; category?: string; search?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    try { return await apiFetch<UsedAppliance[]>(`/resell/inventory/${qs ? `?${qs}` : ""}`); }
    catch (err) { console.warn("[mock fallback] resell.inventoryList", err); return MOCK_RESELL_INVENTORY; }
  },

  inventoryGet: async (id: string) => {
    try { return await apiFetch<UsedAppliance>(`/resell/inventory/${id}/`); }
    catch (err) { console.warn("[mock fallback] resell.inventoryGet", err); return MOCK_RESELL_INVENTORY.find(i => i.id === id) ?? MOCK_RESELL_INVENTORY[0]; }
  },

  inventoryCreate: (data: Omit<UsedAppliance, "id" | "shopId" | "status" | "createdAt" | "updatedAt">) =>
    apiFetch<UsedAppliance>(`/resell/inventory/`, { method: "POST", body: JSON.stringify(data) }),

  inventoryUpdate: (id: string, data: Partial<Omit<UsedAppliance, "id" | "shopId" | "createdAt" | "updatedAt">>) =>
    apiFetch<UsedAppliance>(`/resell/inventory/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  inventoryLookupSku: (sku: string) =>
    apiFetch<Partial<UsedAppliance> | null>(`/resell/inventory/lookup-sku/?sku=${encodeURIComponent(sku)}`),

  // ── §A Listings (Sell flow) → GET /listings/mine · POST /listings ──────────
  listingsList: async (params?: { status?: string; listingType?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    try { return await apiFetch<Listing[]>(`/listings/mine${qs ? `?${qs}` : ""}`); }
    catch (err) { console.warn("[mock fallback] resell.listingsList", err); return MOCK_RESELL_LISTINGS; }
  },

  listingsGet: async (id: string) => {
    try { return await apiFetch<Listing>(`/listings/${id}`); }
    catch (err) { console.warn("[mock fallback] resell.listingsGet", err); return MOCK_RESELL_LISTINGS.find(l => l.id === id) ?? MOCK_RESELL_LISTINGS[0]; }
  },

  listingsCreate: (data: {
    applianceId: string;
    price: number;
    deliveryMethods: string[];
    warranty?: { sourceWarranty: number; additionalWarranty: number };
    description?: string;
    expiresAt: string;
  }) =>
    apiFetch<Listing>(`/listings`, {
      method: "POST",
      body: JSON.stringify({ listingType: "used_appliance", ...data }),
    }),

  // §C: generic transition (dead code in UI — guarded actions via transitionStatus below)
  listingsUpdateStatus: (id: string, status: string) =>
    apiFetch<Listing>(`/listings/${id}/transition`, { method: "POST", body: JSON.stringify({ status }) }),

  // ── §A Offers received on my listings ───────────────────────────────────────
  listingOffers: async (listingId: string) => {
    try { return await apiFetch<Offer[]>(`/listings/${listingId}/offers`); }
    catch (err) { console.warn("[mock fallback] resell.listingOffers", err); return MOCK_LISTING_OFFERS.filter(o => o.listingId === listingId); }
  },

  acceptOffer: (listingId: string, offerId: string) =>
    apiFetch<Listing>(`/listings/${listingId}/select-offer`, { method: "POST", body: JSON.stringify({ offerId }) }),

  rejectOffer: (listingId: string, offerId: string) =>
    apiFetch<Offer>(`/listings/${listingId}/offers/${offerId}/reject`, { method: "POST" }),

  // ── §A Marketplace (Buy flow) → GET /listings/browse ───────────────────────
  marketplaceList: async (params?: { category?: string; listingType?: string; minPrice?: string; maxPrice?: string; sellerType?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    try { return await apiFetch<Listing[]>(`/listings/browse${qs ? `?${qs}` : ""}`); }
    catch (err) { console.warn("[mock fallback] resell.marketplaceList", err); return MOCK_MARKETPLACE_LISTINGS; }
  },

  marketplaceGet: async (id: string) => {
    try { return await apiFetch<Listing>(`/listings/${id}`); }
    catch (err) { console.warn("[mock fallback] resell.marketplaceGet", err); return MOCK_MARKETPLACE_LISTINGS.find(l => l.id === id) ?? MOCK_MARKETPLACE_LISTINGS[0]; }
  },

  // ── §A Offers sent by me → GET /offers/mine · POST /offers ──────────────────
  myOffers: async (params?: { status?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    try { return await apiFetch<Offer[]>(`/offers/mine${qs ? `?${qs}` : ""}`); }
    catch (err) { console.warn("[mock fallback] resell.myOffers", err); return MOCK_MY_OFFERS; }
  },

  submitOffer: (data: { listingId: string; offerPrice: number; deliveryMethod: string; message?: string }) =>
    apiFetch<Offer>(`/offers`, { method: "POST", body: JSON.stringify(data) }),

  withdrawOffer: (offerId: string) =>
    apiFetch<Offer>(`/offers/${offerId}/withdraw`, { method: "POST" }),

  // ── §D GAP: compose from /listings/mine (projection endpoint = Backend follow-up) ──
  transactionsList: async (params?: { status?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    const listings = await apiFetch<Listing[]>(`/listings/mine${qs ? `?${qs}` : ""}`);
    return listings.map(l => ({
      id: l.id,
      listingId: l.id,
      applianceName: l.applianceName ?? "",
      sellerName: "",
      buyerName: "",
      price: l.price,
      status: l.status,
      deliveryMethod: l.deliveryMethods?.[0] ?? "",
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
      role: "seller" as const,
    } as ResellTransaction));
  },

  transactionsGet: async (id: string) => {
    const l = await apiFetch<Listing>(`/listings/${id}`);
    return {
      id: l.id,
      listingId: l.id,
      applianceName: l.applianceName ?? "",
      sellerName: "",
      buyerName: "",
      price: l.price,
      status: l.status,
      deliveryMethod: l.deliveryMethods?.[0] ?? "",
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
      role: "seller" as const,
    } as ResellTransaction;
  },

  // ── §A/C Guarded action endpoints → /listings/{id}/{action} ────────────────
  transitionStatus: (id: string, action: "confirm_delivery" | "complete" | "dispute" | "ship" | "cancel", body?: Record<string, unknown>) => {
    const ACTION_ENDPOINT: Record<string, string> = {
      confirm_delivery: `/listings/${id}/deliver`,
      complete:         `/listings/${id}/inspect-confirm`,
      dispute:          `/listings/${id}/dispute`,
      ship:             `/listings/${id}/ship`,
      cancel:           `/listings/${id}/cancel`,
    };
    return apiFetch<Listing>(ACTION_ENDPOINT[action], {
      method: "POST",
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  },
};
