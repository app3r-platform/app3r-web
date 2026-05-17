/**
 * tests/unit/lib/schemas/schemas.test.ts
 * Sub-5b D80 — Zod schemas (5 modules)
 */
import { servicesSchema } from '@/lib/schemas/services.schema'
import { listingsSchema } from '@/lib/schemas/listings.schema'
import { usersSchema } from '@/lib/schemas/users.schema'
import { pointsSchema } from '@/lib/schemas/points.schema'
import { contentSchema } from '@/lib/schemas/content.schema'

describe('servicesSchema', () => {
  it('accepts a valid service', () => {
    const r = servicesSchema.safeParse({
      customerName: 'สมชาย', technicianName: 'ช่างเอ',
      serviceType: 'repair', status: 'requested',
    })
    expect(r.success).toBe(true)
  })
  it('rejects empty customerName with Thai message', () => {
    const r = servicesSchema.safeParse({
      customerName: '', technicianName: 'ช่างเอ',
      serviceType: 'repair', status: 'requested',
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toBe('กรอกชื่อลูกค้า')
  })
})

describe('usersSchema', () => {
  it('rejects invalid email (Thai message)', () => {
    const r = usersSchema.safeParse({
      name: 'a', email: 'not-an-email', phone: '0812345678',
      role: 'weeeu', status: 'active',
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      const emailErr = r.error.issues.find((i) => i.path[0] === 'email')
      expect(emailErr?.message).toBe('อีเมลไม่ถูกต้อง')
    }
  })
  it('rejects phone shorter than 9 digits', () => {
    const r = usersSchema.safeParse({
      name: 'a', email: 'a@b.com', phone: '123',
      role: 'weeeu', status: 'active',
    })
    expect(r.success).toBe(false)
  })
})

describe('pointsSchema', () => {
  it('coerces string amount and rejects non-positive', () => {
    expect(pointsSchema.safeParse({ userName: 'u', type: 'gold', amount: '100', status: 'pending' }).success).toBe(true)
    expect(pointsSchema.safeParse({ userName: 'u', type: 'gold', amount: '0', status: 'pending' }).success).toBe(false)
  })
})

describe('listingsSchema + contentSchema', () => {
  it('listings accepts valid', () => {
    expect(listingsSchema.safeParse({ title: 't', sellerName: 's', listingType: 'resell', status: 'draft' }).success).toBe(true)
  })
  it('content rejects bad enum', () => {
    expect(contentSchema.safeParse({ title: 't', type: 'bad', author: 'a', status: 'draft' }).success).toBe(false)
  })
})
