/**
 * dev-guard.ts — hard-fail any `_dev` route when NODE_ENV=production (HUB Gen86 · SECURITY)
 *
 * Dev-only backdoors (e.g. a future `/_dev/get-test-token` that mints a JWT without
 * credentials) must NEVER be reachable in production — even if a later commit mounts
 * such a route unconditionally. This guard rejects at the edge (hard-fail), not merely
 * by "not mounting" the route. Pairs with the FE W0 guard (NODE_ENV + NEXT_PUBLIC_DEV_NAV
 * + CI grep-gate) so the dev bypass cannot leak into prod at any layer.
 *
 * Matches ANY path that contains a `_dev` segment, regardless of mount point
 * (`/_dev/...`, `/api/v1/_dev/...`, ...).
 *
 * Reads `process.env.NODE_ENV` at request time (not the frozen `env.NODE_ENV` parsed once
 * at import) so the check reflects the live deploy environment and stays unit-testable.
 * Same dynamic-read pattern as lib/config.ts `validateSdkConfig`.
 */
import type { MiddlewareHandler } from 'hono'

const DEV_SEGMENT = '_dev'

export const devRouteGuard: MiddlewareHandler = async (c, next) => {
  const isDevRoute = c.req.path.split('/').includes(DEV_SEGMENT)
  if (isDevRoute && process.env.NODE_ENV === 'production') {
    // 404 (not 403) — hard-fail without revealing that the dev route exists.
    // Distinct error code so callers/tests can assert it was an active reject, not a plain miss.
    return c.json(
      { error: { code: 'DEV_ROUTE_DISABLED', message: 'Dev-only route is disabled in production' } },
      404,
    )
  }
  await next()
}
