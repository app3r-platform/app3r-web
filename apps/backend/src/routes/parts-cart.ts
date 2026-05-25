/**
 * parts-cart.ts — D-6 Parts B2B: Cart + Multi-item Checkout
 *
 * POST   /api/v1/parts/cart/add/         — เพิ่มสินค้าลงตะกร้า
 * GET    /api/v1/parts/cart/             — ดูตะกร้า (จัดกลุ่มตามร้านผู้ขาย)
 * PATCH  /api/v1/parts/cart/:item_id/    — แก้จำนวน
 * DELETE /api/v1/parts/cart/:item_id/    — ลบออกจากตะกร้า
 * POST   /api/v1/parts/cart/checkout/    — checkout → สร้าง parts_orders (multi-item)
 *
 * Auth: required (weeer | weeet only)
 * กฎ: max 50 ชิ้น/listing · expire 24h · 1 buyer = 1 item per listing
 * Error format: { detail: "..." }
 *
 * ⚠️ checkout creates NEW parts_orders row with is_multi_item=true
 *    + parts_order_items rows — ไม่แตะ Sub-8 flow
 *
 * Migration: 0021_d6_parts_b2b.sql
 */
import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { db } from '../db/client'
import { partsCartItems, partsListings, partsOrders, partsOrderItems } from '../db/schema'
import { eq, and, gt, sql, inArray } from 'drizzle-orm'
import { verifyAccessToken } from '../lib/jwt'

export const partsCartRouter = new OpenAPIHono()

