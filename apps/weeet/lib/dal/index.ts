/**
 * apps/weeet/lib/dal/index.ts
 * Phase D-1 — DAL (Data Access Layer) entry point + feature flag
 *
 * Feature flag (ตัวเลือกเปิด/ปิดฟีเจอร์):
 *   NEXT_PUBLIC_WEEET_DAL_ADAPTER=localStorage  (default — Phase D-1)
 *   NEXT_PUBLIC_WEEET_DAL_ADAPTER=api           (Phase D-2 เมื่อ backend พร้อม)
 *
 * Per-module flags:
 *   NEXT_PUBLIC_WEEET_DAL_JOB_ASSIGN=localStorage
 *   NEXT_PUBLIC_WEEET_DAL_JOB_STATUS=localStorage
 *   NEXT_PUBLIC_WEEET_DAL_TECHNICIAN=localStorage
 *   NEXT_PUBLIC_WEEET_DAL_WARRANTY=localStorage
 */

import type { WeeeTDAL } from "./types";
import { localStorageAdapter } from "./localStorageAdapter";
import { apiAdapter } from "./apiAdapter";

type AdapterType = "localStorage" | "api";

function resolveAdapter(moduleKey?: string): AdapterType {
  if (typeof process === "undefined") return "localStorage";
  // Per-module flag (ถ้ามี) มีความสำคัญเหนือ global flag
  if (moduleKey) {
    const perModule = process.env[`NEXT_PUBLIC_WEEET_DAL_${moduleKey.toUpperCase()}`];
    if (perModule === "api") return "api";
    if (perModule === "localStorage") return "localStorage";
  }
  // Global flag
  const global = process.env.NEXT_PUBLIC_WEEET_DAL_ADAPTER;
  if (global === "api") return "api";
  return "localStorage"; // default OFF — Phase D-1
}

/**
 * getAdapter — ดึง DAL adapter ตาม feature flag
 * Default: localStorage (Phase D-1)
 */
export function getAdapter(): WeeeTDAL {
  const adapterType = resolveAdapter();
  if (adapterType === "api") return apiAdapter;
  return localStorageAdapter;
}

/**
 * getModuleAdapter — ดึง adapter สำหรับ module เฉพาะ
 * ให้ override per-module ได้โดยไม่ต้อง flip ทั้งหมด
 */
export function getModuleAdapter<K extends keyof WeeeTDAL>(
  module: K
): WeeeTDAL[K] {
  const adapterType = resolveAdapter(module);
  if (adapterType === "api") return apiAdapter[module];
  return localStorageAdapter[module];
}

// Re-export types
export type { WeeeTDAL, Result } from "./types";
export { NotImplementedError, DALError } from "./errors";
