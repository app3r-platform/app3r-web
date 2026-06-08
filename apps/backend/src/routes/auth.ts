/**
 * auth.ts — D83: Auth endpoints (signup/signin/refresh/logout/me)
 *          + D-1 Sprint: otp-request / otp-verify
 * REST + OpenAPI 3.1 via @hono/zod-openapi (D85)
 */
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { db } from '../db/client'
import { users, otpCodes } from '../db/schema'
import { hashPassword, verifyPassword } from '../lib/password'
import { signAccessToken, verifyAccessToken } from '../lib/jwt'
import {
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from '../lib/refresh-token'
import { jwtAuth, type AuthVariables } from '../middleware/jwt-auth'
import { env } from '../env'

// ── OTP helpers ────────────────────────────────────────────────────────────────
function generateOtpCode(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
}

const OTP_TTL_MINUTES = 10

export const authRouter = new OpenAPIHono<{ Variables: AuthVariables }>()

const REFRESH_COOKIE = 'refresh_token'

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'Strict' as const,
  domain: env.COOKIE_DOMAIN,
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  path: '/',
})

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const RoleEnum = z.enum(['weeeu', 'weeer', 'weeet', 'admin'])

const SignupBodySchema = z
  .object({
    email: z.string().email().openapi({ example: 'user@example.com' }),
    password: z.string().min(8).openapi({ example: 'MyPassword123!' }),
    role: RoleEnum.openapi({ example: 'weeeu' }),
  })
  .openapi('SignupBody')

const SigninBodySchema = z
  .object({
    email: z.string().email().openapi({ example: 'user@example.com' }),
    password: z.string().openapi({ example: 'MyPassword123!' }),
  })
  .openapi('SigninBody')

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.string(),
})

const AuthResponseSchema = z
  .object({
    access_token: z.string().openapi({ description: 'JWT access token (15 min)' }),
    user: UserSchema,
  })
  .openapi('AuthResponse')

const ErrorSchema = z
  .object({
    error: z.object({
      code: z.string().openapi({ example: 'EMAIL_EXISTS' }),
      message: z.string().openapi({ example: 'Email already registered' }),
    }),
  })
  .openapi('ErrorResponse')

const MeResponseSchema = z
  .object({ user: UserSchema })
  .openapi('MeResponse')

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /auth/signup
const signupRoute = createRoute({
  method: 'post',
  path: '/auth/signup',
  tags: ['Auth'],
  summary: 'Create a new user account',
  request: {
    body: { content: { 'application/json': { schema: SignupBodySchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: AuthResponseSchema } },
      description: 'User created — access token returned, refresh token set in cookie',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Validation error or email already exists',
    },
  },
})

authRouter.openapi(signupRoute, async (c) => {
  const { email, password, role } = c.req.valid('json')

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length > 0) {
    return c.json({ error: { code: 'EMAIL_EXISTS', message: 'Email already registered' } }, 400)
  }

  const passwordHash = await hashPassword(password)
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, role })
    .returning({ id: users.id, email: users.email, role: users.role })

  const accessToken = await signAccessToken({ userId: user.id, email: user.email, role: user.role })
  const refreshToken = await createRefreshToken(user.id)

  setCookie(c, REFRESH_COOKIE, refreshToken, cookieOptions())
  return c.json({ access_token: accessToken, user }, 201)
})

// POST /auth/signin
const signinRoute = createRoute({
  method: 'post',
  path: '/auth/signin',
  tags: ['Auth'],
  summary: 'Sign in with email + password',
  request: {
    body: { content: { 'application/json': { schema: SigninBodySchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: AuthResponseSchema } },
      description: 'Signed in — access token returned, refresh token set in cookie',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid credentials',
    },
  },
})

authRouter.openapi(signinRoute, async (c) => {
  const { email, password } = c.req.valid('json')

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) {
    return c.json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }, 401)
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return c.json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }, 401)
  }

  const accessToken = await signAccessToken({ userId: user.id, email: user.email, role: user.role })
  const refreshToken = await createRefreshToken(user.id)

  setCookie(c, REFRESH_COOKIE, refreshToken, cookieOptions())
  return c.json({
    access_token: accessToken,
    user: { id: user.id, email: user.email, role: user.role },
  }, 200)
})

// POST /auth/refresh
const refreshRoute = createRoute({
  method: 'post',
  path: '/auth/refresh',
  tags: ['Auth'],
  summary: 'Rotate refresh token — issue new access token',
  responses: {
    200: {
      content: { 'application/json': { schema: AuthResponseSchema } },
      description: 'New access token issued — old refresh token revoked, new set in cookie',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Missing, invalid, or expired refresh token',
    },
  },
})

authRouter.openapi(refreshRoute, async (c) => {
  const rawToken = getCookie(c, REFRESH_COOKIE)
  if (!rawToken) {
    return c.json({ error: { code: 'MISSING_REFRESH_TOKEN', message: 'Refresh token not found' } }, 401)
  }

  const result = await rotateRefreshToken(rawToken)
  if (!result) {
    deleteCookie(c, REFRESH_COOKIE, { path: '/' })
    return c.json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token is invalid or expired' } }, 401)
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, result.userId))
    .limit(1)

  if (!user) {
    return c.json({ error: { code: 'USER_NOT_FOUND', message: 'User no longer exists' } }, 401)
  }

  const accessToken = await signAccessToken({ userId: user.id, email: user.email, role: user.role })
  setCookie(c, REFRESH_COOKIE, result.newToken, cookieOptions())

  return c.json({ access_token: accessToken, user }, 200)
})

