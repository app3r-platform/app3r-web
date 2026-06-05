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
 * Mock user identities ต่อ role — primary persona (ใช้ filter listings: WeeeU เห็นเฉพาะของตัวเอง)
 * ⚠️ id ต้องคงเดิม — group components กรอง "ของฉัน" จาก MOCK_USERS.weeeu.id
 */
export const MOCK_USERS: Record<Exclude<MockRole, "anonymous">, { id: string; name: string }> = {
  weeeu: { id: "user-001", name: "คุณ WeeeU Mock" },
  weeer: { id: "weeer-001", name: "ร้านมือสองมั่นใจ Mock" },
  weeet: { id: "weeet-001", name: "ช่างสมชาย Mock" },
};

/**
 * Fix-Wave A — ร้าน WeeeR ที่ช่าง WeeeT สังกัด (mock · แสดงในมุมขวาบน Navbar)
 * ช่างทำงานในนามร้าน WeeeR เสมอ (กฎธุรกิจ §9)
 */
export const WEEET_AFFILIATION = "ร้านมือสองมั่นใจ Mock";

/**
 * Round 2 WP-0.4 — Dev Mock Role multi-user (กฎธุรกิจ §11 · เลนส์ #6)
 * user จำลอง >1 ราย ต่อ role หลายสถานการณ์ เพื่อทดสอบ role-aware view ให้ครบเคส
 * (ประกาศครบทุกโมดูล / ขายหลายประกาศ / ร้านรออนุมัติ ฯลฯ). persona แรกของแต่ละ
 * role = primary (ตรงกับ MOCK_USERS). ใช้แสดงใน MockAuthSwitcher เป็นทางเลือก
 * สถานการณ์ — ไม่กระทบ logic กรองเดิม.
 */
export interface MockUserScenario {
  id: string;
  name: string;
  /** สถานการณ์จำลอง (mock scenario) สำหรับเลือกทดสอบ */
  scenario: string;
  /** ป้ายสถานะ (mockup) */
  status: string;
}

export const MOCK_USER_SCENARIOS: Record<Exclude<MockRole, "anonymous">, MockUserScenario[]> = {
  weeeu: [
    { id: "user-001", name: "คุณ WeeeU Mock", scenario: "ประกาศครบทุกโมดูล (ซ่อม/บำรุง/ขาย/ซาก)", status: "ใช้งานปกติ" },
    { id: "user-002", name: "คุณมานี ขายเยอะ", scenario: "ขายมือสอง 4 ประกาศพร้อมกัน", status: "ผู้ขายตัวยง" },
    { id: "user-003", name: "คุณใหม่ มือใหม่", scenario: "ยังไม่มีประกาศ (empty-state)", status: "สมาชิกใหม่" },
  ],
  weeer: [
    { id: "weeer-001", name: "ร้านมือสองมั่นใจ Mock", scenario: "ร้านอนุมัติแล้ว — ยื่นข้อเสนอได้", status: "อนุมัติแล้ว" },
    { id: "weeer-002", name: "ร้านซ่อมรออนุมัติ", scenario: "สมัครแล้วรอ admin อนุมัติ", status: "รออนุมัติ" },
  ],
  weeet: [
    { id: "weeet-001", name: "ช่างสมชาย Mock", scenario: "ช่างว่าง — รับงานได้", status: "ว่าง" },
    { id: "weeet-002", name: "ช่างสมหญิง", scenario: "กำลังทำงานอยู่ 1 งาน", status: "มีงาน" },
  ],
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
