/**
 * points.ts — Phase D Sprint D-1: Point API (Gold + Silver balance, topup, withdraw)
 *
 * GET  /points/balance  — ดูยอดคงเหลือ (Gold + Silver)
 * POST /points/topup    — เติม Gold (admin หรือ payment callback) · D75 rounding log
 * POST /points/withdraw — ถอน Gold (user request) · debit wallet atomically
 *
 * ยึด point_service.ts (creditGold / debitGold / roundD75) เป็น single source
 * D75 rounding: ถ้า amountThb มีทศนิยม → roundD75 → บันทึก point_rounding_log
 *
 * ⚠️ point_type 'cash' = Gold (เงินจริง 1 Gold = 1 บาท)
 * ⚠️ point_type 'bonus' = Silver (โปรโมชัน, ไม่แปลงเป็นเงิน)
 */
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { wallets, pointRoundingLog, pointLedger } from '../db/schema'
import {
  creditGold,
  debitGold,
  getGoldBalance,
  roundD75,
  GOLD_POINT_TYPE,
} from '../lib/point-service'
import { jwtAuth, type AuthVariables } from '../middleware/jwt-auth'

export const pointsRouter = new OpenAPIHono<{ Variables: AuthVariables }>()

// Protect all /points/* routes
pointsRouter.use('/points/*', jwtAuth)

// ── Shared schema ─────────────────────────────────────────────────────────────

const ErrorSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
  })
  .openapi('PointsErrorResponse')

// ── GET /points/balance ────────────────────────────────────────────────────────

const BalanceResponseSchema = z
  .object({
    gold: z.number().int().openapi({ description: 'Gold Point balance (1 Gold = 1 บาท)' }),
    silver: z.number().int().openapi({ description: 'Silver Point balance (โปรโมชัน)' }),
  })
  .openapi('PointsBalanceResponse')

const balanceRoute = createRoute({
  method: 'get',
  path: '/points/balance',
  tags: ['Points'],
  summary: 'Get current user Gold + Silver balance',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: BalanceResponseSchema } },
      description: 'Current point balances',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
  },
})

pointsRouter.openapi(balanceRoute, async (c) => {
  const { userId } = c.get('user')

  // Query both Gold and Silver balances at once
  const rows = await db
    .select({ pointType: wallets.pointType, balance: wallets.balance })
    .from(wallets)
    .where(eq(wallets.userId, userId))

  const gold = rows.find((r) => r.pointType === GOLD_POINT_TYPE)?.balance ?? 0
  const silver = rows.find((r) => r.pointType === 'bonus')?.balance ?? 0

  return c.json({ gold, silver }, 200)
})

// ── POST /points/topup ────────────────────────────────────────────────────────

const TopupBodySchema = z
  .object({
    // amount in THB (decimal OK → D75 rounding applied before crediting)
    amountThb: z
      .number()
      .positive()
      .openapi({ example: 100, description: 'Amount in THB to top up as Gold Points' }),
    // optional reference (e.g. payment gateway ref, transfer ID)
    reference: z
      .string()
      .max(200)
      .optional()
      .openapi({ example: 'transfer:abc123', description: 'Source reference' }),
    // who initiated this topup (for admin manual topups)
    initiatedBy: z
      .enum(['user', 'admin', 'payment_gateway'])
      .default('user'),
  })
  .openapi('PointsTopupBody')

const TopupResponseSchema = z
  .object({
    goldCredited: z.number().int(),
    balanceAfter: z.number().int(),
    rounded: z.boolean().openapi({ description: 'true ถ้ามีการ round D75' }),
  })
  .openapi('PointsTopupResponse')

const topupRoute = createRoute({
  method: 'post',
  path: '/points/topup',
  tags: ['Points'],
  summary: 'Top up Gold Points (D75 rounding applied if decimal)',
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: TopupBodySchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: TopupResponseSchema } },
      description: 'Gold credited successfully',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
    422: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid amount',
    },
  },
})

