/**
 * health.ts — GET /health
 * Rubric item #1 + #2: server runs + DB ping
 */
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { pingDb } from '../db/client'

export const healthRouter = new OpenAPIHono()

const HealthResponseSchema = z.object({
  status: z.string().openapi({ example: 'ok' }),
  version: z.string().openapi({ example: '0.1.0' }),
  db_ping_ms: z.number().openapi({ example: 2 }),
  timestamp: z.string().openapi({ example: '2026-05-12T00:00:00.000Z' }),
})

const healthRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['System'],
  summary: 'Health check — server + DB connectivity',
  responses: {
    200: {
      content: { 'application/json': { schema: HealthResponseSchema } },
      description: 'Service healthy',
    },
    503: {
      content: {
        'application/json': {
          schema: z.object({ error: z.object({ code: z.string(), message: z.string() }) }),
        },
      },
      description: 'Service unhealthy',
    },
  },
})

healthRouter.openapi(healthRoute, async (c) => {
  try {
    const dbPingMs = await pingDb()
    return c.json(
      {
        status: 'ok',
        version: '0.1.0',
        db_ping_ms: dbPingMs,
        timestamp: new Date().toISOString(),
      },
      200,
    )
  } catch (err) {
    return c.json(
      { error: { code: 'DB_ERROR', message: 'Database unreachable' } },
      503,
    )
  }
})
