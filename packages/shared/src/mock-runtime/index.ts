/**
 * mock-runtime/index.ts — Mock-First Runtime Standard shared util (CMD #115-W Phase 2)
 *
 * FE infrastructure (runtime fallback behavior) — แยกจาก api-client.ts (Backend generate
 * จาก OpenAPI). Backend regenerate api-client/types → ไม่แตะ directory นี้ → ไม่ collision.
 *
 * extract จาก Admin pilot 99bf696 (Two-eyes PASS) ให้ 5 แอพ import ตัวเดียวกัน:
 *   import { createMockFirstApi, ERR_BACKEND_UNAVAILABLE } from '@app3r/shared/src/mock-runtime'
 *
 * โมดูล:
 *   - errors      : ERR_BACKEND_UNAVAILABLE / ERR_UNAUTHORIZED + type guards
 *   - mock-mode   : isMockMode() (NEXT_PUBLIC_DEV_NAV)
 *   - request     : createMockFirstApi() — data layer factory (get/post/patch/put)
 *   - dev-token   : createDevTokenProvider() — dev auth bypass (TODO: REMOVE BEFORE PROD)
 */

export {
  ERR_BACKEND_UNAVAILABLE,
  ERR_UNAUTHORIZED,
  isBackendUnavailable,
  isUnauthorized,
} from './errors'
export { isMockMode } from './mock-mode'
export { createMockFirstApi } from './request'
export type { MockFirstApi, MockFirstApiConfig } from './request'
export { createDevTokenProvider } from './dev-token'
export type { DevTokenConfig } from './dev-token'
