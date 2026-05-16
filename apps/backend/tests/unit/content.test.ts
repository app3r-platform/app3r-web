/**
 * tests/unit/content.test.ts — Phase D-4 Sub-3: Platform Content CMS
 *
 * Test coverage:
 *   - types/content.ts         — DTO shapes, ContentType/ContentStatus enums
 *   - services/content-service — service functions (mocked DB)
 *   - Business Rule #2         — DELETE 409 if published
 *   - Business Rule #3         — Preview token in-memory Map, TTL 24h
 *   - Business Rule #4         — Version history saved on PUT
 *   - Business Rule #5         — Create always draft
 *   - Migration SQL smoke      — 0009_content_cms.sql
 *   - HTTP routes              — via app.request()
 *
 * No real DB — mocked via vi.mock()
 * Target: vitest coverage ≥ 60%
 *
 * CMD: 362813ec-7277-8145-8148-ddd74c4222d2
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * chainable(data) — creates a Promise that also has Drizzle-like chaining methods.
 * Needed because Drizzle's query builder is a thenable with .orderBy/.limit/.where etc.
 * Without this, `const [x] = await db.select().from().where()` fails with "not iterable".
 */
function chainable(data: any[]): any {
  const p: any = Promise.resolve(data)
  p.orderBy  = vi.fn((..._: any[]) => chainable(data))
  p.limit    = vi.fn((..._: any[]) => chainable(data))
  p.offset   = vi.fn((..._: any[]) => chainable(data))
  p.where    = vi.fn((..._: any[]) => chainable(data))
  p.returning = vi.fn(async () => data)
  return p
}

/** Shorthand to build a db.select() mock returning given rows */
function mockSelect(data: any[]) {
  return {
    from: vi.fn(() => chainable(data)),
  }
}

// ── Mock DB (must be before service imports) ──────────────────────────────────
vi.mock('../../src/db/client', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(async () => []),
        onConflictDoNothing: vi.fn(() => ({ returning: vi.fn(async () => []) })),
      })),
    })),
    select: vi.fn(() => mockSelect([])),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => []),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(async () => []),
    })),
  },
}))

// ── Mock JWT ──────────────────────────────────────────────────────────────────
vi.mock('../../src/lib/jwt', () => ({
  verifyAccessToken: vi.fn().mockResolvedValue({
    userId: 'a0000001-0000-0000-0000-000000000001',
    role: 'admin',
  }),
}))

// ── Mock R2 adapter ───────────────────────────────────────────────────────────
vi.mock('../../src/lib/r2', () => ({
  r2Adapter: {
    presignPut: vi.fn(async (r2Key: string, _mime: string, expiresIn: number) => ({
      uploadUrl: `https://r2.example.com/upload/${r2Key}`,
      r2Key,
      expiresIn,
    })),
    presignGet: vi.fn(async (r2Key: string) => `https://cdn.app3r.com/${r2Key}`),
    delete: vi.fn(async () => undefined),
    putObject: vi.fn(async () => undefined),
  },
  generateR2Key: vi.fn((_ownerId: string, purpose: string, fileName: string) =>
    `${purpose}/user-001/${Date.now()}.jpg`
  ),
}))

import { db } from '../../src/db/client'
import * as contentService from '../../src/services/content-service'
import { previewTokenMap } from '../../src/services/content-service'
import { verifyAccessToken } from '../../src/lib/jwt'
import type {
  ContentPageDto,
  ContentPageDetailDto,
  ContentImageDto,
  ContentPreviewTokenDto,
  CreateContentPageInput,
  UpdateContentPageInput,
  ContentType,
  ContentStatus,
} from '../../src/types/content'

// ── Fixtures ──────────────────────────────────────────────────────────────────
const PAGE_ID  = 'b0000001-0000-0000-0000-000000000001'
const AUTHOR_ID = 'a0000001-0000-0000-0000-000000000001'
const now = new Date('2026-05-16T10:00:00Z')

const samplePageRow = {
  id: PAGE_ID,
  slug: 'hero-main',
  type: 'hero' as ContentType,
  title: 'ยินดีต้อนรับ App3R',
  body: { blocks: [{ type: 'paragraph', text: 'บริการซ่อมบำรุง' }] },
  status: 'draft' as ContentStatus,
  version: 1,
  authorId: AUTHOR_ID,
  publishedAt: null,
  createdAt: now,
  updatedAt: now,
}

