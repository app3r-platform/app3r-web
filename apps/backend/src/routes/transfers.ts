/**
 * transfers.ts — Sub-CMD-2: Manual Bank Transfer API
 *
 * อ.PP decision: โอนตรง (manual bank transfer) เป็น primary Phase D-2
 * Decision Record C: 360813ec-7277-8143-9011-ca6cd91b621d
 *
 * POST   /api/v1/transfers/deposit/           — user แจ้งโอน + upload สลิป
 * PATCH  /api/v1/transfers/deposit/:id/verify/ — Admin ยืนยัน → เพิ่มแต้ม
 * POST   /api/v1/transfers/withdraw/           — user ขอถอนแต้ม
 * PATCH  /api/v1/transfers/withdraw/:id/confirm/ — Admin ยืนยันโอนแล้ว → ลดแต้ม
 * GET    /api/v1/transfers/history/            — ประวัติ (ผู้ใช้ + Admin)
 * GET    /api/v1/transfers/qr/                 — PromptPay QR payload
 *
 * @needs-point-review: wallet/point_ledger sync on deposit.verify + withdraw.confirm
 * PDPA: slip images contain financial data — ownership check enforced
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { db } from '../db/client'
import { bankTransfers } from '../db/schema'
import { eq, and, or, desc } from 'drizzle-orm'
import { verifyAccessToken } from '../lib/jwt'
import { r2Adapter, generateR2Key } from '../lib/r2'
import { generatePromptPayQrForDeposit } from '../lib/promptpay'

export const transfersRouter = new OpenAPIHono()

// ── Auth helpers ─────────────────────────────────────────────────────────────
async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

const err = (detail: string) => ({ detail })

// ── Shared schema ─────────────────────────────────────────────────────────────
const TransferSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(['deposit', 'withdraw']),
  amountThb: z.string(),
  slipR2Key: z.string().nullable(),
  refNo: z.string().nullable(),
  promptpayRef: z.string().nullable(),
  status: z.string(),
  adminNote: z.string().nullable(),
  bankName: z.string().nullable(),
  accountNumber: z.string().nullable(),
  accountName: z.string().nullable(),
  verifiedBy: z.string().nullable(),
  verifiedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// Helper: DB row → response
function mapTransfer(row: typeof bankTransfers.$inferSelect): z.infer<typeof TransferSchema> {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as 'deposit' | 'withdraw',
    amountThb: String(row.amountThb),
    slipR2Key: row.slipR2Key ?? null,
    refNo: row.refNo ?? null,
    promptpayRef: row.promptpayRef ?? null,
    status: row.status,
    adminNote: row.adminNote ?? null,
    bankName: row.bankName ?? null,
    accountNumber: row.accountNumber ?? null,
    accountName: row.accountName ?? null,
    verifiedBy: row.verifiedBy ?? null,
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

// ── POST /deposit/ — ผู้ใช้แจ้งโอน ────────────────────────────────────────────
const depositRoute = createRoute({
  method: 'post',
  path: '/deposit/',
  tags: ['Transfers'],
  summary: 'User declares bank transfer deposit + R2 slip key (Sub-CMD-2)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            amountThb: z.number().positive(),
            slipR2Key: z.string().min(1),  // R2 key from POST /files/finalize
            refNo: z.string().optional(),  // reference from bank transfer
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Deposit declared, pending admin verification',
      content: { 'application/json': { schema: TransferSchema } },
    },
    401: { description: 'Unauthorized' },
  },
})

transfersRouter.openapi(depositRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const body = c.req.valid('json')

  // Generate PromptPay ref for tracking
  const tempId = crypto.randomUUID()
  const shopPhone = process.env.SHOP_PROMPTPAY_PHONE ?? process.env.TWILIO_SMS_FROM ?? ''
  let promptpayRef: string | null = null
  if (shopPhone) {
    const { promptpayRef: ref } = generatePromptPayQrForDeposit({
      shopPhone,
      amountThb: body.amountThb,
      transferId: tempId,
    })
    promptpayRef = ref
  }

  const [transfer] = await db
    .insert(bankTransfers)
    .values({
      id: tempId,
      userId: user.userId,
      type: 'deposit',
      amountThb: String(body.amountThb),
      slipR2Key: body.slipR2Key,
      refNo: body.refNo ?? null,
      promptpayRef,
      status: 'pending',
    })
    .returning()

  return c.json(mapTransfer(transfer), 201)
})

// ── PATCH /deposit/:id/verify/ — Admin ยืนยัน ─────────────────────────────────
const verifyDepositRoute = createRoute({
  method: 'patch',
  path: '/deposit/:id/verify/',
  tags: ['Transfers'],
  summary: 'Admin verifies deposit → credit user wallet (@needs-point-review)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            approve: z.boolean(),
            adminNote: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Deposit verified',
      content: { 'application/json': { schema: TransferSchema } },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Transfer not found' },
  },
})

transfersRouter.openapi(verifyDepositRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  // TODO D-3: add admin role check (user.role === 'admin')
  // For now: any authenticated user can verify (scaffolded — needs RBAC)

  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const newStatus = body.approve ? 'verified' : 'rejected'

  const [updated] = await db
    .update(bankTransfers)
    .set({
      status: newStatus,
      adminNote: body.adminNote ?? null,
      verifiedBy: user.userId,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(bankTransfers.id, id), eq(bankTransfers.type, 'deposit')))
    .returning()

  if (!updated) return c.json(err('Transfer not found.'), 404)

  if (body.approve) {
    // @needs-point-review: credit user wallet (debit bank → credit point_ledger)
    // TODO D-3: Point chat consultation → implement actual ledger credit
    console.log(`[Transfers] Deposit ${id} verified — @needs-point-review: credit ${updated.amountThb} THB to user ${updated.userId}`)
  }

  return c.json(mapTransfer(updated), 200)
})

// ── POST /withdraw/ — ผู้ใช้ขอถอน ────────────────────────────────────────────
const withdrawRoute = createRoute({
  method: 'post',
  path: '/withdraw/',
  tags: ['Transfers'],
  summary: 'User requests withdrawal — pending admin confirmation',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            amountThb: z.number().positive(),
            bankName: z.string().min(1),
            accountNumber: z.string().min(10),
            accountName: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Withdrawal requested, pending admin confirmation',
      content: { 'application/json': { schema: TransferSchema } },
    },
    401: { description: 'Unauthorized' },
  },
})

transfersRouter.openapi(withdrawRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const body = c.req.valid('json')

  // @needs-point-review: check user has sufficient balance before accepting request
  // TODO D-3: debit point_ledger (hold) when withdraw is requested

  const [transfer] = await db
    .insert(bankTransfers)
    .values({
      userId: user.userId,
      type: 'withdraw',
      amountThb: String(body.amountThb),
      bankName: body.bankName,
      accountNumber: body.accountNumber,
      accountName: body.accountName,
      status: 'pending',
    })
    .returning()

  return c.json(mapTransfer(transfer), 201)
})

// ── PATCH /withdraw/:id/confirm/ — Admin ยืนยันโอนแล้ว ───────────────────────
const confirmWithdrawRoute = createRoute({
  method: 'patch',
  path: '/withdraw/:id/confirm/',
  tags: ['Transfers'],
  summary: 'Admin confirms withdrawal transferred → debit user wallet (@needs-point-review)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            slipR2Key: z.string().optional(), // Admin slip สำหรับหลักฐาน
            adminNote: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Withdrawal confirmed',
      content: { 'application/json': { schema: TransferSchema } },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Transfer not found' },
  },
})

transfersRouter.openapi(confirmWithdrawRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  // TODO D-3: admin role check
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  const [updated] = await db
    .update(bankTransfers)
    .set({
      status: 'completed',
      slipR2Key: body.slipR2Key ?? null,
      adminNote: body.adminNote ?? null,
      verifiedBy: user.userId,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(bankTransfers.id, id), eq(bankTransfers.type, 'withdraw')))
    .returning()

  if (!updated) return c.json(err('Transfer not found.'), 404)

  // @needs-point-review: debit user point_ledger (withdraw confirmed)
  console.log(`[Transfers] Withdraw ${id} confirmed — @needs-point-review: debit ${updated.amountThb} THB from user ${updated.userId}`)

  return c.json(mapTransfer(updated), 200)
})

// ── GET /history/ — ประวัติ ────────────────────────────────────────────────────
const historyRoute = createRoute({
  method: 'get',
  path: '/history/',
  tags: ['Transfers'],
  summary: 'Transfer history — own records (Admin sees all)',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      type: z.enum(['deposit', 'withdraw']).optional(),
      status: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
  },
  responses: {
    200: {
      description: 'Transfer history list',
      content: { 'application/json': { schema: z.array(TransferSchema) } },
    },
    401: { description: 'Unauthorized' },
  },
})

transfersRouter.openapi(historyRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { type, status, limit } = c.req.valid('query')

  // TODO D-3: admin role → show all; user → own only
  let query = db
    .select()
    .from(bankTransfers)
    .where(eq(bankTransfers.userId, user.userId))
    .orderBy(desc(bankTransfers.createdAt))
    .limit(limit)
    .$dynamic()

  if (type) {
    query = query.where(and(eq(bankTransfers.userId, user.userId), eq(bankTransfers.type, type)))
  }
  if (status) {
    query = query.where(and(eq(bankTransfers.userId, user.userId), eq(bankTransfers.status, status)))
  }

  const rows = await query
  return c.json(rows.map(mapTransfer), 200)
})

// ── GET /qr/ — PromptPay QR payload ──────────────────────────────────────────
const qrRoute = createRoute({
  method: 'get',
  path: '/qr/',
  tags: ['Transfers'],
  summary: 'Generate PromptPay QR payload (EMVCo format)',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      amount: z.coerce.number().positive().optional(),
      transferId: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'PromptPay QR payload',
      content: {
        'application/json': {
          schema: z.object({
            payload: z.string(),
            promptpayRef: z.string(),
            shopPhone: z.string(),
            amountThb: z.number().nullable(),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
    503: { description: 'SHOP_PROMPTPAY_PHONE not configured' },
  },
})

transfersRouter.openapi(qrRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const shopPhone = process.env.SHOP_PROMPTPAY_PHONE
  if (!shopPhone) {
    return c.json(err('PromptPay not configured (set SHOP_PROMPTPAY_PHONE).'), 503)
  }

  const { amount, transferId } = c.req.valid('query')

  const { payload, promptpayRef } = generatePromptPayQrForDeposit({
    shopPhone,
    amountThb: amount ?? 0,
    transferId: transferId ?? crypto.randomUUID(),
  })

  return c.json({
    payload,
    promptpayRef,
    shopPhone,
    amountThb: amount ?? null,
  }, 200)
})

// ── GET /slip/:id — presign slip URL ──────────────────────────────────────────
const getSlipRoute = createRoute({
  method: 'get',
  path: '/slip/:id/',
  tags: ['Transfers'],
  summary: 'Get presigned slip URL (owner + admin only — PDPA)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Presigned slip URL',
      content: { 'application/json': { schema: z.object({ url: z.string(), expiresIn: z.number() }) } },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden — not your transfer' },
    404: { description: 'Transfer or slip not found' },
  },
})

transfersRouter.openapi(getSlipRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const [transfer] = await db
    .select()
    .from(bankTransfers)
    .where(eq(bankTransfers.id, id))

  if (!transfer) return c.json(err('Transfer not found.'), 404)
  if (transfer.userId !== user.userId) {
    // TODO D-3: allow admin role too
    return c.json(err('Access denied.'), 403)
  }
  if (!transfer.slipR2Key) return c.json(err('No slip for this transfer.'), 404)

  const url = await r2Adapter.presignGet(transfer.slipR2Key, 900)
  return c.json({ url, expiresIn: 900 }, 200)
})

// Suppress unused import
void or
void generateR2Key
