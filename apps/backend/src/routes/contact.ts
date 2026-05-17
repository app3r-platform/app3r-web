/**
 * routes/contact.ts — Sub-4 D78: Contact Info + Form
 *
 * Exported routers (mount in app.ts):
 *   contactPublicRouter     → /api/contact (+ /api/contact/)
 *   contactInfoPublicRouter → /api/contact-info (+ /api/contact-info/)
 *   contactAdminRouter      → /api/admin/contact (+ /api/admin/contact/)
 *   contactAdminInfoRouter  → /api/admin/contact-info (+ /api/admin/contact-info/)
 *
 * Public:
 *   POST /api/contact/         — submit form (rate limit 5/IP/15min)
 *   GET  /api/contact-info/    — footer data (cache max-age=300)
 *
 * Admin (Bearer JWT + role=admin, Lesson #44):
 *   GET    /api/admin/contact/             — list messages (excl. soft-deleted)
 *   GET    /api/admin/contact/:id          — single message
 *   PUT    /api/admin/contact/:id/status   — update status
 *   DELETE /api/admin/contact/:id          — soft delete (SET deletedAt = now)
 *   GET    /api/admin/contact-info/        — read (for edit form)
 *   PUT    /api/admin/contact-info/        — update contact info
 *
 * Schema Plan: 363813ec-7277-81c2-b7b4-d9111d0b3427
 * Master CMD:  363813ec-7277-813c-ba73-e56b9695d828 (v4.2)
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { verifyAccessToken } from '../lib/jwt'
import {
  submitContact,
  getContactInfo,
  listMessages,
  getMessage,
  updateMessageStatus,
  softDeleteMessage,
  updateContactInfo,
} from '../services/contact-service'

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

const err = (detail: string) => ({ detail })

// ── Rate Limiter (in-memory, 5 req/IP/15min) ──────────────────────────────────
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 15 * 60 * 1000
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// ── Shared Zod schemas ────────────────────────────────────────────────────────
const ContactCategoryEnum = z.enum([
  'general', 'sales', 'support', 'partnership',
  'press', 'feedback', 'careers', 'other',
])

const ContactStatusEnum = z.enum(['new', 'read', 'replied', 'closed'])

const CreateContactMessageSchema = z.object({
  category: ContactCategoryEnum,
  name:     z.string().min(1).max(200),
  email:    z.string().email().max(254),
  phone:    z.string().max(20).optional(),
  subject:  z.string().min(1).max(500),
  body:     z.string().min(1).max(5000),
})

const ContactMessageDtoSchema = z.object({
  id:        z.string().uuid(),
  category:  ContactCategoryEnum,
  name:      z.string(),
  email:     z.string(),
  phone:     z.string().nullable(),
  subject:   z.string(),
  body:      z.string(),
  status:    ContactStatusEnum,
  createdAt: z.string(),
  updatedAt: z.string(),
  repliedAt: z.string().nullable(),
  repliedBy: z.string().nullable(),
  deletedAt: z.string().nullable(),
})

const ContactInfoAddressSchema = z.object({
  street:     z.string().min(1),
  district:   z.string().min(1),
  province:   z.string().min(1),
  postalCode: z.string().min(1),
  country:    z.string().min(1),
})

const ContactInfoPhoneSchema = z.object({
  label:  z.string().min(1),
  number: z.string().min(1),
  hours:  z.string().optional(),
})

const ContactInfoEmailSchema = z.object({
  label:   z.string().min(1),
  address: z.string().email(),
})

const SocialPlatformEnum = z.enum(['line', 'facebook', 'instagram', 'youtube', 'tiktok', 'twitter'])

const ContactInfoSocialSchema = z.object({
  platform: SocialPlatformEnum,
  handle:   z.string().min(1),
  url:      z.string(),
})

const ContactInfoBusinessHoursSchema = z.object({
  weekdays: z.string().min(1),
  weekend:  z.string().optional(),
  holidays: z.string().optional(),
})

const ContactInfoDtoSchema = z.object({
  companyName:   z.string(),
  address:       ContactInfoAddressSchema,
  phones:        z.array(ContactInfoPhoneSchema),
  emails:        z.array(ContactInfoEmailSchema),
  socials:       z.array(ContactInfoSocialSchema),
  businessHours: ContactInfoBusinessHoursSchema,
  mapEmbedUrl:   z.string().nullable(),
  updatedAt:     z.string(),
})

const UpdateContactInfoBodySchema = z.object({
  companyName:   z.string().min(1),
  address:       ContactInfoAddressSchema,
  phones:        z.array(ContactInfoPhoneSchema),
  emails:        z.array(ContactInfoEmailSchema),
  socials:       z.array(ContactInfoSocialSchema),
  businessHours: ContactInfoBusinessHoursSchema,
  mapEmbedUrl:   z.string().nullable(),
})

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTER — POST /api/contact/
// ═════════════════════════════════════════════════════════════════════════════
export const contactPublicRouter = new OpenAPIHono()

const submitContactRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Contact'],
  summary: 'Submit contact form (rate limit 5/IP/15min)',
  request: {
    body: {
      content: { 'application/json': { schema: CreateContactMessageSchema } },
    },
  },
  responses: {
    201: {
      description: 'Message submitted',
      content: { 'application/json': { schema: ContactMessageDtoSchema } },
    },
    429: { description: 'Rate limit exceeded' },
  },
})

contactPublicRouter.openapi(submitContactRoute, async (c) => {
  const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return c.json(err('Rate limit exceeded. Please try again in 15 minutes.'), 429)
  }
  const input = c.req.valid('json')
  const result = await submitContact(input)
  return c.json(result, 201)
})

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC INFO ROUTER — GET /api/contact-info/
// ═════════════════════════════════════════════════════════════════════════════
export const contactInfoPublicRouter = new OpenAPIHono()

const getContactInfoPublicRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Contact'],
  summary: 'Get contact info (Footer data, cache max-age=300)',
  responses: {
    200: {
      description: 'Contact info',
      content: { 'application/json': { schema: ContactInfoDtoSchema } },
    },
    404: { description: 'Not seeded yet' },
  },
})

contactInfoPublicRouter.openapi(getContactInfoPublicRoute, async (c) => {
  const result = await getContactInfo()
  if (!result) return c.json(err('Contact info not found.'), 404)
  return c.json(result, 200, { 'Cache-Control': 'public, max-age=300' })
})

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN MESSAGES ROUTER — /api/admin/contact/
// ═════════════════════════════════════════════════════════════════════════════
export const contactAdminRouter = new OpenAPIHono()

// GET /api/admin/contact/ — list messages
const listMessagesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Contact Admin'],
  summary: 'List contact messages (excl. soft-deleted)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Messages list',
      content: { 'application/json': { schema: z.array(ContactMessageDtoSchema) } },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden (insufficient role)' },
  },
})

contactAdminRouter.openapi(listMessagesRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)
  if (user.role !== 'admin') return c.json(err('Forbidden.'), 403)
  return c.json(await listMessages(), 200)
})

// GET /api/admin/contact/:id — single message
const getMessageRoute = createRoute({
  method: 'get',
  path: '/:id',
  tags: ['Contact Admin'],
  summary: 'Get single contact message',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Message',
      content: { 'application/json': { schema: ContactMessageDtoSchema } },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden (insufficient role)' },
    404: { description: 'Not found' },
  },
})

contactAdminRouter.openapi(getMessageRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)
  if (user.role !== 'admin') return c.json(err('Forbidden.'), 403)
  const { id } = c.req.valid('param')
  const result = await getMessage(id)
  if (!result) return c.json(err('Not found.'), 404)
  return c.json(result, 200)
})

// PUT /api/admin/contact/:id/status — update status
const updateStatusRoute = createRoute({
  method: 'put',
  path: '/:id/status',
  tags: ['Contact Admin'],
  summary: 'Update message status',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': { schema: z.object({ status: ContactStatusEnum }) },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated',
      content: { 'application/json': { schema: ContactMessageDtoSchema } },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden (insufficient role)' },
    404: { description: 'Not found' },
  },
})

contactAdminRouter.openapi(updateStatusRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)
  if (user.role !== 'admin') return c.json(err('Forbidden.'), 403)
  const { id } = c.req.valid('param')
  const input = c.req.valid('json')
  const result = await updateMessageStatus(id, input, user.userId)
  if (!result) return c.json(err('Not found.'), 404)
  return c.json(result, 200)
})

// DELETE /api/admin/contact/:id — soft delete
const deleteMessageRoute = createRoute({
  method: 'delete',
  path: '/:id',
  tags: ['Contact Admin'],
  summary: 'Soft delete contact message (SET deletedAt = now)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    204: { description: 'Deleted' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden (insufficient role)' },
    404: { description: 'Not found' },
  },
})

contactAdminRouter.openapi(deleteMessageRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)
  if (user.role !== 'admin') return c.json(err('Forbidden.'), 403)
  const { id } = c.req.valid('param')
  const ok = await softDeleteMessage(id)
  if (!ok) return c.json(err('Not found.'), 404)
  return new Response(null, { status: 204 })
})

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN CONTACT-INFO ROUTER — /api/admin/contact-info/
// ═════════════════════════════════════════════════════════════════════════════
export const contactAdminInfoRouter = new OpenAPIHono()

// GET /api/admin/contact-info/ — read for edit form
const adminGetContactInfoRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Contact Admin'],
  summary: 'Get contact info for Admin edit form',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Contact info',
      content: { 'application/json': { schema: ContactInfoDtoSchema } },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden (insufficient role)' },
    404: { description: 'Not seeded yet' },
  },
})

contactAdminInfoRouter.openapi(adminGetContactInfoRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)
  if (user.role !== 'admin') return c.json(err('Forbidden.'), 403)
  const result = await getContactInfo()
  if (!result) return c.json(err('Contact info not found.'), 404)
  return c.json(result, 200)
})

// PUT /api/admin/contact-info/ — update contact info
const adminUpdateContactInfoRoute = createRoute({
  method: 'put',
  path: '/',
  tags: ['Contact Admin'],
  summary: 'Update contact info',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: UpdateContactInfoBodySchema } },
    },
  },
  responses: {
    200: {
      description: 'Updated contact info',
      content: { 'application/json': { schema: ContactInfoDtoSchema } },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden (insufficient role)' },
  },
})

contactAdminInfoRouter.openapi(adminUpdateContactInfoRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)
  if (user.role !== 'admin') return c.json(err('Forbidden.'), 403)
  const input = c.req.valid('json')
  const result = await updateContactInfo(input, user.userId)
  return c.json(result, 200)
})
