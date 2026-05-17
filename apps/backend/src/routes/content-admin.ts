/**
 * routes/content-admin.ts — Phase D-4 Sub-3: Content CMS Admin API
 *
 * Mounted at: /api/admin/content (+ /api/admin/content/ for HONO-TRIE-FIX)
 * Auth: Bearer JWT required (all routes)
 *
 * Admin endpoints:
 *   GET  /api/admin/content                → ContentPageDto[] (all statuses)
 *   POST /api/admin/content                → ContentPageDto 201 / 409 slug conflict
 *   PUT  /api/admin/content/:id            → ContentPageDto 200 (saves version first)
 *   DELETE /api/admin/content/:id          → 204 ok / 409 published / 404 not found
 *   POST /api/admin/content/:id/publish    → ContentPageDto 200
 *   POST /api/admin/content/:id/preview    → ContentPreviewTokenDto 201
 *   POST /api/admin/content/upload-image   → ContentImageDto 201 (multipart → R2)
 *
 * CMD: 362813ec-7277-8145-8148-ddd74c4222d2
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { verifyAccessToken } from '../lib/jwt'
import { r2Adapter, generateR2Key } from '../lib/r2'
import {
  listAllPages,
  createPage,
  updatePage,
  deletePage,
  publishPage,
  createPreviewToken,
  addImage,
} from '../services/content-service'

export const contentAdminRouter = new OpenAPIHono()

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

const err = (detail: string) => ({ detail })

// ── Shared schemas ─────────────────────────────────────────────────────────────
const ContentTypeEnum = z.enum(['hero', 'about', 'faq', 'static'])

const PageDtoSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  type: ContentTypeEnum,
  title: z.string(),
  body: z.record(z.unknown()),
  status: z.enum(['draft', 'published']),
  version: z.number().int(),
  authorId: z.string().uuid().nullable(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// ── GET /api/admin/content ─────────────────────────────────────────────────────
const listAllRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Content CMS Admin'],
  summary: 'List all content pages (draft + published)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'All pages',
      content: { 'application/json': { schema: z.array(PageDtoSchema) } },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden (insufficient role)' },
  },
})

contentAdminRouter.openapi(listAllRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)
  if (user.role !== 'admin') return c.json(err('Forbidden.'), 403)
  const pages = await listAllPages()
  return c.json(pages, 200)
})

// ── POST /api/admin/content ────────────────────────────────────────────────────
const createRoute_ = createRoute({
  method: 'post',
  path: '/',
  tags: ['Content CMS Admin'],
  summary: 'Create content page (slug unique, always draft)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
            type: ContentTypeEnum,
            title: z.string().min(1).max(500),
            body: z.record(z.unknown()).default({}),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created',
      content: { 'application/json': { schema: PageDtoSchema } },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden (insufficient role)' },
    409: { description: 'Slug conflict' },
  },
})

contentAdminRouter.openapi(createRoute_, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)
  if (user.role !== 'admin') return c.json(err('Forbidden.'), 403)
  const input = c.req.valid('json')
  const result = await createPage(user.userId, input)
  if (result === 'conflict') return c.json(err('Slug already exists.'), 409)
  return c.json(result, 201)
})

// ── PUT /api/admin/content/:id ─────────────────────────────────────────────────
const updateRoute_ = createRoute({
  method: 'put',
  path: '/:id',
  tags: ['Content CMS Admin'],
  summary: 'Update content page (saves version history first)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().min(1).max(500).optional(),
            body: z.record(z.unknown()).optional(),
            slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated',
      content: { 'application/json': { schema: PageDtoSchema } },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden (insufficient role)' },
    404: { description: 'Not found' },
  },
})

contentAdminRouter.openapi(updateRoute_, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)
  if (user.role !== 'admin') return c.json(err('Forbidden.'), 403)
  const { id } = c.req.valid('param')
  const input = c.req.valid('json')
  const result = await updatePage(id, input)
  if (!result) return c.json(err('Not found.'), 404)
  return c.json(result, 200)
})

// ── DELETE /api/admin/content/:id ─────────────────────────────────────────────
const deleteRoute_ = createRoute({
  method: 'delete',
  path: '/:id',
  tags: ['Content CMS Admin'],
  summary: 'Delete content page (reject if published → 409)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    204: { description: 'Deleted' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden (insufficient role)' },
    404: { description: 'Not found' },
    409: { description: 'Cannot delete published page' },
  },
})

contentAdminRouter.openapi(deleteRoute_, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)
  if (user.role !== 'admin') return c.json(err('Forbidden.'), 403)
  const { id } = c.req.valid('param')
  const result = await deletePage(id)
  if (result === 'not_found') return c.json(err('Not found.'), 404)
  if (result === 'published') return c.json(err('Cannot delete a published page.'), 409)
  return new Response(null, { status: 204 })
})

// ── POST /api/admin/content/:id/publish ───────────────────────────────────────
const publishRoute_ = createRoute({
  method: 'post',
  path: '/:id/publish',
  tags: ['Content CMS Admin'],
  summary: 'Publish content page',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'Published',
      content: { 'application/json': { schema: PageDtoSchema } },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden (insufficient role)' },
    404: { description: 'Not found' },
  },
})

contentAdminRouter.openapi(publishRoute_, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)
  if (user.role !== 'admin') return c.json(err('Forbidden.'), 403)
  const { id } = c.req.valid('param')
  const result = await publishPage(id)
  if (!result) return c.json(err('Not found.'), 404)
  return c.json(result, 200)
})

// ── POST /api/admin/content/:id/preview ───────────────────────────────────────
const previewRoute_ = createRoute({
  method: 'post',
  path: '/:id/preview',
  tags: ['Content CMS Admin'],
  summary: 'Create preview token (in-memory, TTL 24h)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    201: {
      description: 'Preview token created',
      content: {
        'application/json': {
          schema: z.object({
            token: z.string(),
            contentPageId: z.string().uuid(),
            expiresAt: z.string(),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden (insufficient role)' },
    404: { description: 'Not found' },
  },
})

contentAdminRouter.openapi(previewRoute_, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)
  if (user.role !== 'admin') return c.json(err('Forbidden.'), 403)
  const { id } = c.req.valid('param')
  const result = await createPreviewToken(id)
  if (!result) return c.json(err('Not found.'), 404)
  return c.json(result, 201)
})

// ── POST /api/admin/content/upload-image ──────────────────────────────────────
const uploadImageRoute = createRoute({
  method: 'post',
  path: '/upload-image',
  tags: ['Content CMS Admin'],
  summary: 'Upload content image to R2 (multipart/form-data)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.any(),
            contentPageId: z.string().uuid(),
            alt: z.string().optional(),
            caption: z.string().optional(),
            order: z.string().optional(),   // FormData is strings
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Image uploaded',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string().uuid(),
            contentPageId: z.string().uuid(),
            url: z.string(),
            r2Key: z.string(),
            alt: z.string().nullable(),
            caption: z.string().nullable(),
            order: z.number().int(),
            createdAt: z.string(),
          }),
        },
      },
    },
    400: { description: 'Missing file or invalid data' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden (insufficient role)' },
    404: { description: 'Content page not found' },
  },
})

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const R2_PUBLIC_BASE = process.env.R2_PUBLIC_BASE_URL ?? 'https://cdn.app3r.com'

contentAdminRouter.openapi(uploadImageRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)
  if (user.role !== 'admin') return c.json(err('Forbidden.'), 403)

  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  const contentPageId = formData.get('contentPageId') as string | null
  const alt = formData.get('alt') as string | null
  const caption = formData.get('caption') as string | null
  const orderStr = formData.get('order') as string | null

  if (!file || !contentPageId) {
    return c.json(err('file and contentPageId are required.'), 400)
  }

  if (!ALLOWED_MIME.includes(file.type)) {
    return c.json(err(`Unsupported MIME type: ${file.type}`), 400)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const r2Key = generateR2Key(user.userId, 'content-images', file.name)

  await r2Adapter.putObject(r2Key, buffer, file.type)
  const publicUrl = `${R2_PUBLIC_BASE}/${r2Key}`

  const result = await addImage(r2Key, publicUrl, {
    contentPageId,
    alt: alt ?? undefined,
    caption: caption ?? undefined,
    order: orderStr != null ? parseInt(orderStr, 10) : undefined,
  })

  if (!result) return c.json(err('Content page not found.'), 404)
  return c.json(result, 201)
})
