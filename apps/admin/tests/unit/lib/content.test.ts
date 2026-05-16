/**
 * tests/unit/lib/content.test.ts
 * ทดสอบ Stub types + API client สำหรับ CMS
 * App3R-Admin — Phase D-4 Sub-3
 */

// ---- Type smoke tests ----
import type {
  ContentType,
  ContentStatus,
  ContentImageDto,
  ContentVersionDto,
  ContentPageDto,
  ContentPageDetailDto,
  CreateContentPageInput,
  UpdateContentPageInput,
  ContentPreviewTokenDto,
} from '@/lib/types/content'

describe('content stub types', () => {
  it('ContentType accepts valid values', () => {
    const types: ContentType[] = ['hero', 'about', 'faq', 'static']
    expect(types).toHaveLength(4)
  })

  it('ContentStatus accepts valid values', () => {
    const statuses: ContentStatus[] = ['draft', 'published']
    expect(statuses).toHaveLength(2)
  })

  it('ContentPageDto structure is correct', () => {
    const page: ContentPageDto = {
      id: 'page-1',
      slug: 'home-hero',
      type: 'hero',
      title: 'Hero Banner',
      body: { type: 'doc', content: [] },
      status: 'draft',
      version: 1,
      authorId: null,
      publishedAt: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }
    expect(page.slug).toBe('home-hero')
    expect(page.type).toBe('hero')
    expect(page.status).toBe('draft')
  })

  it('ContentPageDetailDto extends ContentPageDto with images', () => {
    const img: ContentImageDto = {
      id: 'img-1',
      contentPageId: 'page-1',
      url: 'https://r2.example.com/img.jpg',
      r2Key: 'content/img.jpg',
      alt: 'Alt text',
      caption: null,
      order: 0,
      createdAt: '2026-01-01T00:00:00Z',
    }
    const detail: ContentPageDetailDto = {
      id: 'page-1',
      slug: 'home-hero',
      type: 'hero',
      title: 'Hero Banner',
      body: { type: 'doc', content: [] },
      status: 'published',
      version: 2,
      authorId: 'admin-1',
      publishedAt: '2026-01-02T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
      images: [img],
    }
    expect(detail.images).toHaveLength(1)
    expect(detail.images[0].r2Key).toBe('content/img.jpg')
  })

  it('CreateContentPageInput requires slug + type + title + body', () => {
    const input: CreateContentPageInput = {
      slug: 'faq-page',
      type: 'faq',
      title: 'คำถามที่พบบ่อย',
      body: { type: 'doc', content: [] },
    }
    expect(input.slug).toBe('faq-page')
  })

  it('UpdateContentPageInput allows partial updates', () => {
    const partial: UpdateContentPageInput = { title: 'New Title' }
    expect(partial.body).toBeUndefined()
    expect(partial.slug).toBeUndefined()
  })

  it('ContentVersionDto has version number and body', () => {
    const v: ContentVersionDto = {
      id: 'ver-1',
      contentPageId: 'page-1',
      version: 3,
      body: { type: 'doc', content: [] },
      publishedAt: null,
      authorId: null,
      createdAt: '2026-01-03T00:00:00Z',
    }
    expect(v.version).toBe(3)
  })

  it('ContentPreviewTokenDto has token + expiresAt', () => {
    const t: ContentPreviewTokenDto = {
      token: 'abc123',
      contentPageId: 'page-1',
      expiresAt: '2026-01-01T01:00:00Z',
    }
    expect(t.token).toBe('abc123')
  })
})

// ---- API client unit tests ----
import {
  listContentPages,
  getContentPage,
  createContentPage,
  updateContentPage,
  publishContentPage,
  deleteContentPage,
  getContentVersions,
  createPreviewToken,
  uploadContentImage,
} from '@/lib/api/content'

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

const TOKEN = 'test-jwt-token'

beforeEach(() => {
  mockFetch.mockReset()
})

describe('listContentPages', () => {
  it('calls GET /api/admin/content with auth header', async () => {
    mockFetch.mockReturnValue(makeRes([]))
    const result = await listContentPages(TOKEN)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/content'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }) }),
    )
    expect(result).toEqual([])
  })

  it('appends type + status query params', async () => {
    mockFetch.mockReturnValue(makeRes([]))
    await listContentPages(TOKEN, { type: 'hero', status: 'published' })
    const url: string = mockFetch.mock.calls[0][0]
    expect(url).toContain('type=hero')
    expect(url).toContain('status=published')
  })
})

