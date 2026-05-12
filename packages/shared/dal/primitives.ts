// ── @app3r/dal — Shared Primitives ───────────────────────────────────────────
// ⚠️  FILE OWNERSHIP: Sub-CMD-P3 (WeeeU) เป็นเจ้าของ primitives/index
// WeeeR สร้าง primitives.ts stub เพื่อหลีกเลี่ยง circular import
// P3 จะย้าย/ขยาย definitions เหล่านี้ตาม architecture ที่กำหนด

export type Result<T, E = Error> =
  | { success: true;  data: T }
  | { success: false; error: E };

export interface User {
  id: string;
  email: string;
  role: Role;
}

export type Role = "weeer" | "weeeu" | "weeet" | "admin";

export interface IDataAccessLayer {
  readonly adapterType: "localStorage" | "api";
  isReady(): boolean;
}

export class NotImplementedError extends Error {
  constructor(scope: string) {
    super(`Not implemented — scope: ${scope}`);
    this.name = "NotImplementedError";
  }
}
