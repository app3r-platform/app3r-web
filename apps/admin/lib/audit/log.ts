// Sub-5b D80 — audit helper (OBS-A: no before/after — Audit detail = Sub-5c)
import { useAdminAuditStore } from '@/lib/stores/audit.store'
import type { AuditRecord } from '@/lib/mocks/audit.seed'
import { getToken } from '@/lib/auth'

export type ModuleKey = 'services' | 'listings' | 'users' | 'points' | 'content'

export interface AuditEntryInput {
  actor: string
  action: 'create' | 'update' | 'delete'
  module: ModuleKey
  entityId: string
}

// Resolve current admin from JWT payload; fallback for dev/no-token.
export function getActor(): string {
  const token = getToken()
  if (!token) return 'admin@app3r.th'
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.email || payload.sub || 'admin@app3r.th'
  } catch {
    return 'admin@app3r.th'
  }
}

// N1: audit id = AUD- + 3 digits (consistent กับ audit.seed.ts)
export function logAuditEntry(input: AuditEntryInput): void {
  const items = useAdminAuditStore.getState().items
  const entry: AuditRecord = {
    id: `AUD-${String(items.length + 1).padStart(3, '0')}`,
    actor: input.actor,
    module: input.module,
    action: input.action,
    entityId: input.entityId,
    timestamp: new Date().toISOString(),
  }
  useAdminAuditStore.setState({ items: [entry, ...items] })
}
