/**
 * rate-limit.ts — in-app per-IP rate limiter (HUB Gen89 · go-live P1 · SECURITY BAR)
 *
 * Brute-force / credential-stuffing guard for auth endpoints. No external dependency — in-memory
 * fixed-window counter keyed by (key, request-path, client-IP). Mirrors the existing routes/contact.ts
 * limiter, generalized into reusable middleware.
 *
 *   exceed limit within window → 429 + Retry-After (seconds)
 *
 * DISABLED under NODE_ENV=test: the existing integration suite signs up many users from the same
 * in-process client (no real IP) and would otherwise self-throttle (false regression). Enforcement
 * is proven directly in auth-rate-limit.test.ts by flipping NODE_ENV + sending a unique X-Forwarded-For.
 * Reads process.env.NODE_ENV at request time (same dynamic pattern as middleware/dev-guard.ts).
 */
import type { MiddlewareHandler } from 'hono'

export interface RateLimitOptions {
  /** max requests per window, per (path, IP) */
  limit: number
  /** window length in ms */
  windowMs: number
  /** namespace so distinct route groups keep separate buckets */
  key: string
}

function clientIp(c: Parameters<MiddlewareHandler>[0]): string {
  const xff = c.req.header('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  return c.req.header('x-real-ip') ?? 'unknown'
}

export function rateLimit(opts: RateLimitOptions): MiddlewareHandler {
  const buckets = new Map<string, { count: number; resetAt: number }>()
  return async (c, next) => {
    if (process.env.NODE_ENV === 'test') return next()
    const bucketKey = `${opts.key}:${c.req.path}:${clientIp(c)}`
    const now = Date.now()
    const entry = buckets.get(bucketKey)
    if (!entry || now > entry.resetAt) {
      buckets.set(bucketKey, { count: 1, resetAt: now + opts.windowMs })
      return next()
    }
    if (entry.count >= opts.limit) {
      c.header('Retry-After', String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))))
      return c.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many requests — slow down and try again later.' } },
        429,
      )
    }
    entry.count++
    return next()
  }
}
