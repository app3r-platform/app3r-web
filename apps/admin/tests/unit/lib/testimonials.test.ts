/**
 * tests/unit/lib/testimonials.test.ts
 * Sub-2 D-4 — Stub mirror types + Testimonials API client
 * App3R-Admin — Phase D-4 Sub-2
 */

import type {
  TestimonialStatus,
  TestimonialDto,
  CreateTestimonialInput,
  UpdateTestimonialInput,
} from '@/lib/types/testimonials'

describe('testimonials stub types (Schema Plan Sec 2)', () => {
  it('TestimonialStatus = draft | published (OBS-1 status enum)', () => {
    const s: TestimonialStatus[] = ['draft', 'published']
    expect(s).toHaveLength(2)
  })

  it('TestimonialDto full structure', () => {
    const t: TestimonialDto = {
      id: 't1',
      name: 'คุณสมหญิง ว.',
      role: 'ลูกค้า WeeeU — กรุงเทพฯ',
      stars: '★★★★★',
      starsRating: 5,
      text: 'ใช้งานง่ายมาก',
      avatar: '👩‍🦱',
      sortOrder: 1,
      status: 'published',
      publishedAt: '2026-05-17T00:00:00Z',
      createdAt: '2026-05-17T00:00:00Z',
      updatedAt: '2026-05-17T00:00:00Z',
    }
    expect(t.starsRating).toBe(5)
    expect(t.status).toBe('published')
    expect(t.stars).toBe('★★★★★')
  })

  it('CreateTestimonialInput optional sortOrder + status', () => {
    const c: CreateTestimonialInput = {
      name: 'A',
      role: 'B',
      starsRating: 4,
      text: 'hello',
      avatar: '👷',
    }
    expect(c.sortOrder).toBeUndefined()
    expect(c.status).toBeUndefined()
  })

  it('UpdateTestimonialInput is fully partial', () => {
    const u: UpdateTestimonialInput = { status: 'published' }
    expect(u.name).toBeUndefined()
    expect(u.status).toBe('published')
  })
})

import {
  listTestimonials,
  getTestimonial,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  togglePublishTestimonial,
  getPublicTestimonials,
} from '@/lib/api/testimonials'

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

describe('listTestimonials', () => {
  it('GET /api/admin/testimonials with auth header', async () => {
    mockFetch.mockReturnValue(makeRes([]))
    const r = await listTestimonials(TOKEN)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/testimonials'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${TOKEN}`,
        }),
      }),
    )
    expect(r).toEqual([])
  })
})

describe('getTestimonial', () => {
  it('GET /api/admin/testimonials/:id', async () => {
    mockFetch.mockReturnValue(makeRes({ id: 't1' }))
    const r = await getTestimonial(TOKEN, 't1')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/testimonials/t1'),
      expect.anything(),
    )
    expect((r as { id: string }).id).toBe('t1')
  })
})

describe('createTestimonial', () => {
  it('POST /api/admin/testimonials with body', async () => {
    mockFetch.mockReturnValue(makeRes({ id: 'new1' }))
    await createTestimonial(TOKEN, {
      name: 'A',
      role: 'B',
      starsRating: 5,
      text: 'hi',
      avatar: '👷',
    })
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/admin/testimonials')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body as string).name).toBe('A')
  })
})

describe('updateTestimonial', () => {
  it('PUT /api/admin/testimonials/:id', async () => {
    mockFetch.mockReturnValue(makeRes({ id: 't1' }))
    await updateTestimonial(TOKEN, 't1', { name: 'New' })
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/admin/testimonials/t1')
    expect(opts.method).toBe('PUT')
    expect(JSON.parse(opts.body as string).name).toBe('New')
  })
})

describe('deleteTestimonial', () => {
  it('DELETE /api/admin/testimonials/:id (204 no body)', async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error('no body')),
        statusText: 'No Content',
      }),
    )
    await deleteTestimonial(TOKEN, 't1')
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/admin/testimonials/t1')
    expect(opts.method).toBe('DELETE')
  })
})

describe('togglePublishTestimonial', () => {
  it('POST /api/admin/testimonials/:id/publish', async () => {
    mockFetch.mockReturnValue(makeRes({ id: 't1', status: 'published' }))
    const r = await togglePublishTestimonial(TOKEN, 't1')
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/admin/testimonials/t1/publish')
    expect(opts.method).toBe('POST')
    expect((r as { status: string }).status).toBe('published')
  })
})

describe('getPublicTestimonials', () => {
  it('GET /api/testimonials (no auth)', async () => {
    mockFetch.mockReturnValue(makeRes([]))
    await getPublicTestimonials()
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/testimonials')
    expect(opts.headers?.Authorization).toBeUndefined()
  })
})

describe('API error handling', () => {
  it('throws message + status on non-ok', async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ detail: 'Forbidden' }),
        statusText: 'Forbidden',
      }),
    )
    await expect(listTestimonials('bad')).rejects.toMatchObject({
      message: 'Forbidden',
      status: 403,
    })
  })

  it('falls back to statusText when no JSON', async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('no json')),
        statusText: 'Internal Server Error',
      }),
    )
    await expect(getPublicTestimonials()).rejects.toMatchObject({
      status: 500,
    })
  })
})
