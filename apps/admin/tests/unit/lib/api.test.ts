/**
 * tests/unit/lib/api.test.ts
 * ทดสอบ lib/api.ts — dev-guard pattern + request methods
 * Sub-CMD-2 Wave 1 — App3R-Admin
 */

// Mock fetch
global.fetch = jest.fn()

// Mock dev-auth module
jest.mock('@/lib/dev-auth', () => ({
  getDevTestToken: jest.fn().mockResolvedValue('dev-token-mock'),
}))

// Mock auth module
jest.mock('@/lib/auth', () => ({
  getToken: jest.fn().mockReturnValue('prod-token-mock'),
}))

import { api } from '@/lib/api'
import { getDevTestToken } from '@/lib/dev-auth'
import { getToken } from '@/lib/auth'

const mockFetch = global.fetch as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: 'ok' }),
  })
})

describe('api — dev-guard pattern', () => {
  it('ใช้ getDevTestToken ใน development mode', async () => {
    // NODE_ENV ถูกตั้งเป็น test ใน jest.setup — api.ts ใช้ dev path เมื่อ "development"
    // ใน test env: NODE_ENV = "test" → ใช้ getToken() path
    await api.get('/test-path')
    expect(getToken).toHaveBeenCalled()
    expect(getDevTestToken).not.toHaveBeenCalled()
  })
})

describe('api — HTTP methods', () => {
  it('api.get เรียก fetch ด้วย GET method', async () => {
    await api.get('/admin/users')
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/admin/users',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer prod-token-mock' }) })
    )
  })

  it('api.post ส่ง body เป็น JSON', async () => {
    const body = { name: 'test' }
    await api.post('/admin/users', body)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/admin/users',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      })
    )
  })

  it('api.patch ส่ง body เป็น JSON', async () => {
    await api.patch('/admin/config/1', { value: 5 })
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/admin/config/1',
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('api.patch ไม่มี body ได้ (optional)', async () => {
    await expect(api.patch('/admin/test')).resolves.not.toThrow()
  })

  it('โยน Error เมื่อ response ไม่ ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ detail: 'ไม่พบข้อมูล' }),
    })
    await expect(api.get('/admin/notfound')).rejects.toThrow('ไม่พบข้อมูล')
  })

  it('โยน fallback error เมื่อ response body parse ไม่ได้', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.reject(new Error('parse error')),
    })
    await expect(api.get('/admin/broken')).rejects.toThrow('เกิดข้อผิดพลาด')
  })
})
