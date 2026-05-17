// ============================================================
// lib/content/contact-routing.ts — D78 8 topics routing
// Phase D-4 Sub-4 — realign จาก C-4.2 (ไม่ใช่ reuse)
// ============================================================
import type { ContactTopic } from '../types/contact';

/** ป้ายชื่อหัวข้อภาษาไทยสำหรับแสดงใน UI */
export const topicLabels: Record<ContactTopic, string> = {
  general: 'คำถามทั่วไป',
  sales: 'ขาย / สอบถามราคา',
  support: 'ปัญหาการใช้งาน',
  partnership: 'พาร์ทเนอร์ / ร้านซ่อม',
  press: 'สื่อมวลชน',
  feedback: 'ข้อเสนอแนะ',
  careers: 'ร่วมงานกับเรา',
  other: 'อื่นๆ',
};

/**
 * CONTACT_ROUTING — อีเมลปลายทางสำหรับแต่ละ category (D78)
 * ใช้ array รองรับ multi-recipient ในอนาคต
 */
export const CONTACT_ROUTING: Record<ContactTopic, string[]> = {
  general: ['support@app3r.co.th'],
  sales: ['sales@app3r.co.th'],
  support: ['support@app3r.co.th'],
  partnership: ['partner@app3r.co.th'],
  press: ['press@app3r.co.th'],
  feedback: ['feedback@app3r.co.th'],
  careers: ['careers@app3r.co.th'],
  other: ['support@app3r.co.th'],
};

/** Helper — คืนอีเมลหลักของ topic (รายการแรก) */
export function getPrimaryEmail(topic: ContactTopic): string {
  return CONTACT_ROUTING[topic][0] ?? 'support@app3r.co.th';
}
