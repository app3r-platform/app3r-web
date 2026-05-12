// ── WeeeR DAL Factory — D84/D-2 (Phase D-2 Per-Module Switch) ─────────────────
// getAdapter() เลือก localStorage หรือ api per-module ตาม feature flag
// D-1: ทุก flag OFF → localStorage เสมอ
// D-2: เมื่อ flag เปิด → route module นั้น ไป apiAdapter (per-module)

import type { IWeeerDAL } from "@app3r/dal";
import { weeerLocalStorageAdapter } from "./localStorageAdapter";
import { weeerApiAdapter } from "./apiAdapter";

// ── Feature Flags (ฟีเจอร์เปิด/ปิด per module) ────────────────────────────────
// ตั้งค่าผ่าน .env.local — ดู .env.local.example

function flag(key: string): boolean {
  if (typeof process === "undefined") return false;
  return process.env[key] === "true";
}

export const FEATURE_FLAGS = {
  auth:     flag("NEXT_PUBLIC_USE_API_AUTH"),
  points:   flag("NEXT_PUBLIC_USE_API_POINTS"),
  offer:    flag("NEXT_PUBLIC_USE_API_OFFER"),
  repair:   flag("NEXT_PUBLIC_USE_API_REPAIR"),
  maintain: flag("NEXT_PUBLIC_USE_API_MAINTAIN"),
  parts:    flag("NEXT_PUBLIC_USE_API_PARTS"),
  scrap:    flag("NEXT_PUBLIC_USE_API_SCRAP"),
  resell:   flag("NEXT_PUBLIC_USE_API_RESELL"),
} as const;

// ── Per-Module Composite Adapter ──────────────────────────────────────────────
// D-2: แต่ละ module เลือก adapter ของตัวเองอิสระ
// ช่วยให้ migrate ทีละ module โดยไม่กระทบ module อื่น

let _adapter: IWeeerDAL | null = null;

export function getAdapter(): IWeeerDAL {
  if (_adapter) return _adapter;

  const anyApiEnabled = Object.values(FEATURE_FLAGS).some(Boolean);

  // D-1 fast path: ทุก flag OFF → localStorage เสมอ (Phase C behavior intact)
  if (!anyApiEnabled) {
    _adapter = weeerLocalStorageAdapter;
    return _adapter;
  }

  // D-2: Per-module composite — แต่ละ module เลือก adapter ของตัวเอง
  _adapter = {
    adapterName: "composite-d2",
    isAvailable: () => typeof window !== "undefined",

    offer:         FEATURE_FLAGS.offer    ? weeerApiAdapter.offer         : weeerLocalStorageAdapter.offer,
    repairJob:     FEATURE_FLAGS.repair   ? weeerApiAdapter.repairJob     : weeerLocalStorageAdapter.repairJob,
    maintenance:   FEATURE_FLAGS.maintain ? weeerApiAdapter.maintenance   : weeerLocalStorageAdapter.maintenance,
    resellListing: FEATURE_FLAGS.resell   ? weeerApiAdapter.resellListing : weeerLocalStorageAdapter.resellListing,
    scrapListing:  FEATURE_FLAGS.scrap    ? weeerApiAdapter.scrapListing  : weeerLocalStorageAdapter.scrapListing,
    parts:         FEATURE_FLAGS.parts    ? weeerApiAdapter.parts         : weeerLocalStorageAdapter.parts,
  };
  return _adapter;
}

/** Reset adapter cache (ใช้ใน testing + hot-reload) */
export function resetAdapter(): void {
  _adapter = null;
}

// Re-export types สำหรับ WeeeR modules
export type { IWeeerDAL } from "@app3r/dal";
export * from "@app3r/dal";
