/**
 * app.ts — Hono OpenAPI app factory
 * D82: Hono framework | D85: OpenAPI 3.1 + Swagger UI
 * Phase D-2: D87 Files + D88 Push/WS + D89 Payment + D90 Location + D91 Email
 *            + services stub + parts (NOTE-SUB4)
 */
import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

// D-1 routes
import { healthRouter } from './routes/health'
import { authRouter } from './routes/auth'

// D-2 routes
import { filesRouter } from './routes/files'
import { pushRouter } from './routes/push'
import { paymentRouter } from './routes/payment'
import { locationRouter } from './routes/location'
import { servicesRouter } from './routes/services'
import { partsRouter } from './routes/parts'
import { transfersRouter } from './routes/transfers'
import { serviceProgressRouter } from './routes/service-progress'
import { settlementsRouter } from './routes/settlements'
import { reconciliationRouter } from './routes/reconciliation'
import { partsOrdersRouter } from './routes/parts-orders'

// Phase D-4 Sub-3: Content CMS
import { contentPublicRouter } from './routes/content-public'
import { contentAdminRouter } from './routes/content-admin'

// Phase D-4 Sub-4: Contact Info + Form (D78)
import {
  contactPublicRouter,
  contactInfoPublicRouter,
  contactAdminRouter,
  contactAdminInfoRouter,
} from './routes/contact'

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

// ── Routes D-1 ───────────────────────────────────────────────────────────────
app.route('/health', healthRouter)
app.route('/api/v1', authRouter)

// ── Routes D-2 ───────────────────────────────────────────────────────────────
// D87: File Upload (R2 + ClamAV)
app.route('/api/v1/files', filesRouter)

// D88: Push Notifications + in-app notifications list
app.route('/api/v1/push', pushRouter)

// D89: Payment (2C2P + Stripe + TrueMoney)
app.route('/api/v1/payment', paymentRouter)

// D90: Location (Google Maps proxy + live location NOTE-SUB5)
app.route('/api/v1/location', locationRouter)

// D90 NOTE-D90-1: Services stub CRUD
app.route('/api/v1/services', servicesRouter)

// Sub-CMD-8/9: Parts B2B Marketplace (Wave 3)
// HONO-TRIE-FIX: partsOrdersRouter MUST be registered BEFORE partsRouter.
// partsRouter mounts GET /:id/ which matches the "orders" path segment and
// causes UUID validation failure on GET /api/v1/parts/orders/.
// Both with and without trailing slash are mounted to handle Hono trie routing.
app.route('/api/v1/parts/orders', partsOrdersRouter)
app.route('/api/v1/parts/orders/', partsOrdersRouter)

// NOTE-SUB4: Parts inventory (registered AFTER partsOrdersRouter — see HONO-TRIE-FIX above)
app.route('/api/v1/parts', partsRouter)

// Sub-CMD-2: Manual Bank Transfer (อ.PP decision — primary Phase D-2)
app.route('/api/v1/transfers', transfersRouter)

// Sub-CMD-5: Service Progress Tracker (D79 Wave 2)
app.route('/api/v1/service-progress', serviceProgressRouter)

// Sub-CMD-6: Settlement API (D-2 Debt #3 Wave 2)
app.route('/api/v1/settlements', settlementsRouter)

// Sub-CMD-7: Reconciliation Worker (Wave 2)
app.route('/api/v1/reconciliation', reconciliationRouter)

// Phase D-4 Sub-3: Platform Content CMS
// HONO-TRIE-FIX: double-mount (with + without trailing slash)
// upload-image MUST be registered BEFORE /:id routes (HONO-TRIE-FIX order)
app.route('/api/content', contentPublicRouter)
app.route('/api/content/', contentPublicRouter)
app.route('/api/admin/content', contentAdminRouter)
app.route('/api/admin/content/', contentAdminRouter)

// Phase D-4 Sub-4: Contact Info + Form (D78)
// HONO-TRIE-FIX: double-mount (with + without trailing slash)
// contactAdminInfoRouter BEFORE contactAdminRouter (avoid /contact-info matching /contact/:id)
app.route('/api/contact', contactPublicRouter)
app.route('/api/contact/', contactPublicRouter)
app.route('/api/contact-info', contactInfoPublicRouter)
app.route('/api/contact-info/', contactInfoPublicRouter)
app.route('/api/admin/contact-info', contactAdminInfoRouter)
app.route('/api/admin/contact-info/', contactAdminInfoRouter)
app.route('/api/admin/contact', contactAdminRouter)
app.route('/api/admin/contact/', contactAdminRouter)

// ── OpenAPI Spec ─────────────────────────────────────────────────────────────
// D85: auto-generated OpenAPI 3.1 spec (DAL contract for P3/P4/P5)
app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
})

app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'App3R API',
    version: '0.2.0',
    description:
      'App3R Platform Backend — Phase D-2 Real Integrations\n\n' +
      'Auth: JWT access token (15 min) + HttpOnly refresh cookie (7 days)\n\n' +
      'D-2 New: Files(D87) + Push/WS(D88) + Payment(D89) + Location(D90) + Email(D91)\n' +
      '        + Services stub(D90-NOTE-D90-1) + Parts(NOTE-SUB4) + Transfers(Sub-CMD-2)\n\n' +
      'Error format: `{error: {code: string, message: string, details?: any}}`',
  },
})

// ── Swagger UI ────────────────────────────────────────────────────────────────
app.get('/docs', swaggerUI({ url: '/openapi.json' }))

export default app