// ── Auth helper ──────────────────────────────────────────────────────────────
async function requireAuth(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

const err = (detail: string) => ({ detail })

// ── POST /cart/add/ ─────────────────────────────────────────────────────────
partsCartRouter.post('/add', async (c) => {
  const user = await requireAuth(c)
  if (!user) return c.json(err('กรุณาเข้าสู่ระบบ'), 401)

  const body = await c.req.json().catch(() => null)
  if (!body) return c.json(err('ข้อมูลไม่ถูกต้อง'), 400)

  const Schema = z.object({
    listingId: z.string().uuid(),
    qty: z.number().int().min(1).max(50),
    buyerRole: z.enum(['weeer', 'weeet']).default('weeer'),
  })
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return c.json(err(parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ครบ'), 422)
  }

  const { listingId, qty, buyerRole } = parsed.data

  // ตรวจ listing ว่า active และ stock เพียงพอ
  const [listing] = await db
    .select()
    .from(partsListings)
    .where(and(eq(partsListings.id, listingId), eq(partsListings.status, 'active')))
    .limit(1)

  if (!listing) return c.json(err('ไม่พบสินค้า หรือสินค้าไม่พร้อมขาย'), 404)

  const available = listing.qtyAvailable - listing.qtyReserved
  if (available < qty) {
    return c.json(err(`สินค้าคงเหลือไม่เพียงพอ (มี ${available} ชิ้น)`), 409)
  }

  // upsert: ถ้ามีอยู่แล้ว → อัพเดต qty + reset expire
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // +24h

  const existing = await db
    .select()
    .from(partsCartItems)
    .where(and(eq(partsCartItems.buyerId, user.userId), eq(partsCartItems.listingId, listingId)))
    .limit(1)

  if (existing.length > 0) {
    const newQty = Math.min(existing[0]!.qty + qty, 50)
    await db
      .update(partsCartItems)
      .set({ qty: newQty, expiresAt })
      .where(eq(partsCartItems.id, existing[0]!.id))
    return c.json({ success: true, action: 'updated', qty: newQty })
  }

  await db.insert(partsCartItems).values({
    buyerId: user.userId,
    buyerRole,
    listingId,
    qty,
    expiresAt,
  })

  return c.json({ success: true, action: 'added', qty }, 201)
})

// ── GET /cart/ ───────────────────────────────────────────────────────────────
partsCartRouter.get('/', async (c) => {
  const user = await requireAuth(c)
  if (!user) return c.json(err('กรุณาเข้าสู่ระบบ'), 401)

  const now = new Date()

  // ดึง cart items ที่ยังไม่หมดอายุ
  const items = await db
    .select({
      cartItem: partsCartItems,
      listing: partsListings,
    })
    .from(partsCartItems)
    .innerJoin(partsListings, eq(partsCartItems.listingId, partsListings.id))
    .where(
      and(
        eq(partsCartItems.buyerId, user.userId),
        gt(partsCartItems.expiresAt, now),
      ),
    )

  // จัดกลุ่มตามร้านผู้ขาย
  const grouped: Record<string, {
    sellerUserId: string
    items: typeof items
    subtotal: number
  }> = {}

  for (const row of items) {
    const sellerId = row.listing.weeerUserId
    if (!grouped[sellerId]) {
      grouped[sellerId] = { sellerUserId: sellerId, items: [], subtotal: 0 }
    }
    grouped[sellerId]!.items.push(row)
    grouped[sellerId]!.subtotal +=
      Number(row.listing.unitPrice) * row.cartItem.qty
  }

  const groups = Object.values(grouped).map((g) => ({
    sellerUserId: g.sellerUserId,
    subtotal: g.subtotal,
    items: g.items.map(({ cartItem, listing }) => ({
      id: cartItem.id,
      listingId: cartItem.listingId,
      qty: cartItem.qty,
      buyerRole: cartItem.buyerRole,
      expiresAt: cartItem.expiresAt.toISOString(),
      listing: {
        id: listing.id,
        partName: listing.partName,
        unitPrice: listing.unitPrice,
        qtyAvailable: listing.qtyAvailable - listing.qtyReserved,
        photos: listing.photos,
        warrantyDays: listing.warrantyDays,
        status: listing.status,
      },
    })),
  }))

  return c.json({ groups, totalItems: items.length })
})

// ── PATCH /cart/:item_id/ ────────────────────────────────────────────────────
partsCartRouter.patch('/:item_id', async (c) => {
  const user = await requireAuth(c)
  if (!user) return c.json(err('กรุณาเข้าสู่ระบบ'), 401)

  const { item_id } = c.req.param()
  const body = await c.req.json().catch(() => null)
  if (!body?.qty || typeof body.qty !== 'number') {
    return c.json(err('กรุณาระบุ qty'), 400)
  }

  const qty = Math.max(1, Math.min(50, Math.floor(body.qty)))

  const [cartItem] = await db
    .select()
    .from(partsCartItems)
    .where(and(eq(partsCartItems.id, item_id), eq(partsCartItems.buyerId, user.userId)))
    .limit(1)

  if (!cartItem) return c.json(err('ไม่พบรายการในตะกร้า'), 404)

  await db.update(partsCartItems).set({ qty }).where(eq(partsCartItems.id, item_id))
  return c.json({ success: true, id: item_id, qty })
})

// ── DELETE /cart/:item_id/ ───────────────────────────────────────────────────
partsCartRouter.delete('/:item_id', async (c) => {
  const user = await requireAuth(c)
  if (!user) return c.json(err('กรุณาเข้าสู่ระบบ'), 401)

  const { item_id } = c.req.param()
  const [cartItem] = await db
    .select()
    .from(partsCartItems)
    .where(and(eq(partsCartItems.id, item_id), eq(partsCartItems.buyerId, user.userId)))
    .limit(1)

  if (!cartItem) return c.json(err('ไม่พบรายการในตะกร้า'), 404)

  await db.delete(partsCartItems).where(eq(partsCartItems.id, item_id))
  return c.json({ success: true, id: item_id })
})

// ── POST /cart/checkout/ — submit cart → multi-item order ───────────────────
partsCartRouter.post('/checkout', async (c) => {
  const user = await requireAuth(c)
  if (!user) return c.json(err('กรุณาเข้าสู่ระบบ'), 401)

  const body = await c.req.json().catch(() => null)
  if (!body) return c.json(err('ข้อมูลไม่ถูกต้อง'), 400)

  const Schema = z.object({
    // ถ้าระบุ sellerUserId = checkout เฉพาะร้านนั้น
    sellerUserId: z.string().uuid().optional(),
    idempotencyKey: z.string().min(1),
    serviceId: z.string().uuid().optional(), // link repair job (optional)
    deliveryMethod: z.enum(['pickup', 'local', 'shipping']).default('pickup'),
  })

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return c.json(err(parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ครบ'), 422)
  }

  const { sellerUserId, idempotencyKey, serviceId, deliveryMethod } = parsed.data

  // ดึง cart items
  const now = new Date()
  const cartConditions = [
    eq(partsCartItems.buyerId, user.userId),
    gt(partsCartItems.expiresAt, now),
  ]

  const items = await db
    .select({ cartItem: partsCartItems, listing: partsListings })
    .from(partsCartItems)
    .innerJoin(partsListings, eq(partsCartItems.listingId, partsListings.id))
    .where(and(...cartConditions))

  if (items.length === 0) {
    return c.json(err('ตะกร้าว่างหรือหมดอายุแล้ว'), 400)
  }

  // filter by seller ถ้าระบุ
  const filteredItems = sellerUserId
    ? items.filter((i) => i.listing.weeerUserId === sellerUserId)
    : items

  if (filteredItems.length === 0) {
    return c.json(err('ไม่พบสินค้าจากร้านที่ระบุ'), 400)
  }

  // คำนวณ total + ตรวจ stock
  let totalThb = 0
  for (const { cartItem, listing } of filteredItems) {
    const available = listing.qtyAvailable - listing.qtyReserved
    if (available < cartItem.qty) {
      return c.json(
        err(`${listing.partName}: สต็อกไม่เพียงพอ (เหลือ ${available} ชิ้น)`),
        409,
      )
    }
    // tier pricing discount
    const discount = getTierDiscount(listing.tierPricing as unknown[], cartItem.qty)
    const unitPrice = Number(listing.unitPrice) * (1 - discount)
    totalThb += unitPrice * cartItem.qty
  }

  // สร้าง order (is_multi_item = true)
  // ใช้ first seller เป็น seller_weeer_id (ถ้า checkout ข้ามร้าน → ต้องแยก order)
  const sellerWeeerId =
    filteredItems[0]?.listing.weeerUserId ?? sellerUserId ?? 'unknown'

  const [order] = await db
    .insert(partsOrders)
    .values({
      // parts_orders ยังต้อง partId (Sub-8 schema) — ใช้ first item's listing id เป็น placeholder
      partId: filteredItems[0]?.listing.inventoryItemId ?? filteredItems[0]!.listing.id,
      buyerId: user.userId,
      serviceId: serviceId ?? null,
      quantity: filteredItems.reduce((s, i) => s + i.cartItem.qty, 0),
      unitPriceThb: String(filteredItems[0]?.listing.unitPrice ?? 0),
      totalThb: String(totalThb.toFixed(2)),
      status: 'pending',
      idempotencyKey,
      // is_multi_item จะถูกเพิ่มโดย migration 0021 — ใช้ raw sql เพื่อ set
    } as Parameters<typeof db.insert>[0] extends { values: (v: infer V) => unknown } ? V : never)
    .returning()

  if (!order) {
    return c.json(err('ไม่สามารถสร้าง order ได้'), 500)
  }

  // อัพเดต is_multi_item = true
  await db.execute(
    sql`UPDATE parts_orders SET is_multi_item = true WHERE id = ${order.id}`,
  )

  // สร้าง order items
  for (const { cartItem, listing } of filteredItems) {
    const discount = getTierDiscount(listing.tierPricing as unknown[], cartItem.qty)
    const unitPrice = Number(listing.unitPrice) * (1 - discount)
    const subtotal = unitPrice * cartItem.qty

    await db.insert(partsOrderItems).values({
      orderId: order.id,
      listingId: listing.id,
      qty: cartItem.qty,
      unitPrice: String(unitPrice.toFixed(2)),
      subtotal: String(subtotal.toFixed(2)),
    })
  }

  // ลบ cart items ที่ checkout แล้ว
  const cartItemIds = filteredItems.map((i) => i.cartItem.id)
  await db.delete(partsCartItems).where(inArray(partsCartItems.id, cartItemIds))

  return c.json({
    success: true,
    orderId: order.id,
    totalThb: totalThb.toFixed(2),
    itemCount: filteredItems.length,
  }, 201)
})

// ── Tier pricing discount helper ─────────────────────────────────────────────
function getTierDiscount(tierPricing: unknown[], qty: number): number {
  if (!Array.isArray(tierPricing)) return 0
  // tier_pricing: [{minQty, maxQty, discount}]
  for (const tier of tierPricing) {
    const t = tier as { minQty?: number; maxQty?: number; discount?: number }
    const min = t.minQty ?? 0
    const max = t.maxQty ?? Infinity
    if (qty >= min && qty <= max && typeof t.discount === 'number') {
      return t.discount
    }
  }
  // default tier: 2-5 = 5%, 6+ = 10%
  if (qty >= 6) return 0.10
  if (qty >= 2) return 0.05
  return 0
}
