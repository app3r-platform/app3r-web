/**
 * files.ts โ€” D87: R2 presigned upload routes
 *
 * POST /api/v1/files/presign   โ€” return presigned PUT URL + r2_key
 * POST /api/v1/files/finalize  โ€” confirm upload + create file_uploads row
 * GET  /api/v1/files/:id       โ€” return presigned GET URL (15 min)
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { db } from '../db/client'
import { fileUploads } from '../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAccessToken } from '../lib/jwt'
import { r2Adapter, generateR2Key } from '../lib/r2'

export const filesRouter = new OpenAPIHono()

// โ”€โ”€ Auth helper โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  return verifyAccessToken(token).catch(() => null)
}

// โ”€โ”€ POST /presign โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const presignRoute = createRoute({
  method: 'post',
  path: '/presign',
  tags: ['Files'],
  summary: 'Get presigned PUT URL for R2 upload (D87)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            fileName: z.string().min(1),
            mimeType: z.string().min(1),
            purpose: z.enum(['service_photo', 'profile', 'parts', 'document']),
            ownerApp: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Presigned PUT URL + r2Key',
      content: {
        'application/json': {
          schema: z.object({
            uploadUrl: z.string(),
            r2Key: z.string(),
            expiresIn: z.number(),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
  },
})

filesRouter.openapi(presignRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const { fileName, mimeType, purpose, ownerApp } = c.req.valid('json')
  const r2Key = generateR2Key(user.userId, purpose, fileName)

  const result = await r2Adapter.presignPut(r2Key, mimeType)
  return c.json(result, 200)
})

// โ”€โ”€ POST /finalize โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const finalizeRoute = createRoute({
  method: 'post',
  path: '/finalize',
  tags: ['Files'],
  summary: 'Confirm upload complete + register file in DB (D87)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            r2Key: z.string(),
            fileName: z.string(),
            mimeType: z.string(),
            sizeBytes: z.number().int().positive(),
            purpose: z.enum(['service_photo', 'profile', 'parts', 'document']),
            ownerApp: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'File registered',
      content: { 'application/json': { schema: z.object({ id: z.string() }) } },
    },
    401: { description: 'Unauthorized' },
  },
})

filesRouter.openapi(finalizeRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const body = c.req.valid('json')
  const [row] = await db
    .insert(fileUploads)
    .values({
      ownerId: user.userId,
      ownerApp: body.ownerApp,
      purpose: body.purpose,
      r2Key: body.r2Key,
      fileName: body.fileName,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
      scanStatus: 'pending',
    })
    .returning({ id: fileUploads.id })

  return c.json({ id: row.id }, 201)
})

// โ”€โ”€ GET /:id โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const getFileRoute = createRoute({
  method: 'get',
  path: '/:id',
  tags: ['Files'],
  summary: 'Get presigned GET URL for file (15 min expiry) (D87)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Presigned GET URL',
      content: { 'application/json': { schema: z.object({ url: z.string(), expiresIn: z.number() }) } },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'File not found' },
  },
})

filesRouter.openapi(getFileRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const { id } = c.req.valid('param')
  const [file] = await db.select().from(fileUploads).where(eq(fileUploads.id, id))
  if (!file) return c.json({ error: { code: 'NOT_FOUND', message: 'File not found' } }, 404)

  const url = await r2Adapter.presignGet(file.r2Key)
  return c.json({ url, expiresIn: 900 }, 200)
})

