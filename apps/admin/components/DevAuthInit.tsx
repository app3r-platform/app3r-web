"use client";
/**
 * DevAuthInit — seeds dev bypass token in localStorage on mount
 * TODO: REMOVE BEFORE PROD — dev-only component (TD-05)
 * มีผลเฉพาะเมื่อ NEXT_PUBLIC_DEV_NAV=true
 * ลบ component นี้ + auth.ts DEV_BYPASS_KEY ตอน Phase 4
 */

import { useEffect } from "react";

export function DevAuthInit() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_NAV === "true") {
      // TODO: REMOVE BEFORE PROD — seed dev bypass token สำหรับ mockup mode
      localStorage.setItem("dev-admin-token", "dev-jwt-bypass");
    }
  }, []);
  return null;
}