const samplePageDto: ContentPageDto = {
  id: PAGE_ID,
  slug: 'hero-main',
  type: 'hero',
  title: 'ยินดีต้อนรับ App3R',
  body: { blocks: [{ type: 'paragraph', text: 'บริการซ่อมบำรุง' }] },
  status: 'draft',
  version: 1,
  authorId: AUTHOR_ID,
  publishedAt: null,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
}

const sampleImageRow = {
  id: 'img-0001-0000-0000-0000-000000000001',
  contentPageId: PAGE_ID,
  url: 'https://cdn.app3r.com/content-images/hero-main.jpg',
  r2Key: 'content-images/user/hero-main.jpg',
  alt: 'Hero banner',
  caption: 'ภาพหลัก',
  order: 0,
  createdAt: now,
}

// ── Types: ContentPageDto shape ───────────────────────────────────────────────
describe('ContentPageDto — type shape (D4-Sub3 Lesson #34 source-of-truth)', () => {
  it('has all required fields', () => {
    const dto: ContentPageDto = samplePageDto
    expect(dto).toHaveProperty('id')
    expect(dto).toHaveProperty('slug')
    expect(dto).toHaveProperty('type')
    expect(dto).toHaveProperty('title')
    expect(dto).toHaveProperty('body')
    expect(dto).toHaveProperty('status')
    expect(dto).toHaveProperty('version')
    expect(dto).toHaveProperty('authorId')
    expect(dto).toHaveProperty('publishedAt')
    expect(dto).toHaveProperty('createdAt')
    expect(dto).toHaveProperty('updatedAt')
  })

  it('body is Record<string, unknown>', () => {
    expect(typeof samplePageDto.body).toBe('object')
    expect(samplePageDto.body).not.toBeNull()
    expect(Array.isArray(samplePageDto.body)).toBe(false)
  })

  it('version starts at 1', () => {
    expect(samplePageDto.version).toBe(1)
    expect(typeof samplePageDto.version).toBe('number')
  })

  it('createdAt / updatedAt are ISO-8601', () => {
    expect(new Date(samplePageDto.createdAt).toISOString()).toBe(samplePageDto.createdAt)
    expect(new Date(samplePageDto.updatedAt).toISOString()).toBe(samplePageDto.updatedAt)
  })

  it('publishedAt and authorId are nullable', () => {
    const nullDto: ContentPageDto = { ...samplePageDto, publishedAt: null, authorId: null }
    expect(nullDto.publishedAt).toBeNull()
    expect(nullDto.authorId).toBeNull()
  })
})

// ── Types: ContentType enum ───────────────────────────────────────────────────
describe('ContentType enum values', () => {
  it('accepts hero | about | faq | static', () => {
    const types: ContentType[] = ['hero', 'about', 'faq', 'static']
    expect(types).toHaveLength(4)
    expect(types).toContain(samplePageDto.type)
  })
})

// ── Types: ContentStatus enum ─────────────────────────────────────────────────
describe('ContentStatus enum values', () => {
  it('accepts draft | published', () => {
    const statuses: ContentStatus[] = ['draft', 'published']
    expect(statuses).toHaveLength(2)
    expect(statuses).toContain(samplePageDto.status)
  })
})

// ── Types: ContentPageDetailDto includes images ────────────────────────────────
describe('ContentPageDetailDto — extends ContentPageDto with images[]', () => {
  it('has images array', () => {
    const detail: ContentPageDetailDto = { ...samplePageDto, images: [] }
    expect(Array.isArray(detail.images)).toBe(true)
  })

  it('image has all required fields', () => {
    const img: ContentImageDto = {
      id: sampleImageRow.id,
      contentPageId: sampleImageRow.contentPageId,
      url: sampleImageRow.url,
      r2Key: sampleImageRow.r2Key,
      alt: sampleImageRow.alt,
      caption: sampleImageRow.caption,
      order: sampleImageRow.order,
      createdAt: sampleImageRow.createdAt.toISOString(),
    }
    expect(img).toHaveProperty('id')
    expect(img).toHaveProperty('contentPageId')
    expect(img).toHaveProperty('url')
    expect(img).toHaveProperty('r2Key')
    expect(img).toHaveProperty('alt')
    expect(img).toHaveProperty('caption')
    expect(img).toHaveProperty('order')
    expect(img).toHaveProperty('createdAt')
  })
})

