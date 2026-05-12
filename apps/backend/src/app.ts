/**
 * app.ts — Hono OpenAPI app factory
 * D82: Hono framework | D85: OpenAPI 3.1 + Swagger UI
 */
import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { healthRouter } from './routes/health'
import { authRouter } from './routes/auth'

export const app = new OpenAPIHono()

// ── Middleware ────────────────────────────────────────────────────────────────
app.use('*', logger())
app.use(
  '/api/*',
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
    ],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)

// ── Routes ────────────────────────────────────────────────────────────────────
app.route('/health', healthRouter)
app.route('/api/v1', authRouter)

// ── OpenAPI Spec ─────────────────────────────────────────────────────────────
// D85: auto-generated OpenAPI 3.1 spec (DAL contract for P3/P4/P5)
// Register bearerAuth security scheme via registry (correct @hono/zod-openapi API)
app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
})

app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'App3R API',
    version: '0.1.0',
    description:
      'App3R Platform Backend — Phase D-1 Foundation\n\n' +
      'Auth: JWT access token (15 min) + HttpOnly refresh cookie (7 days)\n\n' +
      'Error format: `{error: {code: string, message: string, details?: any}}`',
  },
})

// ── Swagger UI ────────────────────────────────────────────────────────────────
app.get('/docs', swaggerUI({ url: '/openapi.json' }))

export default app
