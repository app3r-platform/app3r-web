/**
 * apps/weeet/lib/dal/index.ts
 * Phase D-2 — DAL entry point + per-module feature flags
 *
 * Per-module flags:
 *   NEXT_PUBLIC_WEEET_DAL_JOB_ASSIGN, JOB_STATUS, TECHNICIAN, WARRANTY
 *   NEXT_PUBLIC_WEEET_DAL_PAYMENT, UPLOAD, PUSH, LIVE_LOCATION
 * Values: "localStorage" (default) | "api"
 */

import type { WeeeTDAL } from "./types";
import { localStorageAdapter } from "./localStorageAdapter";
import { apiAdapter } from "./apiAdapter";

type AdapterType = "localStorage" | "api";

function resolveAdapter(moduleKey?: string): AdapterType {
  if (typeof process === "undefined") return "localStorage";
  if (moduleKey) {
    const perModule = process.env[`NEXT_PUBLIC_WEEET_DAL_${moduleKey.toUpperCase()}`];
    if (perModule === "api") return "api";
    if (perModule === "localStorage") return "localStorage";
  }
  const global = process.env.NEXT_PUBLIC_WEEET_DAL_ADAPTER;
  if (global === "api") return "api";
  return "localStorage";
}

export function getAdapter(): WeeeTDAL {
  return {
    jobAssign: resolveAdapter("JOB_ASSIGN") === "api" ? apiAdapter.jobAssign : localStorageAdapter.jobAssign,
    jobStatus: resolveAdapter("JOB_STATUS") === "api" ? apiAdapter.jobStatus : localStorageAdapter.jobStatus,
    technician: resolveAdapter("TECHNICIAN") === "api" ? apiAdapter.technician : localStorageAdapter.technician,
    warranty: resolveAdapter("WARRANTY") === "api" ? apiAdapter.warranty : localStorageAdapter.warranty,
    payment: resolveAdapter("PAYMENT") === "api" ? apiAdapter.payment : localStorageAdapter.payment,
    upload: resolveAdapter("UPLOAD") === "api" ? apiAdapter.upload : localStorageAdapter.upload,
    push: resolveAdapter("PUSH") === "api" ? apiAdapter.push : localStorageAdapter.push,
    liveLocation: resolveAdapter("LIVE_LOCATION") === "api" ? apiAdapter.liveLocation : localStorageAdapter.liveLocation,
  };
}

export function getModuleAdapter<K extends keyof WeeeTDAL>(module: K): WeeeTDAL[K] {
  const key = module.replace(/([A-Z])/g, "_$1").toUpperCase();
  const adapterType = resolveAdapter(key);
  if (adapterType === "api") return apiAdapter[module];
  return localStorageAdapter[module];
}

export function getActiveFlags() {
  return Object.fromEntries(
    ["JOB_ASSIGN","JOB_STATUS","TECHNICIAN","WARRANTY","PAYMENT","UPLOAD","PUSH","LIVE_LOCATION"]
      .map((m) => [m, resolveAdapter(m)])
  );
}

export type { WeeeTDAL, Result } from "./types";
export { NotImplementedError, DALError } from "./errors";
