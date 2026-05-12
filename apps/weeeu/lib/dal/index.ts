// ─── DAL Factory — Feature Flag (สวิตช์เปิด/ปิด) ────────────────────────────
// D84 Adapter Pattern: default = localStorageAdapter (Phase C mock)
// Phase D-2: ตั้ง env var ให้ true → สลับไป apiAdapter ทีละ module

import { localStorageAdapter } from "./localStorageAdapter";
import { apiAdapter } from "./apiAdapter";
import type { IWeeeuDAL } from "@app3r/shared/dal/weeeu";

// ─── Feature Flags (อ่านจาก environment variable) ──────────────────────────────
// ตั้งค่าใน .env.local — default OFF ทั้งหมด (= localStorageAdapter)

const FLAGS = {
  /** NEXT_PUBLIC_USE_API_AUTH=true → ใช้ apiAdapter สำหรับ auth module */
  useApiAuth: process.env.NEXT_PUBLIC_USE_API_AUTH === "true",
  /** NEXT_PUBLIC_USE_API_PROGRESS=true → ใช้ apiAdapter สำหรับ service progress */
  useApiProgress: process.env.NEXT_PUBLIC_USE_API_PROGRESS === "true",
  /** NEXT_PUBLIC_USE_API_APPLIANCES=true → ใช้ apiAdapter สำหรับ appliances */
  useApiAppliances: process.env.NEXT_PUBLIC_USE_API_APPLIANCES === "true",
  /** NEXT_PUBLIC_USE_API_REPAIR=true → ใช้ apiAdapter สำหรับ repair requests */
  useApiRepair: process.env.NEXT_PUBLIC_USE_API_REPAIR === "true",
} as const;

/**
 * getAdapter() — คืน DAL implementation ตาม feature flag
 *
 * Phase D-1: ทุก flag = OFF → localStorageAdapter ทั้งหมด
 * Phase D-2: ตั้ง flag ทีละ module → ค่อยๆ migrate (ย้าย) ไป apiAdapter
 *
 * @example
 * const dal = getAdapter();
 * const result = dal.serviceProgress.getAll();
 */
export function getAdapter(): IWeeeuDAL {
  return {
    auth: FLAGS.useApiAuth ? apiAdapter.auth : localStorageAdapter.auth,
    serviceProgress: FLAGS.useApiProgress
      ? apiAdapter.serviceProgress
      : localStorageAdapter.serviceProgress,
    appliances: FLAGS.useApiAppliances
      ? apiAdapter.appliances
      : localStorageAdapter.appliances,
    repairRequests: FLAGS.useApiRepair
      ? apiAdapter.repairRequests
      : localStorageAdapter.repairRequests,
  };
}

// ─── Named exports ──────────────────────────────────────────────────────────────

export { localStorageAdapter } from "./localStorageAdapter";
export { apiAdapter, NotImplementedError } from "./apiAdapter";
export type { IWeeeuDAL } from "@app3r/shared/dal/weeeu";

/** ดู flags ปัจจุบัน (สำหรับ debug/logging) */
export function getActiveFlags() {
  return { ...FLAGS };
}
