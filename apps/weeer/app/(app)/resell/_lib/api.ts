import type { UsedAppliance, Listing, Offer, ResellTransaction } from "./types";
// TODO: REMOVE BEFORE PROD — dev auth bypass
import { getDevTestToken } from "../../../../lib/dev-auth";

const BASE = "/api/v1";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
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
  dashboard: () =>
    apiFetch<{
      total_inventory: number;
      total_listings_active: number;
      total_offers_pending: number;
      total_revenue: number;
      recent_listings: Listing[];
    }>(`/resell/dashboard/`),

  // ── Inventory (UsedAppliance) ───────────────────────────────────────────
  inventoryList: (params?: { status?: string; category?: string; search?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    return apiFetch<UsedAppliance[]>(`/resell/inventory/${qs ? `?${qs}` : ""}`);
  },

  inventoryGet: (id: string) =>
    apiFetch<UsedAppliance>(`/resell/inventory/${id}/`),

  inventoryCreate: (data: Omit<UsedAppliance, "id" | "shopId" | "status" | "createdAt" | "updatedAt">) =>
    apiFetch<UsedAppliance>(`/resell/inventory/`, { method: "POST", body: JSON.stringify(data) }),

  inventoryUpdate: (id: string, data: Partial<Omit<UsedAppliance, "id" | "shopId" | "createdAt" | "updatedAt">>) =>
    apiFetch<UsedAppliance>(`/resell/inventory/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  inventoryLookupSku: (sku: string) =>
    apiFetch<Partial<UsedAppliance> | null>(`/resell/inventory/lookup-sku/?sku=${encodeURIComponent(sku)}`),

  // ── Listings (Sell flow) ────────────────────────────────────────────────
  listingsList: (params?: { status?: string; listingType?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    return apiFetch<Listing[]>(`/resell/listings/${qs ? `?${qs}` : ""}`);
  },

  listingsGet: (id: string) =>
    apiFetch<Listing>(`/resell/listings/${id}/`),

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
  listingOffers: (listingId: string) =>
    apiFetch<Offer[]>(`/resell/listings/${listingId}/offers/`),

  acceptOffer: (listingId: string, offerId: string) =>
    apiFetch<Listing>(`/resell/listings/${listingId}/offers/${offerId}/accept/`, { method: "POST" }),

  rejectOffer: (listingId: string, offerId: string) =>
    apiFetch<Offer>(`/resell/listings/${listingId}/offers/${offerId}/reject/`, { method: "POST" }),

  // ── Marketplace (Buy flow) ─────────────────────────────────────────────
  marketplaceList: (params?: { category?: string; listingType?: string; minPrice?: string; maxPrice?: string; sellerType?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    return apiFetch<Listing[]>(`/resell/marketplace/${qs ? `?${qs}` : ""}`);
  },

  marketplaceGet: (id: string) =>
    apiFetch<Listing>(`/resell/marketplace/${id}/`),

  // ── Offers (sent by me) ────────────────────────────────────────────────
  myOffers: (params?: { status?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    return apiFetch<Offer[]>(`/resell/offers/${qs ? `?${qs}` : ""}`);
  },

  submitOffer: (data: { listingId: string; offerPrice: number; deliveryMethod: string; message?: string }) =>
    apiFetch<Offer>(`/resell/offers/`, { method: "POST", body: JSON.stringify(data) }),

  withdrawOffer: (offerId: string) =>
    apiFetch<Offer>(`/resell/offers/${offerId}/withdraw/`, { method: "POST" }),

  // ── Transactions ────────────────────────────────────────────────────────
  transactionsList: (params?: { status?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    return apiFetch<ResellTransaction[]>(`/resell/transactions/${qs ? `?${qs}` : ""}`);
  },

  transactionsGet: (id: string) =>
    apiFetch<ResellTransaction>(`/resell/transactions/${id}/`),

  transitionStatus: (id: string, action: "confirm_delivery" | "complete" | "dispute") =>
    apiFetch<ResellTransaction>(`/resell/transactions/${id}/${action}/`, { method: "POST" }),
};
