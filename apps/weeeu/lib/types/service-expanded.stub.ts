// ─── service-expanded.stub.ts — Sub-4 Wave 2 Services Table Full Expand ────────
// STUB: รอ Backend export types จาก @app3r/types/services
// ห้ามใช้ type เหล่านี้เป็น source-of-truth — Backend เป็นเจ้าของ schema
// เมื่อ Backend push types แล้ว: ลบ @ts-expect-error + import จาก @app3r/types/services แทน
//
// อ้างอิง: Sub-CMD-4 Master (360813ec-7277-818d-b672-e5e3446e1d20)
// Lesson #33: ห้าม cross-chat type creation — ใช้ @ts-expect-error stub เท่านั้น
// ─────────────────────────────────────────────────────────────────────────────

// TODO(sub-4): เมื่อ Backend export types แล้ว ให้ import จาก @app3r/types/services แทน
// import { ServicePriority, ServiceExpanded } from "@app3r/types/services";

/**
 * ServicePriority — STUB pending Backend type export
 * ลำดับความสำคัญของงานซ่อม (เพิ่มใน services table expand)
 */
export type ServicePriority = "normal" | "urgent" | "vip";

/**
 * ExpandedRepairFields — STUB: field ใหม่ที่ Backend เพิ่มใน services table
 * Sub-4 Wave 2: Services Table Full Expand
 *
 * หมายเหตุ: field เหล่านี้จะถูก merge เข้า RepairJobDetail เมื่อ Backend merge แล้ว
 * ตอนนี้ใช้เป็น optional extension เพื่อรองรับ API response ที่อาจมี field ใหม่
 */
export interface ExpandedRepairFields {
  // ─── Progress tracking (prerequisite สำหรับ Sub-5 Progress Tracker) ──────────
  /** ความคืบหน้าโดยรวม 0-100 (คำนวณจาก sub-stage) */
  progress_percent?: number | null;

  // ─── Diagnosis (บันทึกจากช่าง) ───────────────────────────────────────────────
  /** บันทึกการวินิจฉัยจากช่าง — เพิ่มตอน inspecting stage */
  diagnosis_note?: string | null;
  /** หมายเหตุจากช่างหลังซ่อมเสร็จ */
  technician_note?: string | null;

  // ─── Pricing breakdown (แยก labor + parts) ───────────────────────────────────
  /** ค่าแรง (labor cost) แยกจาก final_price */
  labor_cost?: number | null;
  /** ค่าอะไหล่ (parts cost) */
  parts_cost?: number | null;

  // ─── Warranty (ประกันงานซ่อม) ────────────────────────────────────────────────
  /** ระยะรับประกัน (วัน) — เพิ่มตอน closed stage */
  warranty_days?: number | null;
  /** วันที่ประกันหมดอายุ */
  warranty_expires_at?: string | null;

  // ─── Priority (ลำดับความสำคัญ) ───────────────────────────────────────────────
  /** ลำดับความสำคัญของงาน: normal | urgent | vip */
  priority?: ServicePriority | null;

  // ─── Customer input (ข้อมูลเพิ่มจากลูกค้า) ───────────────────────────────────
  /** หมายเหตุจากลูกค้าเพิ่มเติม (ระบุตอนแจ้งซ่อม) */
  customer_note?: string | null;
  /** งบประมาณสูงสุดที่ลูกค้าระบุ */
  budget_max?: number | null;

  // ─── Cancellation (ยกเลิก) ──────────────────────────────────────────────────
  /** เหตุผลยกเลิก */
  cancelled_reason?: string | null;
  /** เวลาที่ยกเลิก */
  cancelled_at?: string | null;
}

/**
 * PRIORITY_CONFIG — UI helper สำหรับแสดง priority badge
 */
export const PRIORITY_CONFIG: Record<ServicePriority, { label: string; cls: string; icon: string }> = {
  normal: { label: "ปกติ",     cls: "bg-gray-100 text-gray-600",   icon: "⚪" },
  urgent: { label: "เร่งด่วน", cls: "bg-orange-100 text-orange-700", icon: "🔶" },
  vip:    { label: "VIP",      cls: "bg-purple-100 text-purple-700", icon: "👑" },
};

/**
 * WARRANTY_PRESETS — ตัวเลือกระยะรับประกันที่ใช้บ่อย
 */
export const WARRANTY_PRESETS: Array<{ days: number; label: string }> = [
  { days: 0,   label: "ไม่มีประกัน" },
  { days: 7,   label: "7 วัน" },
  { days: 30,  label: "30 วัน" },
  { days: 90,  label: "90 วัน" },
  { days: 180, label: "6 เดือน" },
  { days: 365, label: "1 ปี" },
];