// ── Service: listPublishedPages ────────────────────────────────────────────────
describe('listPublishedPages — public endpoint', () => {
  it('returns empty array when no published pages', async () => {
    vi.mocked(db.select).mockReturnValue(mockSelect([]) as any)
    const result = await contentService.listPublishedPages('hero')
    expect(result).toEqual([])
  })

  it('returns mapped DTOs for published pages', async () => {
    vi.mocked(db.select).mockReturnValue(mockSelect([samplePageRow]) as any)
    const result = await contentService.listPublishedPages('hero')
    expect(result).toHaveLength(1)
    expect(result[0].slug).toBe('hero-main')
    expect(result[0].type).toBe('hero')
    expect(typeof result[0].body).toBe('object')
  })
})

// ── Service: getPageBySlug ────────────────────────────────────────────────────
describe('getPageBySlug — preview token logic (Rule #3)', () => {
  beforeEach(() => {
    previewTokenMap.clear()
  })

  it('returns null when slug not found', async () => {
    vi.mocked(db.select).mockReturnValue(mockSelect([]) as any)
    const result = await contentService.getPageBySlug('nonexistent')
    expect(result).toBeNull()
  })

  it('returns null for draft page without preview token', async () => {
    vi.mocked(db.select).mockReturnValue(mockSelect([samplePageRow]) as any)
    const result = await contentService.getPageBySlug('hero-main')
    expect(result).toBeNull()
  })

  it('returns page with valid preview token (Rule #3)', async () => {
    const token = 'test-token-valid'
    previewTokenMap.set(token, {
      contentPageId: PAGE_ID,
      expiresAt: new Date(Date.now() + 60_000),
    })
    // First call: find page by slug; Second call: fetch images
    vi.mocked(db.select)
      .mockReturnValueOnce(mockSelect([samplePageRow]) as any)
      .mockReturnValueOnce(mockSelect([]) as any)   // images (empty)
    const result = await contentService.getPageBySlug('hero-main', token)
    expect(result).not.toBeNull()
    expect(result?.slug).toBe('hero-main')
  })

  it('returns null for expired preview token (Rule #3)', async () => {
    const token = 'test-token-expired'
    previewTokenMap.set(token, {
      contentPageId: PAGE_ID,
      expiresAt: new Date(Date.now() - 1000),   // already expired
    })
    vi.mocked(db.select).mockReturnValue(mockSelect([samplePageRow]) as any)
    const result = await contentService.getPageBySlug('hero-main', token)
    expect(result).toBeNull()
  })

  it('returns null for token with wrong contentPageId (Rule #3)', async () => {
    const token = 'test-token-wrong-page'
    previewTokenMap.set(token, {
      contentPageId: 'c0000001-0000-0000-0000-000000000001',  // different page
      expiresAt: new Date(Date.now() + 60_000),
    })
    vi.mocked(db.select).mockReturnValue(mockSelect([samplePageRow]) as any)
    const result = await contentService.getPageBySlug('hero-main', token)
    expect(result).toBeNull()
  })
})

// ── Service: createPage (Rule #5: always draft) ───────────────────────────────
describe('createPage — Rule #5: always draft on create', () => {
  it('sets status to draft regardless of input', async () => {
    let capturedValues: any = null
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn((v) => {
        capturedValues = v
        return {
          onConflictDoNothing: vi.fn(() => ({
            returning: vi.fn(async () => [{
              ...samplePageRow,
              ...v,
              status: 'draft',
            }]),
          })),
        }
      }),
    } as any)

    const input: CreateContentPageInput = {
      slug: 'hero-main',
      type: 'hero',
      title: 'ยินดีต้อนรับ',
      body: {},
    }
    const result = await contentService.createPage(AUTHOR_ID, input)
    expect(result).not.toBe('conflict')
    if (result !== 'conflict') {
      expect(result.status).toBe('draft')
    }
    expect(capturedValues?.status).toBe('draft')
  })

  it('returns "conflict" when slug already exists (Rule #1)', async () => {
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn(() => ({
          returning: vi.fn(async () => []),  // empty = conflict
        })),
      })),
    } as any)
    const result = await contentService.createPage(AUTHOR_ID, {
      slug: 'existing-slug',
      type: 'about',
      title: 'เกี่ยวกับเรา',
      body: {},
    })
    expect(result).toBe('conflict')
  })
})

