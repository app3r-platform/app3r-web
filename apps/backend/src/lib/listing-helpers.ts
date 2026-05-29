/**
 * listing-helpers.ts — W-Round-1 Wave 2.x Part1: snake_case DTO + seller/buyer type + fee timing
 *
 * รวม helper ที่ routes/listings.ts + offers ใช้ร่วม (Eng-11 ลด duplicate)
 *  - sellerTypeFromRole : role → WeeeU|WeeeR
 *  - getFee/chargeFee   : 1D point timing (config-driven · D75 ปัดเต็ม · audit ผ่าน ledger)
 *  - toListingDto       : snake_case contract (Ruling 1E) join listing_meta + used_appliance_listings
 */
import { eq } from 'drizzle-orm'
import { adminConfig } from '../db/schema'
import type { ListingMeta, UsedApplianceListing } from '../db/schema'
import { publicCounters } from './listing-counters'
import { debitGold, roundD75, type Tx } from './point-service'

export interface AuthedUser {
  userId: string
  email: string
  role: string
}

/** role → seller/buyer type (D59/D61: WeeeU|WeeeR) */
export function sellerTypeFromRole(role?: string): 'WeeeU' | 'WeeeR' {
  return role === 'weeer' ? 'WeeeR' : 'WeeeU'
}

/**
 * อ่านค่า fee จาก admin_config (Gold Point/ครั้ง) — default 0 ถ้าไม่ตั้ง
 * (ไม่เดา amount — admin กำหนดผ่าน admin_config key: listing_fee / offer_fee)
 * value รองรับ: number ตรง ๆ หรือ { amount: number }
 */
export async function getFee(tx: Tx, key: 'listing_fee' | 'offer_fee'): Promise<number> {
  const [cfg] = await tx.select().from(adminConfig).where(eq(adminConfig.key, key)).limit(1)
  const v = cfg?.value as unknown
  if (typeof v === 'number' && v >= 0) return roundD75(v)
  if (v && typeof v === 'object' && typeof (v as { amount?: unknown }).amount === 'number') {
    const a = (v as { amount: number }).amount
    return a >= 0 ? roundD75(a) : 0
  }
  return 0
}

/** ตัด fee (Gold · D75) + audit (ledger) — no-op ถ้า amount<=0 */
export async function chargeFee(
  tx: Tx,
  args: { userId: string; amount: number; reference: string; kind: string },
): Promise<void> {
  if (args.amount <= 0) return
  await debitGold(tx, {
    userId: args.userId,
    amount: roundD75(args.amount),
    reference: args.reference,
    idempotencyKey: `${args.kind}:${args.reference}`,
    type: 'spend',
    metadata: { fee: args.kind },
  })
}

/** listing DTO — camelCase API contract (HUB Gen 37 casing FINAL) · join listing_meta + used_appliance_listings */
export function toListingDto(
  meta: ListingMeta,
  used: UsedApplianceListing | null,
  insider: boolean,
) {
  const counters = publicCounters(meta, insider)
  return {
    id: meta.listingId,
    listingMetaId: meta.listingId,
    sellerId: used?.sellerId ?? meta.ownerId,
    sellerType: used?.sellerType ?? null,
    listingType: used?.listingType ?? meta.listingType,
    applianceId: used?.applianceId ?? null,
    warranty: used?.warranty ?? null,
    scrapItemId: used?.scrapItemId ?? null,
    conditionGrade: used?.conditionGrade ?? null,
    workingParts: used?.workingParts ?? null,
    price: used ? Number(used.price) : null,
    deliveryMethods: used?.deliveryMethods ?? [],
    status: meta.state,
    tambonId: meta.tambonId,
    viewCount: counters.viewCount,
    offerCount: counters.offerCount,
    expiresAt: used?.expiresAt?.toISOString() ?? null,
    createdAt: meta.createdAt.toISOString(),
    updatedAt: meta.updatedAt.toISOString(),
  }
}
