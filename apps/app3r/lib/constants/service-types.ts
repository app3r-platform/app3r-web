// ============================================================
// lib/constants/service-types.ts — 4 service types for Repair/Maintain
// Phase C-4.1b
// ============================================================

export const SERVICE_TYPES = {
  ON_SITE:       { id: 1 as const, label: 'ซ่อมนอกสถานที่', en: 'On-site Repair' },
  PICKUP_RETURN: { id: 2 as const, label: 'รับ-ซ่อม-ส่งคืน',  en: 'Pick-up & Return' },
  COUNTER:       { id: 3 as const, label: 'นำมาซ่อมที่ร้าน',  en: 'Counter Service' },
  SHIPPING:      { id: 4 as const, label: 'ส่งพัสดุมาซ่อม',   en: 'Shipping Service' },
} as const;

export type ServiceTypeKey = keyof typeof SERVICE_TYPES;

/** Maintain allows on-site only */
export const MAINTAIN_ALLOWED_TYPES = [1] as const;

/** Repair allows all 4 types */
export const ALL_SERVICE_TYPES = [1, 2, 3, 4] as const;

/** Lookup label by ID */
export function getServiceTypeLabel(id: number): string {
  const found = Object.values(SERVICE_TYPES).find((st) => st.id === id);
  return found ? found.label : String(id);
}
