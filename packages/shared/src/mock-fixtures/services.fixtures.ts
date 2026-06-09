/**
 * services.fixtures.ts — Mock service/job data
 * Aligned with: d2-openapi.yaml#/components/schemas/ServiceResponse
 */
import type { ServiceResponse, ServiceListResponse } from '../api-client'

export const mockServiceRepairDraft: ServiceResponse = {
  id: 'service-repair-001',
  ownerId: 'user-weeer-001',
  serviceType: 'repair',
  status: 'draft',
  title: 'ซ่อมแอร์ Mitsubishi 12000 BTU',
  description: 'แอร์ไม่เย็น คอมเพรสเซอร์อาจผิดปกติ',
  pointAmount: 800,
  deadline: '2026-06-20T00:00:00Z',
  listingMetaId: 'listing-repair-001',
  createdAt: '2026-06-09T10:00:00Z',
  updatedAt: '2026-06-09T10:00:00Z',
}

export const mockServiceRepairInProgress: ServiceResponse = {
  id: 'service-repair-002',
  ownerId: 'user-weeer-001',
  serviceType: 'repair',
  status: 'in_progress',
  title: 'ซ่อมเครื่องซักผ้า Samsung 8kg',
  description: 'เครื่องซักไม่ออก น้ำไม่ระบาย',
  pointAmount: 450,
  deadline: '2026-06-12T00:00:00Z',
  listingMetaId: 'listing-repair-002',
  createdAt: '2026-06-05T08:30:00Z',
  updatedAt: '2026-06-09T09:00:00Z',
}

export const mockServiceMaintainPublished: ServiceResponse = {
  id: 'service-maintain-001',
  ownerId: 'user-weeeu-001',
  serviceType: 'maintain',
  status: 'published',
  title: 'ล้างแอร์ 2 เครื่อง',
  description: 'แอร์ LG + Daikin ในคอนโด ชั้น 5',
  pointAmount: 500,
  deadline: '2026-06-15T00:00:00Z',
  listingMetaId: 'listing-maintain-001',
  createdAt: '2026-06-08T14:00:00Z',
  updatedAt: '2026-06-08T14:00:00Z',
}

export const mockServiceCompleted: ServiceResponse = {
  id: 'service-repair-003',
  ownerId: 'user-weeer-001',
  serviceType: 'repair',
  status: 'completed',
  title: 'ซ่อมตู้เย็น LG 2 ประตู',
  description: null,
  pointAmount: 1200,
  deadline: null,
  listingMetaId: 'listing-repair-003',
  createdAt: '2026-05-20T08:00:00Z',
  updatedAt: '2026-06-01T16:00:00Z',
}

export const mockServiceList: ServiceListResponse = {
  items: [
    mockServiceRepairInProgress,
    mockServiceMaintainPublished,
    mockServiceRepairDraft,
    mockServiceCompleted,
  ],
  total: 4,
}