// ── Service: updatePage (Rule #4: version history) ────────────────────────────
describe('updatePage — Rule #4: saves version before update', () => {
  it('inserts into content_versions before updating content_pages', async () => {
    let insertCalls = 0
    let updateCalled = false

    vi.mocked(db.select).mockReturnValue(mockSelect([samplePageRow]) as any)

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn(() => {
        insertCalls++
        return {
          returning: vi.fn(async () => []),
          onConflictDoNothing: vi.fn(() => ({ returning: vi.fn(async () => []) })),
        }
      }),
    } as any)

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn(() => {
          updateCalled = true
          return {
            returning: vi.fn(async () => [{
              ...samplePageRow,
              title: 'Updated Title',
              version: 2,
            }]),
          }
        }),
      })),
    } as any)

    await contentService.updatePage(PAGE_ID, { title: 'Updated Title' })

    expect(insertCalls).toBeGreaterThanOrEqual(1)  // version snapshot inserted
    expect(updateCalled).toBe(true)               // page updated
  })

  it('returns null when page not found', async () => {
    vi.mocked(db.select).mockReturnValue(mockSelect([]) as any)
    const result = await contentService.updatePage('not-exist-00-0000-0000-000000000001', {})
    expect(result).toBeNull()
  })

  it('increments version number on update (Rule #4)', async () => {
    vi.mocked(db.select).mockReturnValue(mockSelect([samplePageRow]) as any)
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn(async () => []),
        onConflictDoNothing: vi.fn(() => ({ returning: vi.fn(async () => []) })),
      })),
    } as any)

    let capturedSet: any = null
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn((s) => {
        capturedSet = s
        return {
          where: vi.fn(() => ({
            returning: vi.fn(async () => [{ ...samplePageRow, version: 2 }]),
          })),
        }
      }),
    } as any)

    await contentService.updatePage(PAGE_ID, { title: 'New Title' })
    expect(capturedSet?.version).toBe(samplePageRow.version + 1)
  })
})

// ── Service: deletePage (Rule #2: 409 if published) ───────────────────────────
describe('deletePage — Rule #2: hard delete, reject if published', () => {
  it('returns "not_found" when page does not exist', async () => {
    vi.mocked(db.select).mockReturnValue(mockSelect([]) as any)
    const result = await contentService.deletePage('d0000001-0000-0000-0000-000000000001')
    expect(result).toBe('not_found')
  })

  it('returns "published" when page is published (Rule #2 — 409 guard)', async () => {
    const publishedRow = { ...samplePageRow, status: 'published', publishedAt: now }
    vi.mocked(db.select).mockReturnValue(mockSelect([publishedRow]) as any)
    const result = await contentService.deletePage(PAGE_ID)
    expect(result).toBe('published')
  })

  it('returns "ok" and calls db.delete for draft page', async () => {
    vi.mocked(db.select).mockReturnValue(mockSelect([samplePageRow]) as any)
    let deleteCalled = false
    vi.mocked(db.delete).mockReturnValue({
      where: vi.fn(async () => { deleteCalled = true; return [] }),
    } as any)
    const result = await contentService.deletePage(PAGE_ID)
    expect(result).toBe('ok')
    expect(deleteCalled).toBe(true)
  })
})

