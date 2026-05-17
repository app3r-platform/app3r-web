/**
 * tests/unit/lib/contact.test.ts
 * Sub-4 D78 — Stub mirror types + Contact API client
 * App3R-Admin — Phase D-4 Sub-4
 */

// ---- Type smoke tests ----
import type {
  ContactCategory,
  ContactStatus,
  ContactMessageDto,
  CreateContactMessageInput,
  UpdateContactStatusInput,
  ContactInfoAddress,
  ContactInfoPhone,
  ContactInfoEmail,
  ContactInfoSocial,
  SocialPlatform,
  ContactInfoBusinessHours,
  ContactInfoDto,
} from '@/lib/types/contact'

describe('contact stub types (Schema Plan Sec 2-3)', () => {
  it('ContactCategory has 8 D78 categories', () => {
    const cats: ContactCategory[] = [
      'general',
      'sales',
      'support',
      'partnership',
      'press',
      'feedback',
      'careers',
      'other',
    ]
    expect(cats).toHaveLength(8)
  })

  it('ContactStatus accepts 4 values', () => {
    const s: ContactStatus[] = ['new', 'read', 'replied', 'closed']
    expect(s).toHaveLength(4)
  })

  it('ContactMessageDto structure incl. soft-delete field', () => {
    const m: ContactMessageDto = {
      id: 'msg-1',
      category: 'support',
      name: 'สมชาย',
      email: 'somchai@example.com',
      phone: null,
      subject: 'ปัญหาการใช้งาน',
      body: 'รายละเอียด',
      status: 'new',
      createdAt: '2026-05-17T00:00:00Z',
      updatedAt: '2026-05-17T00:00:00Z',
      repliedAt: null,
      repliedBy: null,
      deletedAt: null,
    }
    expect(m.category).toBe('support')
    expect(m.deletedAt).toBeNull()
  })

  it('CreateContactMessageInput optional phone', () => {
    const input: CreateContactMessageInput = {
      category: 'general',
      name: 'A',
      email: 'a@b.com',
      subject: 'hi',
      body: 'msg',
    }
    expect(input.phone).toBeUndefined()
  })

  it('UpdateContactStatusInput requires status', () => {
    const u: UpdateContactStatusInput = { status: 'replied' }
    expect(u.status).toBe('replied')
  })

  it('SocialPlatform accepts 6 platforms', () => {
    const p: SocialPlatform[] = [
      'line',
      'facebook',
      'instagram',
      'youtube',
      'tiktok',
      'twitter',
    ]
    expect(p).toHaveLength(6)
  })

  it('ContactInfoDto full structure (D78)', () => {
    const addr: ContactInfoAddress = {
      street: 'ถ.สุขุมวิท',
      district: 'วัฒนา',
      province: 'กรุงเทพฯ',
      postalCode: '10110',
      country: 'ไทย',
    }
    const phone: ContactInfoPhone = { label: 'สายด่วน', number: '02-000-0000' }
    const email: ContactInfoEmail = { label: 'ทั่วไป', address: 'hi@app3r.com' }
    const social: ContactInfoSocial = {
      platform: 'line',
      handle: '@app3r',
      url: '',
    }
    const hours: ContactInfoBusinessHours = { weekdays: 'จ-ศ 9:00-18:00' }
    const dto: ContactInfoDto = {
      companyName: 'App3R',
      address: addr,
      phones: [phone],
      emails: [email],
      socials: [social],
      businessHours: hours,
      mapEmbedUrl: null,
      updatedAt: '2026-05-17T00:00:00Z',
    }
    expect(dto.phones).toHaveLength(1)
    expect(dto.address.province).toBe('กรุงเทพฯ')
    expect(dto.mapEmbedUrl).toBeNull()
  })
})

// ---- API client unit tests ----
import {
  listContactMessages,
  getContactMessage,
  updateContactStatus,
  deleteContactMessage,
  getAdminContactInfo,
  updateContactInfo,
  getPublicContactInfo,
} from '@/lib/api/contact'

