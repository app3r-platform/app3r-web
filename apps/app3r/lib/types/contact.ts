// ============================================================
// lib/types/contact.ts — Stub mirror ของ Contact DTOs
// Phase D-4 Sub-4 — D78 8 topics (realign จาก C-4.2)
// ห้าม import จาก packages/shared/dal/ โดยตรง (Lesson #33)
// ============================================================

/** D78 authoritative 8 contact categories */
export type ContactCategory =
  | 'general'
  | 'sales'
  | 'support'
  | 'partnership'
  | 'press'
  | 'feedback'
  | 'careers'
  | 'other';

/** Alias สำหรับ backward-compat กับ component ที่ใช้ ContactTopic */
export type ContactTopic = ContactCategory;

/** Input สำหรับ POST /api/contact — ตรงกับ CreateContactMessageInput ใน Backend */
export interface CreateContactMessageInput {
  category: ContactCategory;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  body: string;
}

/** ข้อมูลติดต่อบริษัท — ใช้ใน ContactInfoCard */
export interface ContactInfo {
  companyName: string;
  address: string;
  phones: string[];
  emails: { label: string; email: string }[];
  businessHours: string;
  lineId: string;
}
