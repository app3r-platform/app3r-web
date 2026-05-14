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
  /** NEXT_PUBLIC_USE_API_UPLOAD=true → ใช้ apiAdapter สำหรับ file upload (D87) */
  useApiUpload: process.env.NEXT_PUBLIC_USE_API_UPLOAD === "true",
  /** NEXT_PUBLIC_USE_API_PUSH=true → ใช้ apiAdapter สำหรับ push notification (D88) */
  useApiPush: process.env.NEXT_PUBLIC_USE_API_PUSH === "true",
  /** NEXT_PUBLIC_USE_API_PAYMENT=true → ใช้ apiAdapter สำหรับ payment (D89) */
  useApiPayment: process.env.NEXT_PUBLIC_USE_API_PAYMENT === "true",
  /** NEXT_PUBLIC_USE_API_LOCATION=true → ใช้ apiAdapter สำหรับ location (D90) */
  useApiLocation: process.env.NEXT_PUBLIC_USE_API_LOCATION === "true",
  /** NEXT_PUBLIC_USE_API_TRANSFER=true → ใช้ apiAdapter สำหรับ manual bank transfer (Decision Record C) */
  useApiTransfer: process.env.NEXT_PUBLIC_USE_API_TRANSFER === "true",
} as const;

/**
 * getAdapter() — คืน DAL implementation ตาม feature flag
 *
 * Phase D-1: ทุก flag = OFF → localStorageAdapter ทั้งหมด
 * Phase D-2: ตั้ง flag ทีละ module → ค่อยๆ migrate (ย้าย) ไป apiAdapter
 *
 * @example
 * const dal = getAdapter();
 * const result = await dal.upload.presign({ filename: "photo.jpg", ... });
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
    upload: FLAGS.useApiUpload ? apiAdapter.upload : localStorageAdapter.upload,
    push: FLAGS.useApiPush ? apiAdapter.push : localStorageAdapter.push,
    payment: FLAGS.useApiPayment ? apiAdapter.payment : localStorageAdapter.payment,
    location: FLAGS.useApiLocation ? apiAdapter.location : localStorageAdapter.location,
    transfer: FLAGS.useApiTransfer ? apiAdapter.transfer : localStorageAdapter.transfer,
  };
}

// ─── Named exports ──────────────────────────────────────────────────────────────

export { localStorageAdapter } from "./localStorageAdapter";
export { apiAdapter, NotImplementedError, authApiAsync, serviceProgressApiAsync } from "./apiAdapter";
export type { IWeeeuDAL } from "@app3r/shared/dal/weeeu";

/** ดู flags ปัจจุบัน (สำหรับ debug/logging) */
export function getActiveFlags() {
  return { ...FLAGS };
}
