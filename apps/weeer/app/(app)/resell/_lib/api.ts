import type { UsedAppliance, Listing, Offer, ResellTransaction, ListingStatus } from "./types";

// ── Thin write-response shapes (backend คืน thin ไม่ใช่ full entity · §2 discipline) ──
// reject-offer → {offerId,status} · transition (select/ship/deliver/inspect/dispute/cancel) → {listingId,state,...}
export interface ThinRejectResponse { offerId: string; status: string }
export interface ThinSelectResponse { listingId: string; state: ListingStatus; offerId: string; fundingDeadline: string }
export interface ThinTransitionResponse {
  listingId: string;
  state: ListingStatus;
  inspectionDeadline?: string;
  fundingDeadline?: string;
  lockedAmount?: number;
}
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
  // SECURITY: dev-token bypass ต้อง NODE_ENV==='development' AND NEXT_PUBLIC_DEV_NAV==='true' (double guard)
  // — prod build จะ DCE dev branch ทิ้ง (getDevTestToken/_dev/get-test-token หายจาก bundle · CI grep-gate verify)
  // TODO: REMOVE BEFORE PROD — dev auth bypass
  const useDevToken =
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_DEV_NAV === "true";
  const token = useDevToken
    ? await getDevTestToken()
    : typeof window !== "undefined"
      ? localStorage.getItem("access_token")
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

// ── W0-followup-2: mapper-normalize raw backend → FE-safe shape ─────────────
// price=null คงเป็น null (ห้าม → 0 · money-display constraint) · deliveryMethods=null → []
function normalizeListing(l: Listing): Listing {
  return {
    ...l,
    price: l.price ?? null,
    deliveryMethods: l.deliveryMethods ?? [],
  };
}
function normalizeOffer(o: Offer): Offer {
  // offerPrice คงค่าจริง (guard null ที่ render · ห้าม → 0) · deliveryMethod=null → ""
  return { ...o, deliveryMethod: o.deliveryMethod ?? "" };
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
    try { return (await apiFetch<Listing[]>(`/listings/mine${qs ? `?${qs}` : ""}`)).map(normalizeListing); }
    catch (err) { console.warn("[mock fallback] resell.listingsList", err); return MOCK_RESELL_LISTINGS; }
  },

  listingsGet: async (id: string) => {
    try { return normalizeListing(await apiFetch<Listing>(`/listings/${id}`)); }
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

  // type-fix: select-offer คืน THIN {listingId,state,offerId,fundingDeadline} ไม่ใช่ full Listing
  acceptOffer: (listingId: string, offerId: string) =>
    apiFetch<ThinSelectResponse>(`/listings/${listingId}/select-offer`, { method: "POST", body: JSON.stringify({ offerId }) }),

  // type-fix: backend คืน thin {offerId,status:'rejected'} ไม่ใช่ full Offer
  rejectOffer: (listingId: string, offerId: string) =>
    apiFetch<ThinRejectResponse>(`/listings/${listingId}/offers/${offerId}/reject`, { method: "POST", body: JSON.stringify({}) }),

  // ── §A Marketplace (Buy flow) → GET /listings/browse ───────────────────────
  // shape-fix(a): /listings/browse คืน {results,count} ไม่ใช่ Listing[] → unwrap .results
  // (mirror apps/weeeu/lib/api/listings.ts:24) · กัน marketplace LIST crash e.map
  marketplaceList: async (params?: { category?: string; listingType?: string; minPrice?: string; maxPrice?: string; sellerType?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    try {
      const res = await apiFetch<{ results: Listing[]; count: number }>(`/listings/browse${qs ? `?${qs}` : ""}`);
      return res.results.map(normalizeListing);
    }
    catch (err) { console.warn("[mock fallback] resell.marketplaceList", err); return MOCK_MARKETPLACE_LISTINGS; }
  },

  marketplaceGet: async (id: string) => {
    try { return normalizeListing(await apiFetch<Listing>(`/listings/${id}`)); }
    catch (err) { console.warn("[mock fallback] resell.marketplaceGet", err); return MOCK_MARKETPLACE_LISTINGS.find(l => l.id === id) ?? MOCK_MARKETPLACE_LISTINGS[0]; }
  },

  // ── §A Offers sent by me → GET /offers/mine · POST /offers ──────────────────
  myOffers: async (params?: { status?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    try { return (await apiFetch<Offer[]>(`/offers/mine${qs ? `?${qs}` : ""}`)).map(normalizeOffer); }
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
    const listings = (await apiFetch<Listing[]>(`/listings/mine${qs ? `?${qs}` : ""}`)).map(normalizeListing);
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
    const l = normalizeListing(await apiFetch<Listing>(`/listings/${id}`));
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
  // type-fix: backend คืน THIN {listingId,state,...} ไม่ใช่ full Listing → caller ต้อง re-fetch/merge (§2) ตอน wire (W1)
  transitionStatus: (id: string, action: "confirm_delivery" | "complete" | "dispute" | "ship" | "cancel", body?: Record<string, unknown>) => {
    const ACTION_ENDPOINT: Record<string, string> = {
      confirm_delivery: `/listings/${id}/deliver`,
      complete:         `/listings/${id}/inspect-confirm`,
      dispute:          `/listings/${id}/dispute`,
      ship:             `/listings/${id}/ship`,
      cancel:           `/listings/${id}/cancel`,
    };
    return apiFetch<ThinTransitionResponse>(ACTION_ENDPOINT[action], {
      method: "POST",
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  },
};
