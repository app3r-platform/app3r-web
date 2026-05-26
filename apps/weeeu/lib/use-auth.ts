/**
 * useAuth — minimal auth hook สำหรับ WeeeU
 *
 * Dev mode (NEXT_PUBLIC_DEV_NAV=true):
 *   คืน mockUser โดยไม่ต้องมี session จริง
 *
 * Production (Phase 4):
 *   TODO: ดึง user จาก session cookie / JWT context
 */

export type AuthUser = {
  id: string;
  name: string;
  role: "weeeu";
};

// Mock user สำหรับ dev walk-through
const DEV_MOCK_USER: AuthUser = {
  id: "dev-u001",
  name: "Dev User (WeeeU)",
  role: "weeeu",
};

/**
 * คืน AuthUser ปัจจุบัน
 * - DEV_NAV=true  → DEV_MOCK_USER (ไม่ต้อง fetch)
 * - otherwise     → null (Phase 4 จะ resolve จาก session)
 *
 * หมายเหตุ: ใช้ใน client component เท่านั้น
 */
export function useAuth(): AuthUser | null {
  if (process.env.NEXT_PUBLIC_DEV_NAV === "true") {
    return DEV_MOCK_USER;
  }
  // TODO Phase 4: return user from session/JWT context
  return null;
}