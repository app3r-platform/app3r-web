/**
 * jwt-auth.ts — Bearer token middleware
 * ใช้กับ route ที่ต้องการ authentication
 */
import { createMiddleware } from 'hono/factory'
import { verifyAccessToken, type AccessTokenPayload } from '../lib/jwt'

export type AuthVariables = {
  user: AccessTokenPayload
}

export const jwtAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' } },
        401,
      )
    }

    const token = authHeader.slice(7)
    try {
      const payload = await verifyAccessToken(token)
      c.set('user', payload)
      await next()
    } catch {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
        401,
      )
    }
  },
)
