// ── WeeeR DAL Factory — D84 (Phase D-1) ──────────────────────────────────────
// getAdapter() เลือก localStorage (default) หรือ api ตาม feature flag (ฟีเจอร์เปิด/ปิด)
// D-1: ทุก flag default OFF → ใช้ localStorage เสมอ

import type { IWeeerDAL } from "@app3r/dal";
import { weeerLocalStorageAdapter } from "./localStorageAdapter";
import { weeerApiAdapter } from "./apiAdapter";

// ── Feature Flags (ฟีเจอร์เปิด/ปิด per module) ────────────────────────────────
// ตั้งค่าผ่าน .env.local — ดู .env.local.example
// D-1: ทุก module ใช้ localStorage → set NEXT_PUBLIC_USE_API_* = false

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

// ── Adapter selector ──────────────────────────────────────────────────────────
// D-1: ทุก flag OFF → localStorage เสมอ
// D-2: เมื่อ flag เปิด → route ไป apiAdapter (per-module)

let _adapter: IWeeerDAL | null = null;

export function getAdapter(): IWeeerDAL {
  if (_adapter) return _adapter;

  // D-1: use localStorage for all modules (ทุก flag = false)
  // TODO D-2: split per-module based on FEATURE_FLAGS
  const anyApiEnabled = Object.values(FEATURE_FLAGS).some(Boolean);
  _adapter = anyApiEnabled ? weeerApiAdapter : weeerLocalStorageAdapter;
  return _adapter;
}

/** Reset adapter cache (ใช้ใน testing + hot-reload) */
export function resetAdapter(): void {
  _adapter = null;
}

// Re-export types สำหรับ WeeeR modules
export type { IWeeerDAL } from "@app3r/dal";
export * from "@app3r/dal";
