import { apiFetch } from "@/lib/api-client";
import type { ScrapItem } from "@/lib/types";

export const scrapItemsApi = {
  mine: () =>
    apiFetch("/api/v1/scrap-items/mine/").then(r => r.json()) as Promise<ScrapItem[]>,

  get: (id: string) =>
    apiFetch(`/api/v1/scrap-items/${id}/`).then(r => r.json()) as Promise<ScrapItem>,

  create: (body: {
    appliance_id?: string;
    condition_grade: string;
    working_parts: string[];
    description: string;
    price: number;
  }) =>
    apiFetch("/api/v1/scrap-items/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Partial<{
    condition_grade: string;
    working_parts: string[];
    description: string;
    price: number;
  }>) =>
    apiFetch(`/api/v1/scrap-items/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  remove: (id: string) =>
    apiFetch(`/api/v1/scrap-items/${id}/remove/`, { method: "POST" }),
};