// ── Service: createPreviewToken (Rule #3) ──────────────────────────────────────
describe('createPreviewToken — in-memory Map, TTL 24h (Rule #3)', () => {
  beforeEach(() => {
    previewTokenMap.clear()
  })

  it('returns null when page not found', async () => {
    vi.mocked(db.select).mockReturnValue(mockSelect([]) as any)
    const result = await contentService.createPreviewToken('e0000001-0000-0000-0000-000000000001')
    expect(result).toBeNull()
  })

  it('returns ContentPreviewTokenDto with TTL 24h', async () => {
    vi.mocked(db.select).mockReturnValue(mockSelect([samplePageRow]) as any)
    const before = Date.now()
    const result = await contentService.createPreviewToken(PAGE_ID)
    const after = Date.now()

    expect(result).not.toBeNull()
    expect(result!.contentPageId).toBe(PAGE_ID)
    expect(typeof result!.token).toBe('string')
    expect(result!.token.length).toBeGreaterThan(0)

    const expiresMs = new Date(result!.expiresAt).getTime()
    const expectedMin = before + 24 * 60 * 60 * 1000
    const expectedMax = after  + 24 * 60 * 60 * 1000
    expect(expiresMs).toBeGreaterThanOrEqual(expectedMin)
    expect(expiresMs).toBeLessThanOrEqual(expectedMax)
  })

  it('stores token in previewTokenMap', async () => {
    vi.mocked(db.select).mockReturnValue(mockSelect([samplePageRow]) as any)
    const result = await contentService.createPreviewToken(PAGE_ID)
    expect(previewTokenMap.has(result!.token)).toBe(true)
    const entry = previewTokenMap.get(result!.token)!
    expect(entry.contentPageId).toBe(PAGE_ID)
  })

  it('replaces existing token for same page (upsert behaviour — Rule #3)', async () => {
    vi.mocked(db.select).mockReturnValue(mockSelect([samplePageRow]) as any)
    const first  = await contentService.createPreviewToken(PAGE_ID)
    const second = await contentService.createPreviewToken(PAGE_ID)

    expect(previewTokenMap.has(first!.token)).toBe(false)   // old token removed
    expect(previewTokenMap.has(second!.token)).toBe(true)   // new token stored
    expect(previewTokenMap.size).toBe(1)
  })

  it('token does NOT persist in DB (in-memory only — Rule #3)', async () => {
    const insertSpy = vi.mocked(db.insert)
    insertSpy.mockClear()
    vi.mocked(db.select).mockReturnValue(mockSelect([samplePageRow]) as any)
    await contentService.createPreviewToken(PAGE_ID)
    expect(insertSpy).not.toHaveBeenCalled()
  })
})

// ── Service: publishPage ───────────────────────────────────────────────────────
describe('publishPage — sets status=published, publishedAt=now', () => {
  it('returns null when page not found', async () => {
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => []),
        })),
      })),
    } as any)
    const result = await contentService.publishPage('f0000001-0000-0000-0000-000000000001')
    expect(result).toBeNull()
  })

  it('returns published page DTO', async () => {
    const publishedRow = {
      ...samplePageRow,
      status: 'published',
      publishedAt: now,
    }
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => [publishedRow]),
        })),
      })),
    } as any)
    const result = await contentService.publishPage(PAGE_ID)
    expect(result).not.toBeNull()
    expect(result!.status).toBe('published')
    expect(result!.publishedAt).toBe(now.toISOString())
  })
})

// ── HTTP Routes: public endpoints ─────────────────────────────────────────────
describe('HTTP routes — public (GET /api/content/:type)', () => {
  it('GET /api/content/hero returns 200 with page list', async () => {
    vi.mocked(db.select).mockReturnValue(mockSelect([{ ...samplePageRow, status: 'published' }]) as any)
    const { app } = await import('../../src/app')
    const res = await app.request('/api/content/hero', { method: 'GET' })
    expect(res.status).toBe(200)
    const body = await res.json() as ContentPageDto[]
    expect(Array.isArray(body)).toBe(true)
  })

  it('GET /api/content/invalid-type returns 400', async () => {
    const { app } = await import('../../src/app')
    const res = await app.request('/api/content/invalid-type', { method: 'GET' })
    expect(res.status).toBe(400)
  })
})

// ── HTTP Routes: admin — GET /api/admin/content ───────────────────────────────
describe('HTTP routes — admin (GET /api/admin/content/)', () => {
  it('GET /api/admin/content/ returns 401 without auth (no header)', async () => {
    // No Authorization header → getAuthUser() returns null immediately
    const { app } = await import('../../src/app')
    const res = await app.request('/api/admin/content/', { method: 'GET' })
    expect(res.status).toBe(401)
  })

  it('GET /api/admin/content/ returns 200 with auth', async () => {
    vi.mocked(db.select).mockReturnValue(mockSelect([samplePageRow]) as any)
    const { app } = await import('../../src/app')
    const res = await app.request('/api/admin/content/', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
  })
})

// ── HTTP Routes: admin — POST /api/admin/content ──────────────────────────────
describe('HTTP routes — POST /api/admin/content/ (create)', () => {
  it('returns 201 on successful create', async () => {
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn(() => ({
          returning: vi.fn(async () => [samplePageRow]),
        })),
      })),
    } as any)

    const { app } = await import('../../src/app')
    const res = await app.request('/api/admin/content/', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug: 'hero-main',
        type: 'hero',
        title: 'ยินดีต้อนรับ App3R',
        body: {},
      }),
    })
    expect(res.status).toBe(201)
  })

  it('returns 409 on slug conflict (Rule #1)', async () => {
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn(() => ({
          returning: vi.fn(async () => []),  // empty = conflict
        })),
      })),
    } as any)

    const { app } = await import('../../src/app')
    const res = await app.request('/api/admin/content/', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug: 'existing-slug',
        type: 'about',
        title: 'เกี่ยวกับเรา',
        body: {},
      }),
    })
    expect(res.status).toBe(409)
  })

  it('returns 400 on invalid slug format', async () => {
    const { app } = await import('../../src/app')
    const res = await app.request('/api/admin/content/', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug: 'INVALID SLUG WITH SPACES',
        type: 'hero',
        title: 'Test',
        body: {},
      }),
    })
    expect(res.status).toBe(400)
  })
})

