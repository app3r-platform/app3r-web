/**
 * admin-config.ts — D84 W-Round-1 Wave 1: admin-tunable config API
 *
 * Mounted at: /api/v1/admin/config (Bearer JWT required)
 *
 *   GET /api/v1/admin/config            → list all config entries
 *   GET /api/v1/admin/config/:key       → single config (e.g. bad_record_policy)
 *   PUT /api/v1/admin/config/:key       → upsert value + write audit row (old→new)
 *   GET /api/v1/admin/config/:key/audit → change history
 *
 * Audit: every PUT records old_value → new_value + changed_by (token sub/email).
 * Standalone — changed_by stored as TEXT (no FK → users, B3-safe).
 *
 * Decision: D84 (W-Round-1 Wave 1)
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { db } from '../db/client'
import { adminConfig, adminConfigAudit } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { verifyAccessToken } from '../lib/jwt'

export const adminConfigRouter = new OpenAPIHono()

async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

const unauthorized = (c: { json: (b: unknown, s: 401) => Response }) =>
  c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

// ── GET /  (list all) ─────────────────────────────────────────────────────────
const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['AdminConfig'],
  summary: 'List all admin config entries (D84)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Config entries',
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(
              z.object({
                key: z.string(),
                value: z.unknown(),
                description: z.string().nullable(),
                updatedBy: z.string().nullable(),
                updatedAt: z.string(),
              }),
            ),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
  },
})

adminConfigRouter.openapi(listRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const rows = await db.select().from(adminConfig)
  return c.json(
    {
      items: rows.map((r) => ({
        key: r.key,
        value: r.value,
        description: r.description,
        updatedBy: r.updatedBy,
        updatedAt: r.updatedAt.toISOString(),
      })),
    },
    200,
  )
})

// ── GET /:key ─────────────────────────────────────────────────────────────────
const getRoute = createRoute({
  method: 'get',
  path: '/{key}',
  tags: ['AdminConfig'],
  summary: 'Get single config by key (e.g. bad_record_policy) (D84)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ key: z.string() }) },
  responses: {
    200: {
      description: 'Config entry',
      content: {
        'application/json': {
          schema: z.object({
            key: z.string(),
            value: z.unknown(),
            description: z.string().nullable(),
            updatedBy: z.string().nullable(),
            updatedAt: z.string(),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
})

adminConfigRouter.openapi(getRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { key } = c.req.valid('param')
  const [row] = await db.select().from(adminConfig).where(eq(adminConfig.key, key)).limit(1)
  if (!row) return c.json({ error: { code: 'NOT_FOUND', message: 'Config not found' } }, 404)
  return c.json(
    {
      key: row.key,
      value: row.value,
      description: row.description,
      updatedBy: row.updatedBy,
      updatedAt: row.updatedAt.toISOString(),
    },
    200,
  )
})

// ── PUT /:key (upsert + audit) ────────────────────────────────────────────────
const putRoute = createRoute({
  method: 'put',
  path: '/{key}',
  tags: ['AdminConfig'],
  summary: 'Upsert config value + write audit row (D84 admin-tunable)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ key: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            value: z.unknown(),
            description: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Config updated',
      content: {
        'application/json': {
          schema: z.object({
            key: z.string(),
            value: z.unknown(),
            description: z.string().nullable(),
            updatedBy: z.string().nullable(),
            updatedAt: z.string(),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
  },
})

adminConfigRouter.openapi(putRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { key } = c.req.valid('param')
  const { value, description } = c.req.valid('json')

  // admin identifier (no FK — B3-safe): prefer email, fallback to sub/userId
  const changedBy =
    (user as { email?: string; sub?: string; userId?: string }).email ??
    (user as { sub?: string }).sub ??
    (user as { userId?: string }).userId ??
    null

  const [existing] = await db.select().from(adminConfig).where(eq(adminConfig.key, key)).limit(1)
  const now = new Date()

  const [row] = await db
    .insert(adminConfig)
    .values({
      key,
      value: value as unknown,
      description: description ?? null,
      updatedBy: changedBy,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: adminConfig.key,
      set: {
        value: value as unknown,
        description: description ?? existing?.description ?? null,
        updatedBy: changedBy,
        updatedAt: now,
      },
    })
    .returning()

  // audit: old → new
  await db.insert(adminConfigAudit).values({
    configKey: key,
    oldValue: existing?.value ?? null,
    newValue: value as unknown,
    changedBy,
    changedAt: now,
  })

  return c.json(
    {
      key: row.key,
      value: row.value,
      description: row.description,
      updatedBy: row.updatedBy,
      updatedAt: row.updatedAt.toISOString(),
    },
    200,
  )
})

// ── GET /:key/audit ───────────────────────────────────────────────────────────
const auditRoute = createRoute({
  method: 'get',
  path: '/{key}/audit',
  tags: ['AdminConfig'],
  summary: 'Config change history (D84 audit)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ key: z.string() }) },
  responses: {
    200: {
      description: 'Audit history',
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(
              z.object({
                id: z.string(),
                configKey: z.string(),
                oldValue: z.unknown().nullable(),
                newValue: z.unknown(),
                changedBy: z.string().nullable(),
                changedAt: z.string(),
              }),
            ),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
  },
})

adminConfigRouter.openapi(auditRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { key } = c.req.valid('param')
  const rows = await db
    .select()
    .from(adminConfigAudit)
    .where(eq(adminConfigAudit.configKey, key))
    .orderBy(desc(adminConfigAudit.changedAt))
  return c.json(
    {
      items: rows.map((r) => ({
        id: r.id,
        configKey: r.configKey,
        oldValue: r.oldValue,
        newValue: r.newValue,
        changedBy: r.changedBy,
        changedAt: r.changedAt.toISOString(),
      })),
    },
    200,
  )
})
