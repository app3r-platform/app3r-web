/**
 * routes/content-public.ts — Phase D-4 Sub-3: Content CMS Public API
 *
 * Mounted at: /api/content (+ /api/content/ for HONO-TRIE-FIX)
 *
 * Public endpoints (no auth):
 *   GET /api/content/:type          → ContentPageDto[]  (published only)
 *   GET /api/content/:type/:slug    → ContentPageDetailDto (published OR ?token= preview)
 *
 * CMD: 362813ec-7277-8145-8148-ddd74c4222d2
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { listPublishedPages, getPageBySlug } from '../services/content-service'

export const contentPublicRouter = new OpenAPIHono()

const ContentTypeParam = z.enum(['hero', 'about', 'faq', 'static'])

// ── GET /api/content/:type ────────────────────────────────────────────────────
const listRoute = createRoute({
  method: 'get',
  path: '/:type',
  tags: ['Content CMS Public'],
  summary: 'List published content pages by type',
  request: {
    params: z.object({ type: ContentTypeParam }),
  },
  responses: {
    200: {
      description: 'Published pages for type',
      content: {
        'application/json': {
          schema: z.array(z.object({
            id: z.string().uuid(),
            slug: z.string(),
            type: ContentTypeParam,
            title: z.string(),
            body: z.record(z.unknown()),
            status: z.literal('published'),
            version: z.number().int(),
            authorId: z.string().uuid().nullable(),
            publishedAt: z.string().nullable(),
            createdAt: z.string(),
            updatedAt: z.string(),
          })),
        },
      },
    },
    400: { description: 'Invalid content type' },
  },
})

contentPublicRouter.openapi(listRoute, async (c) => {
  const { type } = c.req.valid('param')
  const pages = await listPublishedPages(type)
  return c.json(pages, 200)
})

// ── GET /api/content/:type/:slug ──────────────────────────────────────────────
const getRoute = createRoute({
  method: 'get',
  path: '/:type/:slug',
  tags: ['Content CMS Public'],
  summary: 'Get content page by slug (published or preview token)',
  request: {
    params: z.object({
      type: ContentTypeParam,
      slug: z.string().min(1),
    }),
    query: z.object({
      token: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Content page with images',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string().uuid(),
            slug: z.string(),
            type: ContentTypeParam,
            title: z.string(),
            body: z.record(z.unknown()),
            status: z.enum(['draft', 'published']),
            version: z.number().int(),
            authorId: z.string().uuid().nullable(),
            publishedAt: z.string().nullable(),
            createdAt: z.string(),
            updatedAt: z.string(),
            images: z.array(z.object({
              id: z.string().uuid(),
              contentPageId: z.string().uuid(),
              url: z.string(),
              r2Key: z.string(),
              alt: z.string().nullable(),
              caption: z.string().nullable(),
              order: z.number().int(),
              createdAt: z.string(),
            })),
          }),
        },
      },
    },
    404: { description: 'Not found or not accessible' },
  },
})

contentPublicRouter.openapi(getRoute, async (c) => {
  const { slug } = c.req.valid('param')
  const { token } = c.req.valid('query')
  const page = await getPageBySlug(slug, token)
  if (!page) return c.json({ detail: 'Not found.' }, 404)
  return c.json(page, 200)
})
