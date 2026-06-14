import type { Part, StockMovement } from "./types";
// RC-1: Mock fallback data (dev/offline)
import { MOCK_PARTS, MOCK_STOCK_MOVEMENTS, MOCK_PARTS_DASHBOARD } from "./mock";
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

// ── D57: Wire direct to real /api/v1/parts/ — no mock ─────────────────────────

export const partsApi = {
  list: async (params?: { category?: string; condition?: string; search?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    try { return await apiFetch<Part[]>(`/parts/${qs ? `?${qs}` : ""}`); }
    catch (err) { console.warn("[mock fallback] parts.list", err); return MOCK_PARTS; }
  },

  get: async (id: string) => {
    try { return await apiFetch<Part>(`/parts/${id}/`); }
    catch (err) { console.warn("[mock fallback] parts.get", err); return MOCK_PARTS.find(p => p.id === id) ?? MOCK_PARTS[0]; }
  },

  create: (data: Omit<Part, "id" | "shopId" | "stockQty" | "reservedQty" | "createdAt" | "updatedAt">) =>
    apiFetch<Part>(`/parts/`, { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Omit<Part, "id" | "shopId" | "createdAt" | "updatedAt">>) =>
    apiFetch<Part>(`/parts/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  stockIn: (id: string, data: { qty: number; reason: "purchase" | "receive_from_disassembly"; refId?: string; note?: string }) =>
    apiFetch<StockMovement>(`/parts/${id}/stock-in/`, { method: "POST", body: JSON.stringify(data) }),

  stockAdjust: (id: string, data: { qty: number; note: string }) =>
    apiFetch<StockMovement>(`/parts/${id}/stock-adjust/`, { method: "POST", body: JSON.stringify(data) }),

  movements: async (params?: { partId?: string; type?: string; dateFrom?: string; dateTo?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    try { return await apiFetch<StockMovement[]>(`/parts/movements/${qs ? `?${qs}` : ""}`); }
    catch (err) { console.warn("[mock fallback] parts.movements", err); return MOCK_STOCK_MOVEMENTS; }
  },

  getMovement: async (id: string) => {
    try { return await apiFetch<StockMovement>(`/parts/movements/${id}/`); }
    catch (err) { console.warn("[mock fallback] parts.getMovement", err); return MOCK_STOCK_MOVEMENTS.find(m => m.id === id) ?? MOCK_STOCK_MOVEMENTS[0]; }
  },

  reservations: async () => {
    try { return await apiFetch<{ partId: string; partName: string; qty: number; jobId: string; jobType: string; reservedAt: string }[]>(`/parts/reservations/`); }
    catch (err) { console.warn("[mock fallback] parts.reservations", err); return []; }
  },

  dashboard: async () => {
    try { return await apiFetch<typeof MOCK_PARTS_DASHBOARD>(`/parts/dashboard/`); }
    catch (err) { console.warn("[mock fallback] parts.dashboard", err); return MOCK_PARTS_DASHBOARD; }
  },
};
