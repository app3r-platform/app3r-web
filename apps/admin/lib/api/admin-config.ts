// D84 admin_config API client — App3R-Admin W-Round-1 Wave 2
// Typed wrappers over real backend endpoints (ห้ามแก้ backend):
//   GET    /api/v1/admin/config            → { items }
//   GET    /api/v1/admin/config/:key       → entry
//   PUT    /api/v1/admin/config/:key       → entry (upsert + audit old→new)
//   GET    /api/v1/admin/config/:key/audit → { items }
// ใช้ api helper (lib/api.ts) เพื่อ reuse dev-auth bypass + Bearer header.

import { api } from '../api'
import type {
  AdminConfigEntry,
  AdminConfigListResponse,
  AdminConfigAuditResponse,
} from '../types/admin-config'

export function listAdminConfig(): Promise<AdminConfigListResponse> {
  return api.get<AdminConfigListResponse>('/admin/config')
}

export function getAdminConfig<V = unknown>(key: string): Promise<AdminConfigEntry<V>> {
  return api.get<AdminConfigEntry<V>>(`/admin/config/${key}`)
}

export function putAdminConfig<V = unknown>(
  key: string,
  value: V,
  description?: string,
): Promise<AdminConfigEntry<V>> {
  return api.put<AdminConfigEntry<V>>(`/admin/config/${key}`, { value, description })
}

export function getAdminConfigAudit(key: string): Promise<AdminConfigAuditResponse> {
  return api.get<AdminConfigAuditResponse>(`/admin/config/${key}/audit`)
}
