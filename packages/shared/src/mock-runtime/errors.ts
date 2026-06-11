/**
 * mock-runtime/errors.ts — Mock-First Runtime Standard (CMD #115-V/W)
 *
 * Error contract ที่ใช้สื่อสารระหว่าง data layer (request) → หน้าเพจ (caller)
 * - BACKEND_UNAVAILABLE → backend ไม่พร้อม (mock mode / network / 404 / 500)
 *                         → หน้าเพจ catch แล้ว fallback แสดง mock data (ห้ามเด้ง login)
 * - UNAUTHORIZED        → 401 จริงเท่านั้น → หน้าเพจ redirect ไป /login ได้
 *
 * เหตุผลที่ใช้ Error(message) ตรงๆ (ไม่ใช่ subclass): apps เดิม (Admin pilot 99bf696)
 * เทียบด้วย `err.message === ERR_*` อยู่แล้ว — รักษา contract เดิมเพื่อ drop-in.
 */

export const ERR_BACKEND_UNAVAILABLE = 'BACKEND_UNAVAILABLE'
export const ERR_UNAUTHORIZED = 'UNAUTHORIZED'

/** true ถ้า error สื่อว่า backend ไม่พร้อม → caller ควร fallback mock */
export function isBackendUnavailable(err: unknown): boolean {
  return err instanceof Error && err.message === ERR_BACKEND_UNAVAILABLE
}

/** true ถ้าเป็น 401 จริง → caller ควร redirect ไป login */
export function isUnauthorized(err: unknown): boolean {
  return err instanceof Error && err.message === ERR_UNAUTHORIZED
}
