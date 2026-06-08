/**
 * profile.fixtures.ts — Mock user/shop profile data
 * Aligned with: d2-openapi.yaml#/components/schemas/UserMeResponse, ShopMeResponse
 */
import type { UserMeResponse, ShopMeResponse } from '../api-client'

export const mockUserMeWeeeu: UserMeResponse = {
  id: 'user-weeeu-001',
  email: 'weeeu@app3r.test',
  role: 'weeeu',
  displayName: 'สมชาย ใจดี',
  phone: '0812345678',
  avatarUrl: null,
  goldBalance: 350,
}

export const mockUserMeWeeer: UserMeResponse = {
  id: 'user-weeer-001',
  email: 'weeer@app3r.test',
  role: 'weeer',
  displayName: 'ร้านซ่อมท่อ A1',
  phone: '0891234567',
  avatarUrl: 'https://cdn.app3r.th/avatars/weeer-001.jpg',
  goldBalance: 1250,
}

export const mockUserMeWeeet: UserMeResponse = {
  id: 'user-weeet-001',
  email: 'weeet@app3r.test',
  role: 'weeet',
  displayName: 'ช่างวิชัย ขยัน',
  phone: '0811111111',
  avatarUrl: null,
  goldBalance: 750,
}

export const mockUserMeEmpty: UserMeResponse = {
  id: 'user-new-001',
  email: 'new@app3r.test',
  role: 'weeeu',
  displayName: null,
  phone: null,
  avatarUrl: null,
  goldBalance: 0,
}

export const mockShopMeWeeer: ShopMeResponse = {
  userId: 'user-weeer-001',
  shopName: 'ร้านซ่อม A1 เครื่องใช้ไฟฟ้า',
  phone: '0891234567',
  address: '123/4 ถ.สุขุมวิท แขวงคลองเตย กรุงเทพฯ 10110',
  description: 'รับซ่อมแอร์ เครื่องซักผ้า ตู้เย็น บริการรวดเร็ว มีใบรับประกัน',
}

export const mockShopMeEmpty: ShopMeResponse = {
  userId: 'user-weeer-002',
  shopName: '',
  phone: null,
  address: null,
  description: null,
}
