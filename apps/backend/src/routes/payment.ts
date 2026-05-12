/**
 * payment.ts โ€” D89: Payment intent + webhook routes
 *
 * POST /api/v1/payment/intent          โ€” create payment_intent + checkout URL
 * POST /api/v1/payment/webhook/:provider โ€” receive provider webhook (idempotent)
 *
 * NOTE-D89-2: D-2 เนเธกเนเธกเธต withdrawal UI โ€” manual process Phase D-5
 * NOTE-M3: Reconciliation handled by cron.ts
 * payment_intents โ” point_ledger sync: @needs-point-review
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { db } from '../db/client'
import { paymentIntents, webhookEvents } from '../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAccessToken } from '../lib/jwt'
import { getPaymentProvider } from '../lib/payment'

export const paymentRouter = new OpenAPIHono()

async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

// โ”€โ”€ POST /intent โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const createIntentRoute = createRoute({
  method: 'post',
  path: '/intent',
  tags: ['Payment'],
  summary: 'Create payment intent + get checkout URL (D89)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            provider: z.enum(['2c2p', 'truemoney', 'stripe']),
            amountThb: z.number().positive(),
            purpose: z.enum(['service_payment', 'subscription', 'topup', 'withdrawal']),
            userApp: z.string(),
            description: z.string().default('App3R payment'),
            returnUrl: z.string().url(),
            cancelUrl: z.string().url(),
            idempotencyKey: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Payment intent created',
      content: {
        'application/json': {
          schema: z.object({
            intentId: z.string(),
            checkoutUrl: z.string(),
            providerRef: z.string(),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
    409: { description: 'Duplicate idempotency key' },
  },
})

paymentRouter.openapi(createIntentRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const body = c.req.valid('json')
  const provider = getPaymentProvider(body.provider)

  // Create checkout session with provider
  const session = await provider.createCheckoutSession({
    amount: body.amountThb,
    currency: 'THB',
    purposeRef: body.idempotencyKey,
    description: body.description,
    returnUrl: body.returnUrl,
    cancelUrl: body.cancelUrl,
  })

  // Insert payment_intent row
  const [intent] = await db
    .insert(paymentIntents)
    .values({
      userId: user.userId,
      userApp: body.userApp,
      provider: body.provider,
      providerRef: session.providerRef,
      amountThb: String(body.amountThb),
      currency: 'THB',
      purpose: body.purpose,
      status: 'pending',
      idempotencyKey: body.idempotencyKey,
    })
    .onConflictDoNothing()
    .returning({ id: paymentIntents.id })

  if (!intent) {
    return c.json({ error: { code: 'CONFLICT', message: 'Duplicate idempotency key' } }, 409)
  }

  return c.json({
    intentId: intent.id,
    checkoutUrl: session.checkoutUrl,
    providerRef: session.providerRef,
  }, 201)
})

// โ”€โ”€ POST /webhook/:provider โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const webhookRoute = createRoute({
  method: 'post',
  path: '/webhook/:provider',
  tags: ['Payment'],
  summary: 'Receive payment provider webhook (idempotent) (D89)',
  request: {
    params: z.object({ provider: z.string() }),
  },
  responses: {
    200: { description: 'Webhook processed' },
    400: { description: 'Invalid signature or payload' },
    409: { description: 'Duplicate event (idempotency)' },
  },
})

paymentRouter.openapi(webhookRoute, async (c) => {
  const { provider } = c.req.valid('param')
  const signature = c.req.header('X-Signature') ?? c.req.header('Stripe-Signature') ?? ''
  const body = await c.req.text()

  let paymentProvider
  try {
    paymentProvider = getPaymentProvider(provider)
  } catch {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Unknown provider' } }, 400)
  }

  let event
  try {
    event = await paymentProvider.verifyWebhookSignature(signature, body)
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err)
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Invalid signature' } }, 400)
  }

  // Idempotent insert webhook_events
  const [existing] = await db
    .insert(webhookEvents)
    .values({
      provider: event.provider,
      eventType: event.eventType,
      providerEventId: event.providerEventId,
      signature,
      signatureVerified: true,
      payload: JSON.parse(body),
    })
    .onConflictDoNothing()
    .returning({ id: webhookEvents.id })

  if (!existing) {
    return c.json({ received: true, duplicate: true }, 200)
  }

  // Update payment_intent status if found
  if (event.intentRef) {
    await db
      .update(paymentIntents)
      .set({ status: event.status, updatedAt: new Date() })
      .where(eq(paymentIntents.idempotencyKey, event.intentRef))

    // @needs-point-review: payment โ’ point_ledger sync (เน€เธกเธทเนเธญ status=succeeded)
    // เธฃเธญ Point chat consultation เธเนเธญเธ implement
  }

  // Mark webhook as processed
  await db
    .update(webhookEvents)
    .set({ processedAt: new Date() })
    .where(eq(webhookEvents.id, existing.id))

  return c.json({ received: true }, 200)
})

