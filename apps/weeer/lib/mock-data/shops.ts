// ── Shop Mock Data — Phase C-6 ────────────────────────────────────────────────
// ข้อมูลร้านค้าตัวอย่าง 6 ร้าน สำหรับ ShopIdSwitcher (สวิตช์สลับร้าน)

import type { ShopMock } from "../../app/(app)/parts/_lib/types";

export const SHOPS_MOCK: ShopMock[] = [
  { id: "S001", name: "ร้านซ่อมแอร์ ABC",        address: "สุขุมวิท กรุงเทพฯ",    pointsBalance: 12500, escrowHeld: 0 },
  { id: "S002", name: "ช่างไฟฟ้า XYZ",            address: "ลาดพร้าว กรุงเทพฯ",    pointsBalance: 8200,  escrowHeld: 0 },
  { id: "S003", name: "อะไหล่เครื่องใช้ไฟฟ้า ดี",  address: "นนทบุรี",               pointsBalance: 15000, escrowHeld: 0 },
  { id: "S004", name: "ซ่อมแอร์ นครปฐม",          address: "นครปฐม",               pointsBalance: 5500,  escrowHeld: 0 },
  { id: "S005", name: "อะไหล่ราคาถูก เชียงใหม่",   address: "เชียงใหม่",             pointsBalance: 9800,  escrowHeld: 0 },
  { id: "S006", name: "เทคนิค เครื่องเย็น PRO",   address: "สมุทรปราการ",           pointsBalance: 20000, escrowHeld: 0 },
];

export function getShopById(id: string): ShopMock | undefined {
  return SHOPS_MOCK.find((s) => s.id === id);
}
