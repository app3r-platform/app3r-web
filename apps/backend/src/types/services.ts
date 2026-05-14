/**
 * types/services.ts — Shared Service types (Sub-CMD-4 Wave 2)
 *
 * Export ไว้สำหรับ FE chats consume:
 *   - ServiceType    — enum string literals
 *   - ServiceStatus  — enum string literals
 *   - ServiceDto     — API response shape (camelCase)
 *   - CreateServiceDto — POST body shape
 *   - UpdateServiceDto — PATCH body shape
 *
 * FE chats import ผ่าน @app3r/backend (ถ้า monorepo types shared)
 * หรือ copy ไว้ใน apps/<chat>/src/types/services.ts
 */

// ── Enum strings ─────────────────────────────────────────────────────────────
export type ServiceType = 'repair' | 'maintain' | 'resell' | 'scrap'
export type ServiceStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled'

// ── API Response DTO ─────────────────────────────────────────────────────────
export interface ServiceDto {
  id: string
  ownerId: string
  serviceType: ServiceType
  status: ServiceStatus
  // Sub-CMD-4: fields ใหม่ (nullable — draft ไม่บังคับกรอก)
  title: string | null
  description: string | null
  pointAmount: string | null   // numeric → string (JSON safe)
  deadline: string | null      // ISO-8601 timestamp string
  createdAt: string            // ISO-8601
  updatedAt: string            // ISO-8601
}

// ── Create (POST body) ───────────────────────────────────────────────────────
export interface CreateServiceDto {
  serviceType: ServiceType
  title?: string
  description?: string
  pointAmount?: number
  deadline?: string  // ISO-8601
}

// ── Update (PATCH body) ──────────────────────────────────────────────────────
export interface UpdateServiceDto {
  title?: string
  description?: string
  pointAmount?: number
  deadline?: string | null  // ISO-8601, null = clear deadline
}

// ── Status update ────────────────────────────────────────────────────────────
export interface UpdateServiceStatusDto {
  status: ServiceStatus
}

// ── List response ─────────────────────────────────────────────────────────────
export interface ServiceListDto {
  items: ServiceDto[]
  total: number
}
