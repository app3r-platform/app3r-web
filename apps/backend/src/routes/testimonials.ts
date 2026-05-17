/**
 * routes/testimonials.ts — Sub-2 D-4: Testimonials API
 *
 * Exported routers (mount in app.ts):
 *   testimonialsPublicRouter → /api/testimonials (+ /api/testimonials/)
 *   testimonialsAdminRouter  → /api/admin/testimonials (+ /api/admin/testimonials/)
 *
 * Public:
 *   GET /api/testimonials/  — list published (cache max-age=60, ISR 60s)
 *
 * Admin (Bearer JWT + role=admin, Lesson #44):
 *   GET    /api/admin/testimonials/            — list all (draft + published)
 *   POST   /api/admin/testimonials/            — create (default status='draft')
 *   GET    /api/admin/testimonials/:id         — single
 *   PUT    /api/admin/testimonials/:id         — update (partial)
 *   DELETE /api/admin/testimonials/:id         — hard delete
 *   POST   /api/admin/testimonials/:id/publish — toggle draft ↔ published
 *
 * HONO-TRIE-FIX: /:id/publish MUST be registered BEFORE /:id in admin router
 *
 * Master CMD: 363813ec-7277-81ae-94e8-e0e79b492eb6
 * Schema Plan: 363813ec-7277-81dc-ac96-fd41d4fcdabf (T+0.6 APPROVED)
 */
import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { verifyAccessToken } from '../lib/jwt'
import {
  listPublished,
  listAll,
  getById,
  create,
  update,
  deleteById,
  togglePublish,
} from '../services/testimonials-service'

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

const err = (detail: string) => ({ detail })

// ── Zod schemas ───────────────────────────────────────────────────────────────
const statusEnum = z.enum(['draft', 'published'])

const createSchema = z.object({
  name:        z.string().min(1).max(200),
  role:        z.string().min(1).max(300),
  starsRating: z.number().int().min(1).max(5),
  text:        z.string().min(1).max(500),
  avatar:      z.string().min(1).max(500),
  sortOrder:   z.number().int().default(0),
  status:      statusEnum.default('draft'),
})

const updateSchema = createSchema.partial()

// ── Public router ─────────────────────────────────────────────────────────────
export const testimonialsPublicRouter = new OpenAPIHono()

// GET / — list published testimonials
testimonialsPublicRouter.get('/', async (c) => {
  const items = await listPublished()
  c.header('Cache-Control', 'public, max-age=60')
  return c.json(items)
})

// ── Admin router ──────────────────────────────────────────────────────────────
export const testimonialsAdminRouter = new OpenAPIHono()

// GET / — list all (draft + published)
testimonialsAdminRouter.get('/', async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Unauthorized'), 401)
  if (user.role !== 'admin') return c.json(err('Forbidden'), 403)

  const items = await listAll()
  return c.json(items)
})

// POST / — create
testimonialsAdminRouter.post('/', async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Unauthorized'), 401)
  if (user.role !== 'admin') return c.json(err('Forbidden'), 403)

  const body = await c.req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return c.json({ detail: 'Validation error', errors: parsed.error.flatten() }, 400)

  const item = await create(parsed.data)
  return c.json(item, 201)
})

// HONO-TRIE-FIX: POST /:id/publish MUST be registered BEFORE GET/PUT/DELETE /:id
// to prevent Hono's trie router from matching "publish" as a UUID parameter

// POST /:id/publish — toggle draft ↔ published
testimonialsAdminRouter.post('/:id/publish', async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Unauthorized'), 401)
  if (user.role !== 'admin') return c.json(err('Forbidden'), 403)

  const { id } = c.req.param()
  const item = await togglePublish(id)
  if (!item) return c.json(err('Not found'), 404)
  return c.json(item)
})

// GET /:id — single
testimonialsAdminRouter.get('/:id', async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Unauthorized'), 401)
  if (user.role !== 'admin') return c.json(err('Forbidden'), 403)

  const { id } = c.req.param()
  const item = await getById(id)
  if (!item) return c.json(err('Not found'), 404)
  return c.json(item)
})

// PUT /:id — update
testimonialsAdminRouter.put('/:id', async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Unauthorized'), 401)
  if (user.role !== 'admin') return c.json(err('Forbidden'), 403)

  const { id } = c.req.param()
  const body = await c.req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return c.json({ detail: 'Validation error', errors: parsed.error.flatten() }, 400)

  const item = await update(id, parsed.data)
  if (!item) return c.json(err('Not found'), 404)
  return c.json(item)
})

// DELETE /:id — hard delete
testimonialsAdminRouter.delete('/:id', async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Unauthorized'), 401)
  if (user.role !== 'admin') return c.json(err('Forbidden'), 403)

  const { id } = c.req.param()
  const ok = await deleteById(id)
  if (!ok) return c.json(err('Not found'), 404)
  return c.json({ ok: true })
})
