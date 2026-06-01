// ============================================================
// lib/content/product-resell-map.ts — W-17 Ruling 5
// "สินค้าแนะนำ" (products) เป็นหน้ารวมที่ link เข้าสู่ประกาศมือสอง (resell)
// product id (prod0XX) ไม่ใช่ resell id (r0XX) → ต้อง map ด้วยมือ
// เพื่อให้ทุก card/redirect ชี้ไปยังประกาศ resell ที่มีอยู่จริง (ไม่ 404)
// ============================================================

/**
 * MOCK mapping: product id → resell listing id (จับคู่ตามหมวดสินค้า)
 * อ้างอิงประกาศใน lib/mock/resell.ts (r001–r012)
 * - prod001 แอร์            → r003 (Daikin 18,000 BTU)
 * - prod002 เครื่องซักผ้า   → r001 (Samsung 10 kg)
 * - prod003 ตู้เย็น         → r002 (LG 14 คิว)
 * - prod004 ทีวี            → r006 (Samsung 50" 4K)
 * - prod005 เครื่องดูดฝุ่น  → r005 (Dyson V8)
 * - prod006 ไมโครเวฟ        → r004 (Panasonic 20L)
 */
export const PRODUCT_RESELL_MAP: Record<string, string> = {
  prod001: 'r003',
  prod002: 'r001',
  prod003: 'r002',
  prod004: 'r006',
  prod005: 'r005',
  prod006: 'r004',
};

/** index ของประกาศ resell — ใช้เป็น fallback กัน orphan link ไม่ให้ 404 */
export const RESELL_INDEX_PATH = '/listings/resell';

/**
 * คืน resell listing id ที่ map กับ product id
 * ถ้าไม่พบ map → คืน '' เพื่อให้ caller fallback ไป index ได้
 */
export function productToResellId(productId: string): string {
  return PRODUCT_RESELL_MAP[productId] ?? '';
}

/**
 * คืน path ปลายทางสำหรับ product id
 * - มี map → /listings/resell/{resellId}
 * - ไม่มี map → /listings/resell (index, no 404)
 */
export function productToResellPath(productId: string): string {
  const resellId = PRODUCT_RESELL_MAP[productId];
  return resellId ? `${RESELL_INDEX_PATH}/${resellId}` : RESELL_INDEX_PATH;
}
