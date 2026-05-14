/**
 * tests/unit/lib/auth.test.ts
 * ทดสอบ lib/auth.ts — JWT decode + localStorage helpers
 * Sub-CMD-2 Wave 1 — App3R-Admin
 */

// Mock localStorage
const mockStorage: Record<string, string> = {}
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => { mockStorage[key] = value },
    removeItem: (key: string) => { delete mockStorage[key] },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]) },
  },
  writable: true,
})

import { saveToken, getToken, removeToken, isAuthenticated, isSuperAdmin } from '@/lib/auth'

const TOKEN_KEY = 'app3r_admin_token'

beforeEach(() => {
  Object.keys(mockStorage).forEach(k => delete mockStorage[k])
})

describe('auth — saveToken / getToken / removeToken', () => {
  it('saveToken เก็บ token ใน localStorage', () => {
    saveToken('test-token-123')
    expect(mockStorage[TOKEN_KEY]).toBe('test-token-123')
  })

  it('getToken คืนค่า token ที่บันทึกไว้', () => {
    mockStorage[TOKEN_KEY] = 'abc-token'
    expect(getToken()).toBe('abc-token')
  })

  it('getToken คืน null เมื่อไม่มี token', () => {
    expect(getToken()).toBeNull()
  })

  it('removeToken ลบ token ออกจาก localStorage', () => {
    mockStorage[TOKEN_KEY] = 'token-to-remove'
    removeToken()
    expect(mockStorage[TOKEN_KEY]).toBeUndefined()
  })
})

describe('auth — isAuthenticated', () => {
  it('คืน false เมื่อไม่มี token', () => {
    expect(isAuthenticated()).toBe(false)
  })

  it('คืน true เมื่อมี token', () => {
    mockStorage[TOKEN_KEY] = 'some-token'
    expect(isAuthenticated()).toBe(true)
  })
})

describe('auth — isSuperAdmin (JWT decode + try/catch)', () => {
  function makeJWT(payload: object): string {
    const encoded = btoa(JSON.stringify(payload))
    return `header.${encoded}.signature`
  }

  it('คืน false เมื่อไม่มี token', () => {
    expect(isSuperAdmin()).toBe(false)
  })

  it('คืน true เมื่อ role === super_admin', () => {
    mockStorage[TOKEN_KEY] = makeJWT({ role: 'super_admin', sub: 1 })
    expect(isSuperAdmin()).toBe(true)
  })

  it('คืน false เมื่อ role === admin (ไม่ใช่ super_admin)', () => {
    mockStorage[TOKEN_KEY] = makeJWT({ role: 'admin', sub: 2 })
    expect(isSuperAdmin()).toBe(false)
  })

  it('คืน false เมื่อ token เสียหาย (malformed) — try/catch guard', () => {
    mockStorage[TOKEN_KEY] = 'bad.token.format!!!'
    expect(isSuperAdmin()).toBe(false)
  })
})