describe('getContentPage', () => {
  it('calls GET /api/admin/content (list+filter fallback) and returns detail', async () => {
    const pages = [
      { id: 'page-1', slug: 'hero', type: 'hero', title: 'Hero', body: {}, status: 'draft',
        version: 1, authorId: null, publishedAt: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ]
    mockFetch.mockReturnValue(makeRes(pages))
    const result = await getContentPage(TOKEN, 'page-1')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/content'),
      expect.anything(),
    )
    expect(result.id).toBe('page-1')
    expect(result.images).toEqual([])
  })

  it('throws 404 when page not found in list', async () => {
    mockFetch.mockReturnValue(makeRes([]))
    await expect(getContentPage(TOKEN, 'missing')).rejects.toMatchObject({ message: 'Not found.' })
  })
})

describe('createContentPage', () => {
  it('calls POST /api/admin/content with body', async () => {
    const created = { id: 'new-1' }
    mockFetch.mockReturnValue(makeRes(created))
    await createContentPage(TOKEN, {
      slug: 'new-page', type: 'static', title: 'New', body: {},
    })
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/admin/content')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body as string).slug).toBe('new-page')
  })
})

describe('updateContentPage', () => {
  it('calls PUT /api/admin/content/:id with partial body (PUT not PATCH)', async () => {
    mockFetch.mockReturnValue(makeRes({ id: 'page-1' }))
    await updateContentPage(TOKEN, 'page-1', { title: 'Updated' })
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/admin/content/page-1')
    expect(opts.method).toBe('PUT')
    expect(JSON.parse(opts.body as string).title).toBe('Updated')
  })
})

describe('publishContentPage', () => {
  it('calls POST /api/admin/content/:id/publish', async () => {
    mockFetch.mockReturnValue(makeRes({ id: 'page-1', status: 'published' }))
    const result = await publishContentPage(TOKEN, 'page-1')
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/admin/content/page-1/publish')
    expect(opts.method).toBe('POST')
    expect((result as { status: string }).status).toBe('published')
  })
})

describe('deleteContentPage', () => {
  it('calls DELETE /api/admin/content/:id', async () => {
    mockFetch.mockReturnValue(Promise.resolve({
      ok: true, status: 204, json: () => Promise.resolve(null), statusText: 'No Content',
    }))
    await deleteContentPage(TOKEN, 'page-1')
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/admin/content/page-1')
    expect(opts.method).toBe('DELETE')
  })
})

describe('getContentVersions', () => {
  it('returns empty array (Backend endpoint pending)', async () => {
    // Backend GET /:id/versions not implemented yet — stub returns []
    const result = await getContentVersions(TOKEN, 'page-1')
    expect(result).toEqual([])
    // No fetch should be called
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

describe('createPreviewToken', () => {
  it('calls POST /api/admin/content/:id/preview', async () => {
    const token = { token: 'tok123', contentPageId: 'page-1', expiresAt: '2026-01-01T01:00:00Z' }
    mockFetch.mockReturnValue(makeRes(token))
    const result = await createPreviewToken(TOKEN, 'page-1')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/content/page-1/preview'),
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result.token).toBe('tok123')
  })
})

describe('uploadContentImage', () => {
  it('calls POST /api/admin/content/upload-image with FormData (no Content-Type header)', async () => {
    const uploaded = { id: 'img-1', url: 'https://r2.example.com/img.jpg', r2Key: 'img.jpg' }
    mockFetch.mockReturnValue(makeRes(uploaded))
    const fd = new FormData()
    fd.append('file', new Blob([''], { type: 'image/png' }), 'test.png')
    const result = await uploadContentImage(TOKEN, 'page-1', fd)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/admin/content/upload-image')
    expect(opts.method).toBe('POST')
    // FormData — should NOT set Content-Type manually
    expect(opts.headers?.['Content-Type']).toBeUndefined()
    expect(result.id).toBe('img-1')
  })

  it('injects contentPageId into FormData if missing', async () => {
    mockFetch.mockReturnValue(makeRes({ id: 'img-1', url: 'https://r2.com/img.jpg', r2Key: 'img.jpg' }))
    const fd = new FormData()
    fd.append('file', new Blob([''], { type: 'image/jpeg' }), 'img.jpg')
    await uploadContentImage(TOKEN, 'page-99', fd)
    expect(fd.get('contentPageId')).toBe('page-99')
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockReturnValue(Promise.resolve({
      ok: false, status: 413, json: () => Promise.resolve({ detail: 'File too large' }), statusText: 'Payload Too Large',
    }))
    await expect(uploadContentImage(TOKEN, 'page-1', new FormData())).rejects.toThrow('File too large')
  })
})

describe('API error handling', () => {
  it('throws with status on non-ok response', async () => {
    mockFetch.mockReturnValue(Promise.resolve({
      ok: false, status: 401,
      json: () => Promise.resolve({ detail: 'Unauthorized' }),
      statusText: 'Unauthorized',
    }))
    await expect(listContentPages('bad-token')).rejects.toMatchObject({
      message: 'Unauthorized',
      status: 401,
    })
  })
})