// POST /auth/logout
const logoutRoute = createRoute({
  method: 'post',
  path: '/auth/logout',
  tags: ['Auth'],
  summary: 'Logout — revoke refresh token + clear cookie',
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ message: z.string() }) } },
      description: 'Logged out',
    },
  },
})

authRouter.openapi(logoutRoute, async (c) => {
  const rawToken = getCookie(c, REFRESH_COOKIE)
  if (rawToken) {
    await revokeRefreshToken(rawToken)
  }
  deleteCookie(c, REFRESH_COOKIE, { path: '/' })
  return c.json({ message: 'Logged out successfully' }, 200)
})

// GET /auth/me — protected
const meRoute = createRoute({
  method: 'get',
  path: '/auth/me',
  tags: ['Auth'],
  summary: 'Get current user (requires valid access token)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: MeResponseSchema } },
      description: 'Current user info',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
  },
})

authRouter.use('/auth/me', jwtAuth)
authRouter.openapi(meRoute, async (c) => {
  const payload = c.get('user')
  const [user] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1)

  if (!user) {
    return c.json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } }, 401)
  }
  return c.json({ user }, 200)
})

// ── OTP Request + Verify ───────────────────────────────────────────────────────

const OtpTypeEnum = z.enum(['email_verify', 'phone', '2fa'])

const OtpRequestBodySchema = z
  .object({
    email: z.string().email().openapi({ example: 'user@example.com' }),
    type: OtpTypeEnum.default('email_verify'),
  })
  .openapi('OtpRequestBody')

const OtpRequestResponseSchema = z
  .object({
    message: z.string(),
    // In dev/test mode, code is returned for convenience
    code: z.string().optional().openapi({ description: 'OTP code (dev/test mode only)' }),
    expiresAt: z.string().datetime().openapi({ description: 'ISO-8601 expiry timestamp' }),
  })
  .openapi('OtpRequestResponse')

const OtpVerifyBodySchema = z
  .object({
    email: z.string().email().openapi({ example: 'user@example.com' }),
    code: z.string().length(6).openapi({ example: '123456' }),
    type: OtpTypeEnum.default('email_verify'),
  })
  .openapi('OtpVerifyBody')

const OtpVerifyResponseSchema = z
  .object({ verified: z.literal(true), message: z.string() })
  .openapi('OtpVerifyResponse')

// POST /auth/otp-request
const otpRequestRoute = createRoute({
  method: 'post',
  path: '/auth/otp-request',
  tags: ['Auth'],
  summary: 'Request a 6-digit OTP (email/phone/2fa)',
  request: {
    body: { content: { 'application/json': { schema: OtpRequestBodySchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: OtpRequestResponseSchema } },
      description: 'OTP created — sent to user (code exposed only in dev/test mode)',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'User not found',
    },
  },
})

authRouter.openapi(otpRequestRoute, async (c) => {
  const { email, type } = c.req.valid('json')

  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!user) {
    return c.json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } }, 404)
  }

  const code = generateOtpCode()
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)

  await db.insert(otpCodes).values({
    userId: user.id,
    code,
    type,
    expiresAt,
  })

  // TODO (D-1 future): send code via email/SMS in production
  // For now, return code in dev/test mode (NODE_ENV !== 'production')
  const response: { message: string; expiresAt: string; code?: string } = {
    message: `OTP sent (type: ${type})`,
    expiresAt: expiresAt.toISOString(),
  }
  if (env.NODE_ENV !== 'production') {
    response.code = code
  }

  return c.json(response, 200)
})

// POST /auth/otp-verify
const otpVerifyRoute = createRoute({
  method: 'post',
  path: '/auth/otp-verify',
  tags: ['Auth'],
  summary: 'Verify a 6-digit OTP code',
  request: {
    body: { content: { 'application/json': { schema: OtpVerifyBodySchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: OtpVerifyResponseSchema } },
      description: 'OTP verified',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid, expired, or already-used OTP',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'User not found',
    },
  },
})

authRouter.openapi(otpVerifyRoute, async (c) => {
  const { email, code, type } = c.req.valid('json')

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!user) {
    return c.json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } }, 404)
  }

  const now = new Date()

  // Find a valid (unexpired + unused) OTP matching user + code + type
  const [otp] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.userId, user.id),
        eq(otpCodes.code, code),
        eq(otpCodes.type, type),
        gt(otpCodes.expiresAt, now),
        isNull(otpCodes.usedAt),
      ),
    )
    .orderBy(otpCodes.createdAt)
    .limit(1)

  if (!otp) {
    return c.json(
      { error: { code: 'INVALID_OTP', message: 'OTP is invalid, expired, or already used' } },
      400,
    )
  }

  // Mark as used
  await db
    .update(otpCodes)
    .set({ usedAt: now })
    .where(eq(otpCodes.id, otp.id))

  return c.json({ verified: true as const, message: 'OTP verified successfully' }, 200)
})