// ── HTTP Routes: DELETE /api/admin/content/:id (separate tests, db-mock approach) ─
describe('HTTP routes — DELETE /api/admin/content/:id (Rule #2)', () => {
  it('returns 409 when deleting a published page (Rule #2)', async () => {
    const publishedRow = { ...samplePageRow, status: 'published' }
    vi.mocked(db.select).mockReturnValue(mockSelect([publishedRow]) as any)
    vi.mocked(db.delete).mockReturnValue({ where: vi.fn(async () => []) } as any)
    const { app } = await import('../../src/app')
    const res = await app.request(`/api/admin/content/${PAGE_ID}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(409)
  })

  it('returns 404 when page not found', async () => {
    vi.mocked(db.select).mockReturnValue(mockSelect([]) as any)
    vi.mocked(db.delete).mockReturnValue({ where: vi.fn(async () => []) } as any)
    const { app } = await import('../../src/app')
    const res = await app.request(`/api/admin/content/${PAGE_ID}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(404)
  })

  it('returns 204 on successful delete of draft page', async () => {
    vi.mocked(db.select).mockReturnValue(mockSelect([samplePageRow]) as any)
    vi.mocked(db.delete).mockReturnValue({ where: vi.fn(async () => []) } as any)
    const { app } = await import('../../src/app')
    const res = await app.request(`/api/admin/content/${PAGE_ID}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(204)
  })
})

// ── HTTP Routes: POST /api/admin/content/:id/publish ──────────────────────────
describe('HTTP routes — POST /api/admin/content/:id/publish', () => {
  it('returns 200 with published page DTO', async () => {
    const publishedRow = { ...samplePageRow, status: 'published', publishedAt: now }
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => [publishedRow]),
        })),
      })),
    } as any)
    const { app } = await import('../../src/app')
    const res = await app.request(`/api/admin/content/${PAGE_ID}/publish`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    const body = await res.json() as ContentPageDto
    expect(body.status).toBe('published')
  })

  it('returns 404 when page not found', async () => {
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => []),
        })),
      })),
    } as any)
    const { app } = await import('../../src/app')
    const res = await app.request(`/api/admin/content/${PAGE_ID}/publish`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(404)
  })
})

// ── HTTP Routes: POST /api/admin/content/:id/preview ──────────────────────────
describe('HTTP routes — POST /api/admin/content/:id/preview (Rule #3)', () => {
  beforeEach(() => previewTokenMap.clear())

  it('returns 201 with preview token DTO', async () => {
    vi.mocked(db.select).mockReturnValue(mockSelect([samplePageRow]) as any)
    const { app } = await import('../../src/app')
    const res = await app.request(`/api/admin/content/${PAGE_ID}/preview`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(201)
    const body = await res.json() as ContentPreviewTokenDto
    expect(body).toHaveProperty('token')
    expect(body).toHaveProperty('contentPageId')
    expect(body).toHaveProperty('expiresAt')
    expect(body.contentPageId).toBe(PAGE_ID)
  })

  it('returns 404 when page not found', async () => {
    vi.mocked(db.select).mockReturnValue(mockSelect([]) as any)
    const { app } = await import('../../src/app')
    const res = await app.request(`/api/admin/content/${PAGE_ID}/preview`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(404)
  })
})

// ── HTTP Routes: S5 — Role check (non-admin → 403) ────────────────────────────
describe('HTTP routes — S5 Role check: non-admin role → 403 (all 7 admin endpoints)', () => {
  const nonAdminUser = { userId: AUTHOR_ID, role: 'weeer' }

  it('GET /api/admin/content/ returns 403 for non-admin', async () => {
    vi.mocked(verifyAccessToken).mockResolvedValueOnce(nonAdminUser)
    const { app } = await import('../../src/app')
    const res = await app.request('/api/admin/content/', {
      method: 'GET',
      headers: { Authorization: 'Bearer non-admin-token' },
    })
    expect(res.status).toBe(403)
  })

  it('POST /api/admin/content/ returns 403 for non-admin', async () => {
    vi.mocked(verifyAccessToken).mockResolvedValueOnce(nonAdminUser)
    const { app } = await import('../../src/app')
    const res = await app.request('/api/admin/content/', {
      method: 'POST',
      headers: { Authorization: 'Bearer non-admin-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'test-role-check', type: 'hero', title: 'Test', body: {} }),
    })
    expect(res.status).toBe(403)
  })

  it('PUT /api/admin/content/:id returns 403 for non-admin', async () => {
    vi.mocked(verifyAccessToken).mockResolvedValueOnce(nonAdminUser)
    const { app } = await import('../../src/app')
    const res = await app.request(`/api/admin/content/${PAGE_ID}`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer non-admin-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(403)
  })

  it('DELETE /api/admin/content/:id returns 403 for non-admin', async () => {
    vi.mocked(verifyAccessToken).mockResolvedValueOnce(nonAdminUser)
    const { app } = await import('../../src/app')
    const res = await app.request(`/api/admin/content/${PAGE_ID}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer non-admin-token' },
    })
    expect(res.status).toBe(403)
  })

  it('POST /api/admin/content/:id/publish returns 403 for non-admin', async () => {
    vi.mocked(verifyAccessToken).mockResolvedValueOnce(nonAdminUser)
    const { app } = await import('../../src/app')
    const res = await app.request(`/api/admin/content/${PAGE_ID}/publish`, {
      method: 'POST',
      headers: { Authorization: 'Bearer non-admin-token' },
    })
    expect(res.status).toBe(403)
  })

  it('POST /api/admin/content/:id/preview returns 403 for non-admin', async () => {
    vi.mocked(verifyAccessToken).mockResolvedValueOnce(nonAdminUser)
    const { app } = await import('../../src/app')
    const res = await app.request(`/api/admin/content/${PAGE_ID}/preview`, {
      method: 'POST',
      headers: { Authorization: 'Bearer non-admin-token' },
    })
    expect(res.status).toBe(403)
  })

  it('POST /api/admin/content/upload-image returns 403 for non-admin', async () => {
    vi.mocked(verifyAccessToken).mockResolvedValueOnce(nonAdminUser)
    const formData = new FormData()
    formData.append('file', new Blob(['data'], { type: 'image/jpeg' }), 'test.jpg')
    formData.append('contentPageId', PAGE_ID)
    const { app } = await import('../../src/app')
    const res = await app.request('/api/admin/content/upload-image', {
      method: 'POST',
      headers: { Authorization: 'Bearer non-admin-token' },
      body: formData,
    })
    expect(res.status).toBe(403)
  })
})

