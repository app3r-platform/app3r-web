/**
 * parts-returns.ts — D-6 Parts B2B: Defective Return + Warranty
 *
 * POST  /api/v1/parts/orders/:id/return-defective/  — buyer รายงาน defective
 * POST  /api/v1/parts/orders/:id/refund-approve/    — seller อนุมัติ/ปฏิเสธ return
 * GET   /api/v1/parts/orders/:id/return/            — ดูสถานะ return
 * GET   /api/v1/parts/orders/:id/warranty/          — ดูข้อมูล warranty
 *
 * ⚠️ ต่างจาก dispute (parts_disputes) ที่ใช้ใน Sub-8:
 *    parts_returns = สินค้าชำรุด/ผิดสเปค → คืน/เปลี่ยน/เครดิต
 *    parts_disputes = โต้แย้งทั่วไป (ของไม่มา/ไม่ตรงปก) → admin resolve
 *
 * Auth: required
 * Error format: { detail: "..." }
 *
 * Migration: 0021_d6_parts_b2b.sql
 */
import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { db } from '../db/client'
import { partsReturns, partsOrders, partsListings, partsOrderItems } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { verifyAccessToken } from '../lib/jwt'

export const partsReturnsRouter = new OpenAPIHono()

// ── Auth helper ──────────────────────────────────────────────────────────────
async function requireAuth(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

const err = (detail: string) => ({ detail })

function mapReturn(row: typeof partsReturns.$inferSelect) {
  return {
    id: row.id,
    orderId: row.orderId,
    reportedBy: row.reportedBy,
    reason: row.reason,
    defectDescription: row.defectDescription,
    evidencePhotos: row.evidencePhotos ?? [],
    status: row.status,
    resolutionType: row.resolutionType ?? null,
    resolvedBy: row.resolvedBy ?? null,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

// ── GET /orders/:id/warranty/ — ดูข้อมูล warranty ──────────────────────────
partsReturnsRouter.get('/:id/warranty', async (c) => {
  const user = await requireAuth(c)
  if (!user) return c.json(err('กรุณาเข้าสู่ระบบ'), 401)

  const { id } = c.req.param()

  const [order] = await db
    .select()
    .from(partsOrders)
    .where(eq(partsOrders.id, id))
    .limit(1)

  if (!order) return c.json(err('ไม่พบ order'), 404)

  // ตรวจ permission: buyer หรือ seller เท่านั้น
  if (order.buyerId !== user.userId) {
    return c.json(err('ไม่มีสิทธิ์ดู warranty ของ order นี้'), 403)
  }

  // ดึง warranty จาก listing (single-item) หรือ order_items (multi-item)
  let warrantyDays = 7 // default
  let closedAt: Date | null = order.closedAt ?? null

  // ลอง get warranty จาก listing (Sub-8 single-item)
  if (order.partId) {
    // partId ใน Sub-8 ชี้ไป parts_inventory ไม่ใช่ parts_listings
    // สำหรับ multi-item → ดูจาก order_items → listings
    const items = await db
      .select({ listing: partsListings })
      .from(partsOrderItems)
      .innerJoin(partsListings, eq(partsOrderItems.listingId, partsListings.id))
      .where(eq(partsOrderItems.orderId, id))

    if (items.length > 0) {
      // ใช้ warranty น้อยสุดในกลุ่ม order items
      warrantyDays = Math.min(...items.map((i) => i.listing.warrantyDays))
    }
  }

  // คำนวณวันหมดประกัน
  const warrantyExpiry = closedAt
    ? new Date(closedAt.getTime() + warrantyDays * 24 * 60 * 60 * 1000)
    : null

  const now = new Date()
  const daysRemaining = warrantyExpiry
    ? Math.max(0, Math.ceil((warrantyExpiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
    : null

  const isUnderWarranty = warrantyExpiry ? now < warrantyExpiry : false

  return c.json({
    orderId: id,
    warrantyDays,
    closedAt: closedAt?.toISOString() ?? null,
    warrantyExpiry: warrantyExpiry?.toISOString() ?? null,
    daysRemaining,
    isUnderWarranty,
    canClaim: isUnderWarranty && order.status === 'closed',
  })
})

// ── POST /orders/:id/return-defective/ — buyer รายงาน defective ─────────────
partsReturnsRouter.post('/:id/return-defective', async (c) => {
  const user = await requireAuth(c)
  if (!user) return c.json(err('กรุณาเข้าสู่ระบบ'), 401)

  const { id } = c.req.param()

  const [order] = await db
    .select()
    .from(partsOrders)
    .where(eq(partsOrders.id, id))
    .limit(1)

  if (!order) return c.json(err('ไม่พบ order'), 404)
  if (order.buyerId !== user.userId) {
    return c.json(err('ไม่มีสิทธิ์แจ้งคืนสินค้าใน order นี้'), 403)
  }
  if (order.status !== 'closed' && order.status !== 'fulfilled') {
    return c.json(err('order ต้องอยู่ในสถานะ fulfilled หรือ closed จึงจะแจ้งคืนได้'), 409)
  }

  // ตรวจว่ามี return pending อยู่แล้วหรือไม่
  const [existing] = await db
    .select()
    .from(partsReturns)
    .where(and(eq(partsReturns.orderId, id), eq(partsReturns.status, 'pending')))
    .limit(1)

  if (existing) {
    return c.json(err('มีคำขอคืนสินค้า pending อยู่แล้ว'), 409)
  }

  const body = await c.req.json().catch(() => null)
  if (!body) return c.json(err('ข้อมูลไม่ถูกต้อง'), 400)

  const Schema = z.object({
    reason: z.enum(['defective', 'wrong_part', 'mismatch', 'quality']),
    defectDescription: z.string().min(10).max(1000),
    evidencePhotos: z.array(z.string()).max(5).default([]),
  })

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return c.json(err(parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ครบ'), 422)
  }

  const d = parsed.data

  const [created] = await db
    .insert(partsReturns)
    .values({
      orderId: id,
      reportedBy: user.userId,
      reason: d.reason,
      defectDescription: d.defectDescription,
      evidencePhotos: d.evidencePhotos,
      status: 'pending',
    })
    .returning()

  return c.json(mapReturn(created!), 201)
})

// ── POST /orders/:id/refund-approve/ — seller อนุมัติ/ปฏิเสธ return ──────────
partsReturnsRouter.post('/:id/refund-approve', async (c) => {
  const user = await requireAuth(c)
  if (!user) return c.json(err('กรุณาเข้าสู่ระบบ'), 401)

  const { id } = c.req.param()

  // ดึง return record ที่ pending
  const [ret] = await db
    .select()
    .from(partsReturns)
    .where(and(eq(partsReturns.orderId, id), eq(partsReturns.status, 'pending')))
    .limit(1)

  if (!ret) return c.json(err('ไม่พบคำขอคืนสินค้า pending'), 404)

  const body = await c.req.json().catch(() => null)
  if (!body) return c.json(err('ข้อมูลไม่ถูกต้อง'), 400)

  const Schema = z.object({
    approve: z.boolean(),
    resolutionType: z.enum(['refund', 'replace', 'credit']).optional(),
    notes: z.string().max(500).optional(),
  })

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return c.json(err(parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ครบ'), 422)
  }

  const d = parsed.data

  if (d.approve && !d.resolutionType) {
    return c.json(err('กรุณาระบุ resolutionType เมื่ออนุมัติ'), 422)
  }

  const newStatus = d.approve ? 'approved' : 'rejected'

  const [updated] = await db
    .update(partsReturns)
    .set({
      status: newStatus,
      resolutionType: d.approve ? d.resolutionType : null,
      resolvedBy: user.userId,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(partsReturns.id, ret.id))
    .returning()

  return c.json({
    ...mapReturn(updated!),
    message: d.approve
      ? `อนุมัติคำขอคืนสินค้า — resolution: ${d.resolutionType}`
      : 'ปฏิเสธคำขอคืนสินค้า',
  })
})

// ── GET /orders/:id/return/ — ดูสถานะ return ────────────────────────────────
partsReturnsRouter.get('/:id/return', async (c) => {
  const user = await requireAuth(c)
  if (!user) return c.json(err('กรุณาเข้าสู่ระบบ'), 401)

  const { id } = c.req.param()

  const [order] = await db
    .select()
    .from(partsOrders)
    .where(eq(partsOrders.id, id))
    .limit(1)

  if (!order) return c.json(err('ไม่พบ order'), 404)
  if (order.buyerId !== user.userId) {
    return c.json(err('ไม่มีสิทธิ์ดูข้อมูล return ของ order นี้'), 403)
  }

  const returns = await db
    .select()
    .from(partsReturns)
    .where(eq(partsReturns.orderId, id))
    .orderBy(partsReturns.createdAt)

  return c.json({ orderId: id, returns: returns.map(mapReturn) })
})