const mockFetch = jest.fn()
global.fetch = mockFetch

function makeRes(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    statusText: status === 200 ? 'OK' : 'Error',
  })
}

const TOKEN = 'test-jwt'

beforeEach(() => mockFetch.mockReset())

describe('listContactMessages', () => {
  it('GET /api/admin/contact with auth header', async () => {
    mockFetch.mockReturnValue(makeRes([]))
    const r = await listContactMessages(TOKEN)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/contact'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${TOKEN}`,
        }),
      }),
    )
    expect(r).toEqual([])
  })

  it('appends category + status query params', async () => {
    mockFetch.mockReturnValue(makeRes([]))
    await listContactMessages(TOKEN, { category: 'sales', status: 'new' })
    const url: string = mockFetch.mock.calls[0][0]
    expect(url).toContain('category=sales')
    expect(url).toContain('status=new')
  })
})

describe('getContactMessage', () => {
  it('GET /api/admin/contact/:id', async () => {
    mockFetch.mockReturnValue(makeRes({ id: 'm1' }))
    const r = await getContactMessage(TOKEN, 'm1')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/contact/m1'),
      expect.anything(),
    )
    expect((r as { id: string }).id).toBe('m1')
  })
})

describe('updateContactStatus', () => {
  it('PUT /api/admin/contact/:id/status with body', async () => {
    mockFetch.mockReturnValue(makeRes({ id: 'm1', status: 'replied' }))
    await updateContactStatus(TOKEN, 'm1', { status: 'replied' })
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/admin/contact/m1/status')
    expect(opts.method).toBe('PUT')
    expect(JSON.parse(opts.body as string).status).toBe('replied')
  })
})

describe('deleteContactMessage', () => {
  it('DELETE /api/admin/contact/:id (204 no body)', async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error('no body')),
        statusText: 'No Content',
      }),
    )
    await deleteContactMessage(TOKEN, 'm1')
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/admin/contact/m1')
    expect(opts.method).toBe('DELETE')
  })
})

describe('contact-info endpoints', () => {
  it('getAdminContactInfo GET /api/admin/contact-info', async () => {
    mockFetch.mockReturnValue(makeRes({ companyName: 'App3R' }))
    const r = await getAdminContactInfo(TOKEN)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/contact-info'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${TOKEN}`,
        }),
      }),
    )
    expect((r as { companyName: string }).companyName).toBe('App3R')
  })

  it('updateContactInfo PUT /api/admin/contact-info', async () => {
    mockFetch.mockReturnValue(makeRes({ companyName: 'App3R' }))
    await updateContactInfo(TOKEN, {
      companyName: 'App3R',
      address: {
        street: 's',
        district: 'd',
        province: 'p',
        postalCode: '1',
        country: 'c',
      },
      phones: [],
      emails: [],
      socials: [],
      businessHours: { weekdays: 'จ-ศ' },
      mapEmbedUrl: null,
    })
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/admin/contact-info')
    expect(opts.method).toBe('PUT')
    expect(JSON.parse(opts.body as string).companyName).toBe('App3R')
  })

  it('getPublicContactInfo GET /api/contact-info (no auth)', async () => {
    mockFetch.mockReturnValue(makeRes({ companyName: 'App3R' }))
    await getPublicContactInfo()
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/contact-info')
    expect(opts.headers?.Authorization).toBeUndefined()
  })
})

describe('API error handling', () => {
  it('throws message + status on non-ok', async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ detail: 'Unauthorized' }),
        statusText: 'Unauthorized',
      }),
    )
    await expect(listContactMessages('bad')).rejects.toMatchObject({
      message: 'Unauthorized',
      status: 401,
    })
  })

  it('falls back to statusText when no JSON body', async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('no json')),
        statusText: 'Internal Server Error',
      }),
    )
    await expect(getPublicContactInfo()).rejects.toMatchObject({ status: 500 })
  })
})