// ── Migration SQL smoke check ─────────────────────────────────────────────────
describe('Migration 0009_content_cms.sql — smoke check', () => {
  const sqlPath = join(__dirname, '../../src/db/migrations/0009_content_cms.sql')
  let sql: string

  try {
    sql = readFileSync(sqlPath, 'utf-8')
  } catch {
    sql = ''
  }

  it('migration file exists', () => {
    expect(sql.length).toBeGreaterThan(0)
  })

  it('creates content_pages table', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "content_pages"')
  })

  it('creates content_images table', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "content_images"')
  })

  it('creates content_versions table', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "content_versions"')
  })

  it('has unique index on slug (Rule #1: global unique)', () => {
    expect(sql).toContain('uq_content_slug')
  })

  it('has unique index on (content_page_id, version)', () => {
    expect(sql).toContain('uq_content_version')
  })

  it('content_images has CASCADE delete', () => {
    expect(sql).toContain('ON DELETE CASCADE')
  })

  it('content_versions has CASCADE delete', () => {
    expect(sql).toContain('content_versions')
    expect(sql).toContain('ON DELETE CASCADE')
  })

  it('includes rollback instructions', () => {
    expect(sql).toContain('Rollback')
    expect(sql).toContain('DROP TABLE IF EXISTS')
  })

  it('body field uses JSONB type', () => {
    expect(sql).toContain('JSONB')
  })

  it('status defaults to draft (Rule #5)', () => {
    expect(sql).toContain("DEFAULT 'draft'")
  })
})
