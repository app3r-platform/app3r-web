// ── Money-safe display helpers (W0-followup-2) ──────────────────────────────
// CONSTRAINT (Advisor): ห้าม coalesce ราคา null → 0 (0 พอยต์ = ดูเหมือนฟรี = ผิด)
// null/undefined price → "ราคาไม่ระบุ" หรือ "—" (ซ่อน money field บน null)

/** money label พร้อม suffix — null = "ราคาไม่ระบุ" (ใช้เมื่อ markup รวม "พอยต์" ไว้ด้วย) */
export function pointsLabel(v: number | null | undefined): string {
  return v == null ? "ราคาไม่ระบุ" : `${v.toLocaleString()} พอยต์`;
}

/** number-only — null = "—" (ใช้เมื่อ markup มี suffix หน่วยแยกบรรทัด) */
export function pointsNumber(v: number | null | undefined): string {
  return v == null ? "—" : v.toLocaleString();
}
