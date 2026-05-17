// ⚠️ MOCK SEED — Sub-5a D80 Admin Lists Foundation
// Sub-5a T+1 | 100 records | Thai context

export interface AuditRecord {
  id: string
  actor: string
  module: string
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject'
  entityId: string
  timestamp: string
}

const actors = ['admin@app3r.th','superadmin@app3r.th','ops@app3r.th','support@app3r.th']
const modules = ['users','services','listings','points','content','contact']
const actions: AuditRecord['action'][] = ['create','update','delete','approve','reject']

function isoDate(hoursAgo: number) {
  const d = new Date('2026-05-17T12:00:00Z')
  d.setHours(d.getHours() - hoursAgo)
  return d.toISOString()
}

export const auditSeed: AuditRecord[] = Array.from({ length: 100 }, (_, i) => ({
  id: `AUD-${String(i + 1).padStart(3, '0')}`,
  actor: actors[i % actors.length],
  module: modules[i % modules.length],
  action: actions[i % actions.length],
  entityId: `${modules[i % modules.length].toUpperCase().slice(0, 3)}-${String(i + 1).padStart(3, '0')}`,
  timestamp: isoDate(i),
}))