pointsRouter.openapi(topupRoute, async (c) => {
  const { userId } = c.get('user')
  const { amountThb, reference, initiatedBy } = c.req.valid('json')

  // D75 rounding: ปัด THB amount เป็น integer Gold
  const goldRaw = amountThb
  const goldCredited = roundD75(goldRaw)
  const wasRounded = goldRaw !== goldCredited

  const idempotencyKey = `topup:${userId}:${Date.now()}`
  const ref = reference ?? `topup:manual:${userId}`

  const balanceAfter = await db.transaction(async (tx) => {
    const after = await creditGold(tx, {
      userId,
      amount: goldCredited,
      reference: ref,
      idempotencyKey,
      type: 'earn',
      metadata: { initiatedBy, amountThbOriginal: goldRaw },
    })

    // D75 rounding log — บันทึกเฉพาะเมื่อมีการ round
    if (wasRounded) {
      // Get the ledger row we just inserted (latest for this user)
      const [latestLedger] = await tx
        .select({ id: pointLedger.id })
        .from(pointLedger)
        .where(
          and(
            eq(pointLedger.userId, userId),
            eq(pointLedger.idempotencyKey, idempotencyKey),
          ),
        )
        .limit(1)

      if (latestLedger) {
        const delta = goldCredited - goldRaw
        await tx.insert(pointRoundingLog).values({
          originalValue: String(goldRaw),
          roundedValue: goldCredited,
          delta: String(delta),
          direction: delta >= 0 ? 'up' : 'down',
          ledgerId: latestLedger.id,
          feeType: 'topup',
          app: 'backend',
          formula: 'Math.round(amountThb)',
        })
      }
    }

    return after
  })

  return c.json({ goldCredited, balanceAfter, rounded: wasRounded }, 200)
})

// ── POST /points/withdraw ─────────────────────────────────────────────────────

const WithdrawBodySchema = z
  .object({
    goldAmount: z
      .number()
      .int()
      .positive()
      .openapi({ example: 50, description: 'Gold Points to withdraw (integer)' }),
    // optional bank account reference for the payout
    bankReference: z
      .string()
      .max(200)
      .optional()
      .openapi({ description: 'Bank account / PromptPay reference for payout' }),
  })
  .openapi('PointsWithdrawBody')

const WithdrawResponseSchema = z
  .object({
    goldDebited: z.number().int(),
    balanceAfter: z.number().int(),
  })
  .openapi('PointsWithdrawResponse')

const withdrawRoute = createRoute({
  method: 'post',
  path: '/points/withdraw',
  tags: ['Points'],
  summary: 'Withdraw Gold Points (debit wallet)',
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: WithdrawBodySchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: WithdrawResponseSchema } },
      description: 'Gold debited successfully',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Insufficient balance',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
  },
})

pointsRouter.openapi(withdrawRoute, async (c) => {
  const { userId } = c.get('user')
  const { goldAmount, bankReference } = c.req.valid('json')

  const idempotencyKey = `withdraw:${userId}:${Date.now()}`
  const ref = bankReference ?? `withdraw:manual:${userId}`

  try {
    const balanceAfter = await db.transaction(async (tx) => {
      return debitGold(tx, {
        userId,
        amount: goldAmount,
        reference: ref,
        idempotencyKey,
        type: 'spend',
        metadata: { reason: 'withdraw', bankReference },
      })
    })

    return c.json({ goldDebited: goldAmount, balanceAfter }, 200)
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('INSUFFICIENT_GOLD')) {
      const currentBalance = await db.transaction((tx) => getGoldBalance(tx, userId))
      return c.json(
        {
          error: {
            code: 'INSUFFICIENT_GOLD',
            message: `Insufficient Gold balance. Have ${currentBalance}, need ${goldAmount}`,
          },
        },
        400,
      )
    }
    throw err
  }
})
