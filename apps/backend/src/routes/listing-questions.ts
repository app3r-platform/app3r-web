/**
 * listing-questions.ts — W-Round-1 Wave 1.2 [5] / GR-5: ถาม-ตอบ listing + visibility
 *
 * Mounted at: /api/v1/listings/{id}/questions
 *
 *   GET  /api/v1/listings/{id}/questions               → visibility-filtered
 *        - เจ้าของ/admin  → เห็นทุกคำถาม (รวม is_visible=false)
 *        - ผู้ถาม         → เห็นคำถามตัวเอง + คำถาม public
 *        - คนนอก/anon    → เห็นเฉพาะ public (is_visible=true)
 *   POST /api/v1/listings/{id}/questions               → ตั้งคำถาม (บล็อกถ้า is_closed)
 *   POST /api/v1/listings/{id}/questions/{qid}/reply    → ตอบ (เจ้าของ/admin/ผู้ถาม)
 *
 * GR-5: matched → owner ปิดถาม-ตอบ (is_closed) ได้ผ่าน transition flow ภายนอก
 * Decision: GR-5 (questions + visibility)
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { and, eq, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { listingMeta, listingQuestions, listingQuestionReplies } from '../db/schema'
import { verifyAccessToken } from '../lib/jwt'

export const listingQuestionsRouter = new OpenAPIHono()

async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}
const unauthorized = (c: { json: (b: unknown, s: 401) => Response }) =>
  c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

// ── GET /{id}/questions (GR-5 visibility) ─────────────────────────────────────
const listRoute = createRoute({
  method: 'get',
  path: '/{id}/questions',
  tags: ['ListingQuestions'],
  summary: 'List questions with GR-5 visibility (owner=all / asker=own+public / outsider=public)',
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 200: { description: 'Questions' }, 404: { description: 'Not found' } },
})

listingQuestionsRouter.openapi(listRoute, async (c) => {
  const { id } = c.req.valid('param')
  const [listing] = await db.select().from(listingMeta).where(eq(listingMeta.listingId, id)).limit(1)
  if (!listing) return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)

  const user = await getAuthUser(c)
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const isOwner = !!user && listing.ownerId === user.userId
  const canSeeAll = isOwner || isAdmin

  const rows = await db
    .select()
    .from(listingQuestions)
    .where(eq(listingQuestions.listingId, id))
    .orderBy(desc(listingQuestions.createdAt))

  // GR-5 visibility filter
  const visible = rows.filter((q) => {
    if (canSeeAll) return true
    if (q.isVisible) return true
    return !!user && q.askerUserId === user.userId // ผู้ถามเห็นคำถามตัวเองแม้ถูกซ่อน
  })

  const qids = visible.map((q) => q.id)
  const replies = qids.length
    ? await db.select().from(listingQuestionReplies).orderBy(listingQuestionReplies.createdAt)
    : []
  const byQ = new Map<string, typeof replies>()
  for (const rep of replies) {
    if (!byQ.has(rep.questionId)) byQ.set(rep.questionId, [])
    byQ.get(rep.questionId)!.push(rep)
  }

  return c.json(
    {
      isClosed: visible.some((q) => q.isClosed),
      items: visible.map((q) => ({
        id: q.id,
        askerUserId: q.askerUserId,
        body: q.body,
        isClosed: q.isClosed,
        isVisible: q.isVisible,
        createdAt: q.createdAt.toISOString(),
        replies: (byQ.get(q.id) ?? []).map((rep) => ({
          id: rep.id,
          replierUserId: rep.replierUserId,
          body: rep.body,
          createdAt: rep.createdAt.toISOString(),
        })),
      })),
    },
    200,
  )
})

// ── POST /{id}/questions ──────────────────────────────────────────────────────
const createQ = createRoute({
  method: 'post',
  path: '/{id}/questions',
  tags: ['ListingQuestions'],
  summary: 'Ask a question (blocked if thread closed) (GR-5)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: z.object({ body: z.string().min(1) }) } } },
  },
  responses: {
    201: { description: 'Created' },
    401: { description: 'Unauthorized' },
    404: { description: 'Listing not found' },
  },
})

listingQuestionsRouter.openapi(createQ, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { id } = c.req.valid('param')
  const { body } = c.req.valid('json')
  const [listing] = await db.select().from(listingMeta).where(eq(listingMeta.listingId, id)).limit(1)
  if (!listing) return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
  const [row] = await db
    .insert(listingQuestions)
    .values({ listingId: id, askerUserId: user.userId, body })
    .returning()
  return c.json({ id: row.id, body: row.body }, 201)
})

// ── POST /{id}/questions/{qid}/reply ──────────────────────────────────────────
const replyRoute = createRoute({
  method: 'post',
  path: '/{id}/questions/{qid}/reply',
  tags: ['ListingQuestions'],
  summary: 'Reply to a question (owner/admin/asker) (GR-5)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid(), qid: z.string().uuid() }),
    body: { content: { 'application/json': { schema: z.object({ body: z.string().min(1) }) } } },
  },
  responses: {
    201: { description: 'Replied' },
    401: { description: 'Unauthorized' },
    403: { description: 'Thread closed' },
    404: { description: 'Not found' },
  },
})

listingQuestionsRouter.openapi(replyRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { id, qid } = c.req.valid('param')
  const { body } = c.req.valid('json')
  const [question] = await db.select().from(listingQuestions).where(eq(listingQuestions.id, qid)).limit(1)
  if (!question || question.listingId !== id) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Question not found' } }, 404)
  }
  if (question.isClosed) {
    return c.json({ error: { code: 'THREAD_CLOSED', message: 'Q&A thread is closed' } }, 403)
  }
  const [row] = await db
    .insert(listingQuestionReplies)
    .values({ questionId: qid, replierUserId: user.userId, body })
    .returning()
  return c.json({ id: row.id, body: row.body }, 201)
})
