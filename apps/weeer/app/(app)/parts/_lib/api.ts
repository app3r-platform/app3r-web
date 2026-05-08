import type { Part, StockMovement } from "./types";
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

// ── D57: Wire direct to real /api/v1/parts/ — no mock ─────────────────────────

export const partsApi = {
  list: (params?: { category?: string; condition?: string; search?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    return apiFetch<Part[]>(`/parts/${qs ? `?${qs}` : ""}`);
  },

  get: (id: string) =>
    apiFetch<Part>(`/parts/${id}/`),

  create: (data: Omit<Part, "id" | "shopId" | "stockQty" | "reservedQty" | "createdAt" | "updatedAt">) =>
    apiFetch<Part>(`/parts/`, { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Omit<Part, "id" | "shopId" | "createdAt" | "updatedAt">>) =>
    apiFetch<Part>(`/parts/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  stockIn: (id: string, data: { qty: number; reason: "purchase" | "receive_from_disassembly"; refId?: string; note?: string }) =>
    apiFetch<StockMovement>(`/parts/${id}/stock-in/`, { method: "POST", body: JSON.stringify(data) }),

  stockAdjust: (id: string, data: { qty: number; note: string }) =>
    apiFetch<StockMovement>(`/parts/${id}/stock-adjust/`, { method: "POST", body: JSON.stringify(data) }),

  movements: (params?: { partId?: string; type?: string; dateFrom?: string; dateTo?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    return apiFetch<StockMovement[]>(`/parts/movements/${qs ? `?${qs}` : ""}`);
  },

  getMovement: (id: string) =>
    apiFetch<StockMovement>(`/parts/movements/${id}/`),

  reservations: () =>
    apiFetch<{ partId: string; partName: string; qty: number; jobId: string; jobType: string; reservedAt: string }[]>(
      `/parts/reservations/`
    ),

  dashboard: () =>
    apiFetch<{
      total_skus: number;
      total_stock_value: number;
      low_stock: Part[];
      recent_movements: StockMovement[];
    }>(`/parts/dashboard/`),
};
