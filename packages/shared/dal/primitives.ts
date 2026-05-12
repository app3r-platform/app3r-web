// ── @app3r/dal — Shared Primitives ───────────────────────────────────────────
// ⚠️  FILE OWNERSHIP: Sub-CMD-P3 (WeeeU) เป็นเจ้าของ primitives/index
// WeeeR สร้าง primitives.ts stub เพื่อหลีกเลี่ยง circular import
// P3 จะย้าย/ขยาย definitions เหล่านี้ตาม architecture ที่กำหนด

// primitives.ts — stub สร้างโดย P4 WeeeR (parallel dev)
// อัพเดตให้ตรงกับ authoritative types ใน index.ts (WeeeU เจ้าของ)
// ใช้โดย weeer.types.ts เท่านั้น — ห้าม import จากที่อื่น

export type Result<T> =
  | { ok: true;  data: T }
  | { ok: false; error: string; code?: string };

export interface User {
  id: string;
  email: string;
  role: Role;
}

export type Role = "weeer" | "weeeu" | "weeet" | "admin";

export interface IDataAccessLayer {
  readonly adapterName: string;
  isAvailable(): boolean;
}

export class NotImplementedError extends Error {
  constructor(scope: string) {
    super(`Not implemented — scope: ${scope}`);
    this.name = "NotImplementedError";
  }
}
