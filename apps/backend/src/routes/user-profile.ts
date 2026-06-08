/**
 * user-profile.ts — Phase D Sprint D-1: User Profile + Shop Profile
 *
 * GET  /users/me      — ดู profile ตัวเอง (id, email, role, displayName, phone, avatarUrl, gold)
 * PUT  /users/me      — อัปเดต displayName, phone, avatarUrl
 * GET  /shops/me      — WeeeR เท่านั้น — ดู shop profile
 * PUT  /shops/me      — WeeeR เท่านั้น — อัปเดต shopName, phone, address, description
 *
 * user_profiles + shop_profiles สร้าง lazily (upsert on first PUT)
 * ⚠️ ห้ามเปลี่ยน role / email ผ่าน endpoint นี้ (ต้องผ่าน auth flow)
 */
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { users, userProfiles, shopProfiles, wallets } from '../db/schema'
import { jwtAuth, type AuthVariables } from '../middleware/jwt-auth'
import { GOLD_POINT_TYPE } from '../lib/point-service'

export const userProfileRouter = new OpenAPIHono<{ Variables: AuthVariables }>()

// Protect all /users/me and /shops/me routes
userProfileRouter.use('/users/me', jwtAuth)
userProfileRouter.use('/shops/me', jwtAuth)

// ── Shared schema ─────────────────────────────────────────────────────────────

const ErrorSchema = z
  .object({ error: z.object({ code: z.string(), message: z.string() }) })
  .openapi('ProfileErrorResponse')

// ── GET /users/me ─────────────────────────────────────────────────────────────

const MeResponseSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: z.string(),
    displayName: z.string().nullable(),
    phone: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    goldBalance: z.number().int(),
  })
  .openapi('UserMeResponse')

const getMeRoute = createRoute({
  method: 'get',
  path: '/users/me',
  tags: ['Profile'],
  summary: 'Get current user profile + Gold balance',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: MeResponseSchema } },
      description: 'User profile',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
  },
})

userProfileRouter.openapi(getMeRoute, async (c) => {
  const { userId } = c.get('user')

  const [user] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    return c.json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } }, 401)
  }

  const [profile] = await db
    .select({ displayName: userProfiles.displayName, phone: userProfiles.phone, avatarUrl: userProfiles.avatarUrl })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1)

  const walletRows = await db
    .select({ balance: wallets.balance, pointType: wallets.pointType })
    .from(wallets)
    .where(eq(wallets.userId, userId))

  const goldBalance = walletRows.find((w) => w.pointType === GOLD_POINT_TYPE)?.balance ?? 0

  return c.json(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: profile?.displayName ?? null,
      phone: profile?.phone ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      goldBalance,
    },
    200,
  )
})

// ── PUT /users/me ──────────────────────────────────────────────────────────────

const UpdateMeBodySchema = z
  .object({
    displayName: z.string().max(100).optional(),
    phone: z.string().max(20).optional(),
    avatarUrl: z.string().url().optional(),
  })
  .openapi('UpdateUserMeBody')

const updateMeRoute = createRoute({
  method: 'put',
  path: '/users/me',
  tags: ['Profile'],
  summary: 'Update current user profile',
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: UpdateMeBodySchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: MeResponseSchema } },
      description: 'Updated profile',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
  },
})

userProfileRouter.openapi(updateMeRoute, async (c) => {
  const { userId } = c.get('user')
  const body = c.req.valid('json')

  const [user] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    return c.json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } }, 401)
  }

  // Upsert user_profiles
  await db
    .insert(userProfiles)
    .values({
      userId,
      displayName: body.displayName ?? null,
      phone: body.phone ?? null,
      avatarUrl: body.avatarUrl ?? null,
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        ...(body.displayName !== undefined && { displayName: body.displayName }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
        updatedAt: new Date(),
      },
    })

  const [updated] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1)

  const goldWallets = await db
    .select({ balance: wallets.balance, pointType: wallets.pointType })
    .from(wallets)
    .where(eq(wallets.userId, userId))

  const goldBalance = goldWallets.find((w) => w.pointType === GOLD_POINT_TYPE)?.balance ?? 0

  return c.json(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: updated?.displayName ?? null,
      phone: updated?.phone ?? null,
      avatarUrl: updated?.avatarUrl ?? null,
      goldBalance,
    },
    200,
  )
})

// ── GET /shops/me ──────────────────────────────────────────────────────────────

const ShopMeResponseSchema = z
  .object({
    userId: z.string().uuid(),
    shopName: z.string(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    description: z.string().nullable(),
  })
  .openapi('ShopMeResponse')

const getShopMeRoute = createRoute({
  method: 'get',
  path: '/shops/me',
  tags: ['Profile'],
  summary: 'Get WeeeR shop profile (WeeeR role only)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: ShopMeResponseSchema } },
      description: 'Shop profile',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden — WeeeR role required',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
  },
})

userProfileRouter.openapi(getShopMeRoute, async (c) => {
  const { userId, role } = c.get('user')

  if (role !== 'weeer') {
    return c.json(
      { error: { code: 'FORBIDDEN', message: 'Shop profile is only available to WeeeR users' } },
      403,
    )
  }

  const [shop] = await db
    .select()
    .from(shopProfiles)
    .where(eq(shopProfiles.userId, userId))
    .limit(1)

  // Return defaults if no shop profile created yet
  return c.json(
    {
      userId,
      shopName: shop?.shopName ?? '',
      phone: shop?.phone ?? null,
      address: shop?.address ?? null,
      description: shop?.description ?? null,
    },
    200,
  )
})

// ── PUT /shops/me ──────────────────────────────────────────────────────────────

const UpdateShopMeBodySchema = z
  .object({
    shopName: z.string().max(200).optional(),
    phone: z.string().max(20).optional(),
    address: z.string().optional(),
    description: z.string().optional(),
  })
  .openapi('UpdateShopMeBody')

const updateShopMeRoute = createRoute({
  method: 'put',
  path: '/shops/me',
  tags: ['Profile'],
  summary: 'Update WeeeR shop profile (WeeeR role only)',
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: UpdateShopMeBodySchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ShopMeResponseSchema } },
      description: 'Updated shop profile',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden — WeeeR role required',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
  },
})

userProfileRouter.openapi(updateShopMeRoute, async (c) => {
  const { userId, role } = c.get('user')
  const body = c.req.valid('json')

  if (role !== 'weeer') {
    return c.json(
      { error: { code: 'FORBIDDEN', message: 'Shop profile is only available to WeeeR users' } },
      403,
    )
  }

  // Upsert shop_profiles
  await db
    .insert(shopProfiles)
    .values({
      userId,
      shopName: body.shopName ?? '',
      phone: body.phone ?? null,
      address: body.address ?? null,
      description: body.description ?? null,
    })
    .onConflictDoUpdate({
      target: shopProfiles.userId,
      set: {
        ...(body.shopName !== undefined && { shopName: body.shopName }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.description !== undefined && { description: body.description }),
        updatedAt: new Date(),
      },
    })

  const [updated] = await db
    .select()
    .from(shopProfiles)
    .where(eq(shopProfiles.userId, userId))
    .limit(1)

  return c.json(
    {
      userId,
      shopName: updated?.shopName ?? '',
      phone: updated?.phone ?? null,
      address: updated?.address ?? null,
      description: updated?.description ?? null,
    },
    200,
  )
})
