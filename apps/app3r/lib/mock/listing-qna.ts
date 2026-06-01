// ============================================================
// lib/mock/listing-qna.ts — MOCKUP-only Q&A seed data per listing
// Returns QnAItem[] (local view-model from QnAThread, NOT shared schema).
// Visibility is handled inside QnAThread by role; here we only seed content.
// ============================================================
import type { QnAItem } from "@/components/listings/QnAThread";

/**
 * Deterministic mock Q&A thread for a listing/job id.
 * ผสมคำถามจาก WeeeR (ร้าน) ที่ตอบแล้ว/ยังไม่ตอบ + WeeeU เพื่อให้เห็นพฤติกรรม
 * การกรองตาม role ใน QnAThread (owner เห็นทั้งหมด, WeeeR เห็นเฉพาะของตัวเอง,
 * คนอื่นเห็นเฉพาะที่ตอบแล้ว).
 */
export function getMockQnA(id: string): QnAItem[] {
  return [
    {
      id: `${id}-q1`,
      askerRole: "weeer",
      askerName: "ร้านช่างมั่นใจ",
      question: "รายการนี้ยังเปิดรับข้อเสนออยู่ไหมครับ?",
      answer: "ยังเปิดรับอยู่ครับ ยินดีพิจารณาทุกข้อเสนอ",
    },
    {
      id: `${id}-q2`,
      askerRole: "weeer",
      askerName: "ร้านช่างมั่นใจ",
      question: "สะดวกให้เข้าดูหน้างานช่วงวันหยุดได้ไหม?",
      // ยังไม่ตอบ — owner เห็น, คนอื่นไม่เห็น
    },
    {
      id: `${id}-q3`,
      askerRole: "weeeu",
      askerName: "คุณผู้ใช้ทั่วไป",
      question: "มีรับประกันหลังบริการกี่วันคะ?",
      answer: "มีรับประกันงาน 30 วันหลังส่งมอบครับ",
    },
  ];
}
