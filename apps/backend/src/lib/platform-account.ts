/**
 * platform-account.ts — B2 Platform Revenue Account resolver (STEP 1/2 · HUB Gen89)
 *
 * Resolves the seeded platform-revenue user (migration 0047_b2_platform_revenue.sql) whose 'cash'
 * wallet is the revenue pool. STEP 2 (Point) imports getPlatformRevenueUserId() to credit the fee-leg
 * of releaseEscrow / splitEscrow into that wallet — closing CF1 fee-leak once platform_fee_percent>0.
 *
 * Kept in a NEW standalone file (NOT escrow-service.ts) so the STEP 1 seed/resolver and the STEP 2
 * fee-credit wiring (Point) do not collide at merge.
 *
 * fail-loud: throws if the platform user is absent — aborting a money operation is safer than
 * crediting fees to a missing/wrong user. Lookup is by the stable canonical email.
 */
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'
import type { Tx } from './point-service'

// Must match migration 0047_b2_platform_revenue.sql (deterministic seed).
export const PLATFORM_REVENUE_USER_ID = '00000000-0000-0000-0000-0000000000fe'
export const PLATFORM_REVENUE_EMAIL = 'platform-revenue@system.app3r'

/**
 * Resolve the platform revenue user id (recipient of the fee-leg).
 * @throws if not seeded — callers must NOT swallow this (fee must never go to the wrong account).
 */
export async function getPlatformRevenueUserId(tx: Tx): Promise<string> {
  const [u] = await tx
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, PLATFORM_REVENUE_EMAIL))
    .limit(1)
  if (!u) {
    throw new Error(
      'PLATFORM_REVENUE_USER_MISSING: platform revenue account not seeded ' +
        '(apply migration 0047_b2_platform_revenue.sql)',
    )
  }
  return u.id
}
