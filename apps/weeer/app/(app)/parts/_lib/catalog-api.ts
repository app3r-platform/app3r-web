// ── Parts B2B Public Catalog API client — W-Round-1 Wave 2 (Ruling 1A = A) ────
//
// Consume backend public catalog: GET /api/v1/parts/catalog/ (parts_listings)
//   - list   → GET  /parts/catalog/?search=&sourceType=&minScore=&minPrice=&maxPrice=&status=
//   - get    → GET  /parts/catalog/:id/
//   - search → GET  /parts/search/?q=
//
// Backend route: apps/backend/src/routes/parts-catalog.ts (READ-ONLY for Parts — guardrail ⑥)
// Source-of-truth DTO: parts-catalog.ts `ListingSchema` / `mapListing()` (verbatim field names)
//
// ⚠️ ข้อ 4 (ห้ามเดา): ฟิลด์ทั้งหมดด้านล่าง map ตรงจาก backend DTO เท่านั้น — ไม่มีการแต่งฟิลด์ที่ backend ไม่ส่ง
// ⚠️ unitPrice = THB (schema parts-listings.ts:61) ≠ pricePoints (Gold) ของ marketplace UI
//    → การ render เป็น "pts" ต้องรอ ruling pricing-unit contract (ดู AN DB) ก่อน wire เข้า order flow

// TODO: REMOVE BEFORE PROD — dev auth bypass
import { getDevTestToken } from "../../../../lib/dev-auth";

const BASE = "/api/v1";

async function catalogFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // TODO: REMOVE BEFORE PROD — dev auth bypass
  const token =
    process.env.NODE_ENV === "development" ? await getDevTestToken() : null;

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
    throw new Error(
      (err as { detail?: string }).detail ?? `Catalog API error ${res.status}`,
    );
  }
  return res.json() as Promise<T>;
}

// ── Backend catalog DTO (verbatim จาก parts-catalog.ts mapListing) ────────────
export interface CatalogListing {
  id: string;
  weeerUserId: string;
  inventoryItemId: string | null;
  sourceType: string; // 'new' | 'used' | 'disassembled'
  sourceScrapId: string | null;
  partName: string;
  partNumber: string | null;
  manufacturer: string | null;
  oemCompatibility: unknown;
  conditionScore: number; // 1–10
  unitPrice: string; // THB (numeric → string)
  tierPricing: unknown;
  qtyAvailable: number;
  qtyReserved: number;
  photos: unknown; // string[] (r2 keys)
  warrantyDays: number;
  status: string; // 'active' | 'inactive' | 'sold_out' | 'deleted'
  createdAt: string;
  updatedAt: string;
}

export interface CatalogListResponse {
  items: CatalogListing[];
  total: number;
}

export interface CatalogSearchResponse extends CatalogListResponse {
  query: string;
}

export interface CatalogListParams {
  search?: string;
  sourceType?: string;
  minScore?: string;
  minPrice?: string;
  maxPrice?: string;
  status?: string;
}

function toQs(params?: Record<string, string | undefined>): string {
  const entries = Object.entries(params ?? {}).filter(([, v]) => v != null && v !== "");
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries as [string, string][]).toString()}`;
}

export const catalogApi = {
  /** GET /api/v1/parts/catalog/ — list public listings (status default 'active') */
  list: (params?: CatalogListParams) =>
    catalogFetch<CatalogListResponse>(`/parts/catalog/${toQs(params)}`),

  /** GET /api/v1/parts/catalog/:id/ — listing detail */
  get: (id: string) => catalogFetch<CatalogListing>(`/parts/catalog/${id}/`),

  /** GET /api/v1/parts/search/?q= — full-text search (name + part_number + manufacturer) */
  search: (q: string) =>
    catalogFetch<CatalogSearchResponse>(`/parts/search/${toQs({ q })}`),
};

// ── Faithful field helpers (เฉพาะที่ map 1:1 ได้จริง — ไม่เดา) ────────────────

/** sourceType (backend) → marketplace condition enum. disassembled→refurbished (ใกล้เคียงสุด). */
export function sourceTypeToCondition(
  sourceType: string,
): "new" | "used" | "refurbished" {
  switch (sourceType) {
    case "new":
      return "new";
    case "used":
      return "used";
    case "disassembled":
      return "refurbished";
    default:
      return "used";
  }
}

/** photos (unknown jsonb) → string[] อย่างปลอดภัย */
export function catalogPhotos(photos: unknown): string[] {
  return Array.isArray(photos) ? photos.filter((p): p is string => typeof p === "string") : [];
}

/**
 * ⚠️ ยังไม่ map → PartListing เต็มรูปแบบ เพราะ 2 ฟิลด์ขาด/ไม่ตรงหน่วย (ห้ามเดา — ข้อ 4):
 *   - category: backend parts_listings ไม่มีคอลัมน์นี้
 *   - pricePoints (Gold) ↔ unitPrice (THB): คนละหน่วย ต้องรอ ruling pricing-unit contract
 * เมื่อ HUB ตัดสิน contract แล้วค่อยเติม mapCatalogToPartListing() ที่นี่.
 */
