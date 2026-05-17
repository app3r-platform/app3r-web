// Sub-5b D80 — Zod schema for ListingRecord (omit id + listedAt — auto)
import { z } from 'zod'

export const listingsSchema = z.object({
  title: z.string().min(1, 'กรอกชื่อประกาศ'),
  sellerName: z.string().min(1, 'กรอกชื่อผู้ขาย'),
  listingType: z.enum(['resell', 'scrap']),
  status: z.enum(['draft', 'active', 'sold', 'expired']),
})

export type ListingsInput = z.infer<typeof listingsSchema>
