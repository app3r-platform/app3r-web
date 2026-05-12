/**
 * refresh-token.ts — D83: Refresh token rotation (DB-backed, 7 days)
 *
 * Flow:
 *   create  → generate random token → hash → store in DB → return raw token (set in cookie)
 *   rotate  → verify hash in DB → revoke old → issue new
 *   revoke  → mark revoked=true
 */
import crypto from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { refreshTokens } from '../db/schema'
import { env } from '../env'

/** Generate cryptographically random token */
function generateToken(): string {
  return crypto.randomBytes(64).toString('hex')
}

/** Hash token for safe DB storage (never store raw token) */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/** Store new refresh token — returns raw token (to set in cookie) */
export async function createRefreshToken(userId: string): Promise<string> {
  const raw = generateToken()
  const tokenHash = hashToken(raw)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_TTL_DAYS)

  await db.insert(refreshTokens).values({ userId, tokenHash, expiresAt })
  return raw
}

/**
 * Rotate refresh token — D83 rotation logic:
 *  1. Look up old token hash
 *  2. Verify not revoked + not expired
 *  3. Revoke old token
 *  4. Issue new token
 *
 * Returns { newToken, userId } or null if invalid/expired
 */
export async function rotateRefreshToken(
  rawToken: string,
): Promise<{ newToken: string; userId: string } | null> {
  const hash = hashToken(rawToken)

  const [existing] = await db
    .select()
    .from(refreshTokens)
    .where(and(eq(refreshTokens.tokenHash, hash), eq(refreshTokens.revoked, false)))
    .limit(1)

  if (!existing || existing.expiresAt < new Date()) {
    return null
  }

  // Revoke old token
  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.id, existing.id))

  // Issue new token
  const newToken = await createRefreshToken(existing.userId)
  return { newToken, userId: existing.userId }
}

/** Revoke a specific refresh token (on logout) */
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const hash = hashToken(rawToken)
  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.tokenHash, hash))
}
