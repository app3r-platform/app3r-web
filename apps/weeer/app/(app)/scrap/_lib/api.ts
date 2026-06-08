// ── Scrap API (Phase C-3.2) ─────────────────────────────────────────────
// D57: Wire direct to real /api/v1/ endpoints — no mock
// TD-04 Dev Auth: apiFetch attaches Bearer token via getDevTestToken()

import { getDevTestToken } from "../../../../lib/dev-auth";
import type { ScrapItem, ScrapJob, ScrapJobOption, EWasteCertificate } from "./types";
// RC-1: Mock fallback data (dev/offline)
import { MOCK_SCRAP_ITEMS, MOCK_SCRAP_JOBS, MOCK_SCRAP_DASHBOARD, MOCK_EWASTE_CERTIFICATE } from "./mock";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getDevTestToken();
  const res = await fetch(`/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const scrapApi = {
  // ── Dashboard ────────────────────────────────────────────────────────
  async dashboard(): Promise<typeof MOCK_SCRAP_DASHBOARD> {
    try { return await apiFetch("/scrap/dashboard"); }
    catch (err) { console.warn("[mock fallback] scrap.dashboard", err); return MOCK_SCRAP_DASHBOARD; }
  },

  // ── ScrapItem Browse (WeeeR buys scrap from WeeeU) ───────────────────
  async browseList(params?: {
    conditionGrade?: string;
    minPrice?: string;
    maxPrice?: string;
  }): Promise<ScrapItem[]> {
    const q = new URLSearchParams();
    if (params?.conditionGrade) q.set("conditionGrade", params.conditionGrade);
    if (params?.minPrice) q.set("minPrice", params.minPrice);
    if (params?.maxPrice) q.set("maxPrice", params.maxPrice);
    const qs = q.toString();
    try { return await apiFetch(`/scrap/items${qs ? `?${qs}` : ""}`); }
    catch (err) { console.warn("[mock fallback] scrap.browseList", err); return MOCK_SCRAP_ITEMS; }
  },

  async getItem(id: string): Promise<ScrapItem> {
    try { return await apiFetch(`/scrap/items/${id}`); }
    catch (err) { console.warn("[mock fallback] scrap.getItem", err); return MOCK_SCRAP_ITEMS.find(i => i.id === id) ?? MOCK_SCRAP_ITEMS[0]; }
  },

  // Direct buy — WeeeR purchases ScrapItem → creates ScrapJob
  buyItem(id: string): Promise<{ scrapJobId: string }> {
    return apiFetch(`/scrap/items/${id}/buy`, { method: "POST" });
  },

  // ── ScrapJob ─────────────────────────────────────────────────────────
  async jobList(): Promise<ScrapJob[]> {
    try { return await apiFetch("/scrap/jobs"); }
    catch (err) { console.warn("[mock fallback] scrap.jobList", err); return MOCK_SCRAP_JOBS; }
  },

  async getJob(id: string): Promise<ScrapJob> {
    try { return await apiFetch(`/scrap/jobs/${id}`); }
    catch (err) { console.warn("[mock fallback] scrap.getJob", err); return MOCK_SCRAP_JOBS.find(j => j.id === id) ?? MOCK_SCRAP_JOBS[0]; }
  },

  decideJob(id: string, decision: ScrapJobOption): Promise<ScrapJob> {
    return apiFetch(`/scrap/jobs/${id}/decide`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    });
  },

  // resell_parts sub-flow
  submitResellParts(jobId: string, data: {
    partNames: string[];
    quantities: number[];
    notes?: string;
  }): Promise<{ partsCreatedIds: string[] }> {
    return apiFetch(`/scrap/jobs/${jobId}/resell-parts`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // resell_as_scrap sub-flow
  submitResellAsScrap(jobId: string, data: {
    price: number;
    description?: string;
  }): Promise<{ newListingId: string }> {
    return apiFetch(`/scrap/jobs/${jobId}/resell-as-scrap`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // dispose sub-flow
  submitDispose(jobId: string, data: {
    itemDescription: string;
  }): Promise<EWasteCertificate> {
    return apiFetch(`/scrap/jobs/${jobId}/dispose`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getCertificate(jobId: string): Promise<EWasteCertificate> {
    try { return await apiFetch(`/scrap/jobs/${jobId}/certificate`); }
    catch (err) { console.warn("[mock fallback] scrap.getCertificate", err); return { ...MOCK_EWASTE_CERTIFICATE, scrapJobId: jobId }; }
  },
};
