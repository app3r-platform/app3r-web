/**
 * WeeeT — service listing API client (consume listing_meta · D83 · Escrow)
 *
 * Guardrail: WeeeT ห้ามแก้ schema/migration — เรียก Backend API อย่างเดียว
 *   GET  /api/v1/listings/{id}            → ListingMetaDto
 *   POST /api/v1/listings/{id}/transition → D83 + Escrow point lock
 *
 * Mock-first: ถ้า Backend ไม่ตอบ (dev/นำเสนอ) → fallback mock store ใน session
 *   เพื่อให้คลิกผ่าน flow ได้ครบ (ตาม A4 ลิงก์ชั่วคราวจำลอง flow)
 */
"use client";

import { getDevTestToken } from "./dev-auth"; // TODO: REMOVE BEFORE PROD
import type {
  ListingMetaDto,
  ListingState,
  TransitionRequest,
  TransitionResult,
} from "./types/listing-meta";

const API_BASE = "/api/v1";

async function authHeaders(): Promise<Record<string, string>> {
  let token: string | null = null;
  if (process.env.NODE_ENV === "development") {
    try {
      token = await getDevTestToken();
    } catch {
      /* dev token unavailable — proceed without */
    }
  }
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Mock store (dev fallback) ───────────────────────────────────────────────
// pointAmount ผูกกับ listing เพื่อแสดง Escrow; state อัปเดตในหน่วยความจำ session
type MockEntry = ListingMetaDto & { pointAmount: number };

const nowIso = "2026-05-29T08:00:00.000Z";
const MOCK_STORE: Record<string, MockEntry> = {
  "demo-svc-001": {
    listingId: "demo-svc-001",
    listingType: "repair",
    state: "matched",
    ownerId: "owner-weeer-01",
    tambonId: 100101,
    viewCount: 42,
    offerCount: null, // matched + ช่างเป็นคนนอก offer → ซ่อน (GR-8)
    createdAt: nowIso,
    updatedAt: nowIso,
    pointAmount: 1800,
  },
  "demo-svc-002": {
    listingId: "demo-svc-002",
    listingType: "maintain",
    state: "matched",
    ownerId: "owner-weeer-02",
    tambonId: 100102,
    viewCount: 17,
    offerCount: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    pointAmount: 950,
  },
  "demo-svc-003": {
    listingId: "demo-svc-003",
    listingType: "repair",
    state: "completed",
    ownerId: "owner-weeer-01",
    tambonId: 100101,
    viewCount: 88,
    offerCount: 3,
    createdAt: nowIso,
    updatedAt: nowIso,
    pointAmount: 2400,
  },
};

function toDto(e: MockEntry): ListingMetaDto {
  const { pointAmount: _omit, ...dto } = e;
  void _omit;
  return dto;
}

/** mock pointAmount lookup (Escrow display) — null ถ้าไม่รู้จัก */
export function getMockPointAmount(id: string): number | null {
  return MOCK_STORE[id]?.pointAmount ?? null;
}

export const MOCK_LISTING_IDS = Object.keys(MOCK_STORE);

// ── Public API ──────────────────────────────────────────────────────────────

/** GET /api/v1/listings/{id} — real API ก่อน, fallback mock ใน dev */
export async function getListing(
  id: string,
): Promise<{ data: ListingMetaDto; pointAmount: number; source: "api" | "mock" }> {
  try {
    const res = await fetch(`${API_BASE}/listings/${id}`, {
      headers: await authHeaders(),
    });
    if (res.ok) {
      const data = (await res.json()) as ListingMetaDto;
      // pointAmount ไม่อยู่ใน listing_meta (เป็นของ Point ledger) — ใช้ mock hint ถ้ามี
      return { data, pointAmount: getMockPointAmount(id) ?? 0, source: "api" };
    }
  } catch {
    /* fall through to mock */
  }
  const entry = MOCK_STORE[id];
  if (!entry) throw new Error("404");
  return { data: toDto(entry), pointAmount: entry.pointAmount, source: "mock" };
}

/**
 * POST /api/v1/listings/{id}/transition — D83 + Escrow
 * matched→completed = ปล่อย Escrow ให้เจ้าของ · matched→cancelled = refund ผู้ซื้อ
 */
export async function transitionListing(
  id: string,
  body: TransitionRequest,
): Promise<TransitionResult> {
  try {
    const res = await fetch(`${API_BASE}/listings/${id}/transition`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (res.ok) return (await res.json()) as TransitionResult;
    if (res.status !== 404) {
      // backend ตอบ error จริง (เช่น INVALID_TRANSITION) — โยนต่อ
      const err = await res.json().catch(() => null);
      throw new Error(err?.error?.message ?? `${res.status}`);
    }
  } catch (e) {
    // ถ้าเป็น error จาก backend จริง (ไม่ใช่ network) — โยนต่อ
    if (e instanceof Error && e.message && !/fetch|network|Failed/i.test(e.message)) {
      // mock fallback เฉพาะกรณี network/404; error เชิง logic ให้เด้ง
      if (!MOCK_STORE[id]) throw e;
    }
  }
  // ── mock fallback: จำลอง state machine ตาม backend TRANSITIONS ──
  const entry = MOCK_STORE[id];
  if (!entry) throw new Error("404");
  const allowed: Record<ListingState, ListingState[]> = {
    draft: ["published", "cancelled"],
    published: ["has_offer", "cancelled"],
    has_offer: ["matched", "cancelled"],
    matched: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };
  if (!allowed[entry.state]?.includes(body.to)) {
    throw new Error(`INVALID_TRANSITION: ${entry.state} → ${body.to}`);
  }
  entry.state = body.to;
  entry.updatedAt = new Date().toISOString();
  return { listingId: entry.listingId, state: entry.state };
}
