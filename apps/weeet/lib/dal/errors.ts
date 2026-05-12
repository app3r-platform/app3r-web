/**
 * apps/weeet/lib/dal/errors.ts
 * Phase D-1 — DAL error types สำหรับ WeeeT
 */

/** NotImplementedError — ใช้ใน apiAdapter skeleton (D-2 scope) */
export class NotImplementedError extends Error {
  constructor(scope: string) {
    super(`Not implemented — ${scope}`);
    this.name = "NotImplementedError";
  }
}

/** DALError — ข้อผิดพลาดทั่วไปของ DAL layer */
export class DALError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "DALError";
  }
}
