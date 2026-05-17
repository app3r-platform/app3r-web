/**
 * tests/unit/lib/audit/log.test.ts
 * Sub-5b D80 — logAuditEntry helper
 */
import { logAuditEntry } from '@/lib/audit/log'
import { useAdminAuditStore } from '@/lib/stores/audit.store'

beforeEach(() => {
  useAdminAuditStore.getState().resetMockData()
})

describe('logAuditEntry', () => {
  it('prepends a new audit entry to the store', () => {
    const before = useAdminAuditStore.getState().items.length
    logAuditEntry({ actor: 'a@app3r.th', action: 'create', module: 'services', entityId: 'SVC-999' })
    const items = useAdminAuditStore.getState().items
    expect(items.length).toBe(before + 1)
    expect(items[0].entityId).toBe('SVC-999')
    expect(items[0].action).toBe('create')
    expect(items[0].module).toBe('services')
  })

  it('generates id with AUD- prefix + 3 digits (N1)', () => {
    logAuditEntry({ actor: 'a@app3r.th', action: 'update', module: 'users', entityId: 'USR-001' })
    expect(useAdminAuditStore.getState().items[0].id).toMatch(/^AUD-\d{3}$/)
  })

  it('sets an ISO timestamp', () => {
    logAuditEntry({ actor: 'a@app3r.th', action: 'delete', module: 'points', entityId: 'TXN-001' })
    const ts = useAdminAuditStore.getState().items[0].timestamp
    expect(Number.isNaN(Date.parse(ts))).toBe(false)
  })
})
