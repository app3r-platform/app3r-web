/**
 * mock-runtime/mock-mode.ts — Mock-First Runtime Standard (CMD #115-V/W)
 *
 * MOCK_MODE = เฟส mockup ก่อนมี backend จริง (NEXT_PUBLIC_DEV_NAV=true)
 * → data layer ต้องไม่ยิง backend เลย (ไม่มี 500) → throw BACKEND_UNAVAILABLE ทันที
 * → ทุกหน้า fallback mock
 *
 * อ่าน env แบบ static literal (process.env.NEXT_PUBLIC_DEV_NAV) เพื่อให้ Next.js
 * inline ค่าตอน build (compiled chunk เป็น `"true"==="true"`) — verify ได้ระดับ bundle.
 */

export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_NAV === 'true'
}
