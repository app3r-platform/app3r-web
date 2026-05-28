// ============================================================
// lib/auth/mock-role.ts — Mock Role types & constants
// W-2-B: DEV-only mock authentication for role-based view (D1+D3)
// ⚠️ R4 mitigation: ใช้เฉพาะเมื่อ NEXT_PUBLIC_DEV_NAV=true
// ============================================================

export type MockRole = "anonymous" | "weeeu" | "weeer" | "weeet";

// ใช้ cookie/storage key เดียวกับ DevAuthBanner เดิม (existing system) — sync ได้
export const MOCK_ROLE_COOKIE = "app3r-mock-role";
export const MOCK_ROLE_STORAGE = "app3r-mock-role";

export const MOCK_ROLES: { value: MockRole; label: string; color: string; emoji: string }[] = [
  { value: "anonymous", label: "ผู้เยี่ยมชม", color: "bg-gray-200 text-gray-800", emoji: "👤" },
  { value: "weeeu",     label: "WeeeU (ผู้ใช้ทั่วไป)", color: "bg-blue-200 text-blue-800", emoji: "🛒" },
  { value: "weeer",     label: "WeeeR (ร้านซ่อม)", color: "bg-orange-200 text-orange-800", emoji: "🔧" },
  { value: "weeet",     label: "WeeeT (ช่าง)", color: "bg-yellow-200 text-yellow-800", emoji: "👨‍🔧" },
];

/**
 * Mock user identities ต่อ role — ใช้ filter listings (เช่น WeeeU เห็นเฉพาะของตัวเอง)
 */
export const MOCK_USERS: Record<Exclude<MockRole, "anonymous">, { id: string; name: string }> = {
  weeeu: { id: "user-001", name: "คุณ WeeeU Mock" },
  weeer: { id: "weeer-001", name: "ร้านมือสองมั่นใจ Mock" },
  weeet: { id: "weeet-001", name: "ช่างสมชาย Mock" },
};

/**
 * R4 mitigation helper — ตรวจ env flag
 * @returns true ถ้า DEV_NAV เปิดใช้งาน (mock auth allowed)
 */
export function isDevNavEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEV_NAV === "true";
}

/**
 * Server-side helper (ใช้ใน Server Components ผ่าน cookies())
 * แยกจาก useMockRole.ts (client-only) เพื่อให้ Server Components เรียกได้
 * ⚠️ R4 guard: ตรวจ env flag เสมอ
 */
export function getMockRoleFromCookie(cookieValue: string | undefined): MockRole {
  if (!isDevNavEnabled()) return "anonymous";
  if (!cookieValue) return "anonymous";
  if (["anonymous", "weeeu", "weeer", "weeet"].includes(cookieValue)) {
    return cookieValue as MockRole;
  }
  return "anonymous";
}
