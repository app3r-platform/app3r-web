// D84 admin_config types — App3R-Admin W-Round-1 Wave 2
// Local mirror of backend route /api/v1/admin/config contract (read-only mirror — ห้ามแก้ backend).
// Mockup rule (Lesson #33/#34): types kept local, no cross-import from packages/shared/dal.

export type BadRecordAction = 'suspend' | 'escalate'

/** ระดับการระงับ (suspend tier) — admin ปรับ threshold/window/duration + เปิด/ปิดได้ (D84 spec) */
export interface BadRecordTier {
  /** threshold — จำนวน bad_record ที่ทำให้เข้าระดับนี้ */
  count: number
  /** window — ช่วงวันที่นับ bad_record */
  windowDays: number
  action: BadRecordAction
  /** ระยะเวลาที่ระงับลงประกาศ (วัน) */
  durationDays: number
  /** เปิด/ปิดระดับ (D84) — ไม่มี = ถือว่าเปิด (backward-compatible กับ seed เดิม) */
  enabled?: boolean
}

/** ค่า JSON ของ key='bad_record_policy' (ตรง seed 0003_d84_admin_config.ts) */
export interface BadRecordPolicy {
  tiers: BadRecordTier[]
  /** ≥ n bad_record (lifetime) → escalate Super Admin */
  lifetimeEscalateAt: number
  /** เปิด/ปิดระดับ escalate (D84) — ไม่มี = ถือว่าเปิด */
  lifetimeEscalateEnabled?: boolean
  /** cool-down — ช่วงวันรีเซ็ตการประเมินระดับ */
  coolDownDays: number
}

/** 1 รายการ config (GET /admin/config item / GET /admin/config/:key) */
export interface AdminConfigEntry<V = unknown> {
  key: string
  value: V
  description: string | null
  updatedBy: string | null
  updatedAt: string
}

export interface AdminConfigListResponse {
  items: AdminConfigEntry[]
}

/** 1 แถวประวัติการแก้ไข (GET /admin/config/:key/audit) */
export interface AdminConfigAuditEntry {
  id: string
  configKey: string
  oldValue: unknown | null
  newValue: unknown
  changedBy: string | null
  changedAt: string
}

export interface AdminConfigAuditResponse {
  items: AdminConfigAuditEntry[]
}

export const BAD_RECORD_POLICY_KEY = 'bad_record_policy'

/** Default ตาม D84 spec — ใช้เมื่อ backend ยังไม่ seed (กัน UI พังกรณีไม่มี key) */
export const DEFAULT_BAD_RECORD_POLICY: BadRecordPolicy = {
  tiers: [
    { count: 3, windowDays: 30, action: 'suspend', durationDays: 7, enabled: true },
    { count: 5, windowDays: 30, action: 'suspend', durationDays: 30, enabled: true },
  ],
  lifetimeEscalateAt: 10,
  lifetimeEscalateEnabled: true,
  coolDownDays: 30,
}
