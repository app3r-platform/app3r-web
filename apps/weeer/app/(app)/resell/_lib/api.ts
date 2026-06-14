import type { UsedAppliance, Listing, Offer, ResellTransaction } from "./types";
// RC-1: Mock fallback data (dev/offline)
import {
  MOCK_RESELL_DASHBOARD,
  MOCK_RESELL_INVENTORY,
  MOCK_RESELL_LISTINGS,
  MOCK_MARKETPLACE_LISTINGS,
  MOCK_MY_OFFERS,
  MOCK_LISTING_OFFERS,
  MOCK_RESELL_TRANSACTIONS,
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

// ── D57: Wire direct to real /api/v1/resell/ — no mock ────────────────────

export const resellApi = {
  // ── Dashboard ──────────────────────────────────────────────────────────
  dashboard: async () => {
    try { return await apiFetch<typeof MOCK_RESELL_DASHBOARD>(`/resell/dashboard/`); }
    catch (err) { console.warn("[mock fallback] resell.dashboard", err); return MOCK_RESELL_DASHBOARD; }
  },

  // ── Inventory (UsedAppliance) ───────────────────────────────────────────
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

  // ── Listings (Sell flow) ────────────────────────────────────────────────
  listingsList: async (params?: { status?: string; listingType?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    try { return await apiFetch<Listing[]>(`/resell/listings/${qs ? `?${qs}` : ""}`); }
    catch (err) { console.warn("[mock fallback] resell.listingsList", err); return MOCK_RESELL_LISTINGS; }
  },

  listingsGet: async (id: string) => {
    try { return await apiFetch<Listing>(`/resell/listings/${id}/`); }
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
    apiFetch<Listing>(`/resell/listings/`, { method: "POST", body: JSON.stringify(data) }),

  listingsUpdateStatus: (id: string, status: string) =>
    apiFetch<Listing>(`/resell/listings/${id}/status/`, { method: "POST", body: JSON.stringify({ status }) }),

  // ── Offers (received on my listings) ───────────────────────────────────
  listingOffers: async (listingId: string) => {
    try { return await apiFetch<Offer[]>(`/resell/listings/${listingId}/offers/`); }
    catch (err) { console.warn("[mock fallback] resell.listingOffers", err); return MOCK_LISTING_OFFERS.filter(o => o.listingId === listingId); }
  },

  acceptOffer: (listingId: string, offerId: string) =>
    apiFetch<Listing>(`/resell/listings/${listingId}/offers/${offerId}/accept/`, { method: "POST" }),

  rejectOffer: (listingId: string, offerId: string) =>
    apiFetch<Offer>(`/resell/listings/${listingId}/offers/${offerId}/reject/`, { method: "POST" }),

  // ── Marketplace (Buy flow) ─────────────────────────────────────────────
  marketplaceList: async (params?: { category?: string; listingType?: string; minPrice?: string; maxPrice?: string; sellerType?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    try { return await apiFetch<Listing[]>(`/resell/marketplace/${qs ? `?${qs}` : ""}`); }
    catch (err) { console.warn("[mock fallback] resell.marketplaceList", err); return MOCK_MARKETPLACE_LISTINGS; }
  },

  marketplaceGet: async (id: string) => {
    try { return await apiFetch<Listing>(`/resell/marketplace/${id}/`); }
    catch (err) { console.warn("[mock fallback] resell.marketplaceGet", err); return MOCK_MARKETPLACE_LISTINGS.find(l => l.id === id) ?? MOCK_MARKETPLACE_LISTINGS[0]; }
  },

  // ── Offers (sent by me) ────────────────────────────────────────────────
  myOffers: async (params?: { status?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    try { return await apiFetch<Offer[]>(`/resell/offers/${qs ? `?${qs}` : ""}`); }
    catch (err) { console.warn("[mock fallback] resell.myOffers", err); return MOCK_MY_OFFERS; }
  },

  submitOffer: (data: { listingId: string; offerPrice: number; deliveryMethod: string; message?: string }) =>
    apiFetch<Offer>(`/resell/offers/`, { method: "POST", body: JSON.stringify(data) }),

  withdrawOffer: (offerId: string) =>
    apiFetch<Offer>(`/resell/offers/${offerId}/withdraw/`, { method: "POST" }),

  // ── Transactions ────────────────────────────────────────────────────────
  transactionsList: async (params?: { status?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    try { return await apiFetch<ResellTransaction[]>(`/resell/transactions/${qs ? `?${qs}` : ""}`); }
    catch (err) { console.warn("[mock fallback] resell.transactionsList", err); return MOCK_RESELL_TRANSACTIONS; }
  },

  transactionsGet: async (id: string) => {
    try { return await apiFetch<ResellTransaction>(`/resell/transactions/${id}/`); }
    catch (err) { console.warn("[mock fallback] resell.transactionsGet", err); return MOCK_RESELL_TRANSACTIONS.find(t => t.id === id) ?? MOCK_RESELL_TRANSACTIONS[0]; }
  },

  transitionStatus: (id: string, action: "confirm_delivery" | "complete" | "dispute") =>
    apiFetch<ResellTransaction>(`/resell/transactions/${id}/${action}/`, { method: "POST" }),
};
