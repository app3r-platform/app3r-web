/**
 * wallet.ts — D2 go-live P0: authenticated Gold (cash) balance (HUB Gen89)
 *
 * Mounted at: /api/v1/wallet
 *   GET /api/v1/wallet/gold-balance  → { balance } — caller's own Gold/cash balance (self only · JWT)
 *
 * Reuses point-service.getGoldBalance (single source of truth · NO recompute). Self-scoped: balance is
 * always derived from the JWT userId — never a caller-supplied id (no cross-user exposure). No schema change.
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { db } from '../db/client'
import { verifyAccessToken } from '../lib/jwt'
import { getGoldBalance } from '../lib/point-service'

export const walletRouter = new OpenAPIHono()

async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

const goldBalanceRoute = createRoute({
  method: 'get',
  path: '/gold-balance',
  tags: ['Wallet'],
  summary: "Authenticated user's Gold (cash) balance",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ balance: z.number() }) } },
      description: 'Gold/cash balance for the authenticated user',
    },
    401: { description: 'Unauthorized' },
  },
})

walletRouter.openapi(goldBalanceRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)
  }
  // self only — userId from JWT, never from request input
  const balance = await db.transaction((tx) => getGoldBalance(tx, user.userId))
  return c.json({ balance }, 200)
})
