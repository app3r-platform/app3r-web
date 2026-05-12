/**
 * push.ts โ€” D88: Push subscription + notification routes
 *
 * POST /api/v1/push/subscribe   โ€” register FCM/APNs token
 * POST /api/v1/push/unsubscribe โ€” remove token
 * GET  /api/v1/notifications    โ€” list user notifications
 * PATCH /api/v1/notifications/:id/read โ€” mark as read
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { db } from '../db/client'
import { pushSubscriptions, notifications } from '../db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { verifyAccessToken } from '../lib/jwt'

export const pushRouter = new OpenAPIHono()

async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

// โ”€โ”€ POST /subscribe โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const subscribeRoute = createRoute({
  method: 'post',
  path: '/subscribe',
  tags: ['Push'],
  summary: 'Register FCM/APNs token for push notifications (D88)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            app: z.string(),
            platform: z.enum(['web', 'android', 'ios']),
            fcmToken: z.string().optional(),
            apnsToken: z.string().optional(),
            userAgent: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Subscription registered',
      content: { 'application/json': { schema: z.object({ id: z.string() }) } },
    },
    401: { description: 'Unauthorized' },
  },
})

pushRouter.openapi(subscribeRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const body = c.req.valid('json')
  // Upsert: if conflict on COALESCE unique index โ’ update enabled+updatedAt
  const [row] = await db
    .insert(pushSubscriptions)
    .values({
      userId: user.userId,
      app: body.app,
      platform: body.platform,
      fcmToken: body.fcmToken ?? null,
      apnsToken: body.apnsToken ?? null,
      userAgent: body.userAgent ?? null,
      enabled: true,
    })
    // NOTE-D88-1 + NOTE-SUB1: The unique index uses COALESCE expression — Drizzle's
    // onConflictDoUpdate.target doesn't support expression constraints.
    // Workaround: fall through with doNothing, then check existing row.
    .onConflictDoNothing()
    .returning({ id: pushSubscriptions.id })

  if (row) {
    return c.json({ id: row.id }, 201)
  }

  // Row already exists → update it and return existing id
  const [existing] = await db
    .update(pushSubscriptions)
    .set({
      enabled: true,
      fcmToken: body.fcmToken ?? null,
      apnsToken: body.apnsToken ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(pushSubscriptions.userId, user.userId),
        eq(pushSubscriptions.app, body.app),
        eq(pushSubscriptions.platform, body.platform),
        sql`COALESCE(${pushSubscriptions.fcmToken}, ${pushSubscriptions.apnsToken}, '') = COALESCE(${body.fcmToken ?? null}::text, ${body.apnsToken ?? null}::text, '')`,
      )
    )
    .returning({ id: pushSubscriptions.id })

  return c.json({ id: existing.id }, 201)
})

// โ”€โ”€ GET /notifications โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const listNotificationsRoute = createRoute({
  method: 'get',
  path: '/notifications',
  tags: ['Push'],
  summary: 'List user notifications (D88)',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      limit: z.string().optional().default('20'),
      unreadOnly: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Notification list',
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(z.object({
              id: z.string(),
              type: z.string(),
              title: z.string(),
              body: z.string().nullable(),
              channel: z.string(),
              sentAt: z.string(),
              readAt: z.string().nullable(),
            })),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
  },
})

pushRouter.openapi(listNotificationsRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const { limit } = c.req.valid('query')
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.recipientId, user.userId))
    .orderBy(desc(notifications.sentAt))
    .limit(parseInt(limit, 10))

  return c.json({
    items: rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      channel: n.channel,
      sentAt: n.sentAt.toISOString(),
      readAt: n.readAt?.toISOString() ?? null,
    })),
  }, 200)
})

// โ”€โ”€ PATCH /notifications/:id/read โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const markReadRoute = createRoute({
  method: 'patch',
  path: '/notifications/:id/read',
  tags: ['Push'],
  summary: 'Mark notification as read (D88)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: 'Marked as read' },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
})

pushRouter.openapi(markReadRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const { id } = c.req.valid('param')
  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.recipientId, user.userId)))
    .returning({ id: notifications.id })

  if (!updated) return c.json({ error: { code: 'NOT_FOUND', message: 'Notification not found' } }, 404)
  return c.json({ success: true }, 200)
})

