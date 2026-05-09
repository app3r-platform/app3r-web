// ── Scrap API (Phase C-3.2) ─────────────────────────────────────────────
// D57: Wire direct to real /api/v1/ endpoints — no mock
// TD-04 Dev Auth: apiFetch attaches Bearer token via getDevTestToken()

import { getDevTestToken } from "../../../../lib/dev-auth";
import type { ScrapItem, ScrapJob, ScrapJobOption, EWasteCertificate } from "./types";

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
  dashboard(): Promise<{
    availableCount: number;
    soldCount: number;
    activeJobs: number;
    pendingDecisions: number;
  }> {
    return apiFetch("/scrap/dashboard");
  },

  // ── ScrapItem Browse (WeeeR buys scrap from WeeeU) ───────────────────
  browseList(params?: {
    conditionGrade?: string;
    minPrice?: string;
    maxPrice?: string;
  }): Promise<ScrapItem[]> {
    const q = new URLSearchParams();
    if (params?.conditionGrade) q.set("conditionGrade", params.conditionGrade);
    if (params?.minPrice) q.set("minPrice", params.minPrice);
    if (params?.maxPrice) q.set("maxPrice", params.maxPrice);
    const qs = q.toString();
    return apiFetch(`/scrap/items${qs ? `?${qs}` : ""}`);
  },

  getItem(id: string): Promise<ScrapItem> {
    return apiFetch(`/scrap/items/${id}`);
  },

  // Direct buy — WeeeR purchases ScrapItem → creates ScrapJob
  buyItem(id: string): Promise<{ scrapJobId: string }> {
    return apiFetch(`/scrap/items/${id}/buy`, { method: "POST" });
  },

  // ── ScrapJob ─────────────────────────────────────────────────────────
  jobList(): Promise<ScrapJob[]> {
    return apiFetch("/scrap/jobs");
  },

  getJob(id: string): Promise<ScrapJob> {
    return apiFetch(`/scrap/jobs/${id}`);
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

  getCertificate(jobId: string): Promise<EWasteCertificate> {
    return apiFetch(`/scrap/jobs/${jobId}/certificate`);
  },
};
