/**
 * tests/unit/lib/stores/audit.store.test.ts
 * Sub-5c D80 — seedIfEmpty + filter shape extension + selector
 */
import { useAdminAuditStore } from '@/lib/stores/audit.store'
import { auditSeed } from '@/lib/mocks/audit.seed'

beforeEach(() => {
  useAdminAuditStore.getState().resetMockData()
})

describe('useAdminAuditStore — seedIfEmpty', () => {
  it('reseeds when items is empty + sets pagination', () => {
    useAdminAuditStore.setState({ items: [] })
    useAdminAuditStore.getState().seedIfEmpty()
    const s = useAdminAuditStore.getState()
    expect(s.items).toHaveLength(auditSeed.length)
    expect(s.pagination.totalCount).toBe(auditSeed.length)
    expect(s.pagination.page).toBe(1)
  })

  it('is idempotent — no-op + no duplicate when items already present', () => {
    const before = useAdminAuditStore.getState().items.length
    useAdminAuditStore.getState().seedIfEmpty()
    useAdminAuditStore.getState().seedIfEmpty()
    expect(useAdminAuditStore.getState().items).toHaveLength(before)
  })
})

describe('useAdminAuditStore — default filters', () => {
  it('includes action:null + module:null', () => {
    const { filters } = useAdminAuditStore.getState()
    expect(filters.action).toBeNull()
    expect(filters.module).toBeNull()
    expect(filters.dateFrom).toBeNull()
    expect(filters.dateTo).toBeNull()
  })
})

describe('useAdminAuditStore — filteredItems (search + date + action + module AND)', () => {
  it('filters by action', () => {
    useAdminAuditStore.getState().setFilters({ action: 'create' })
    const items = useAdminAuditStore.getState().filteredItems()
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((i) => i.action === 'create')).toBe(true)
  })

  it('filters by module (incl. contact)', () => {
    useAdminAuditStore.getState().setFilters({ module: 'contact' })
    const items = useAdminAuditStore.getState().filteredItems()
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((i) => i.module === 'contact')).toBe(true)
  })

  it('combines action + module (AND)', () => {
    useAdminAuditStore.getState().setFilters({ action: 'update', module: 'users' })
    const items = useAdminAuditStore.getState().filteredItems()
    expect(items.every((i) => i.action === 'update' && i.module === 'users')).toBe(true)
  })

  it('filters by date range (timestamp string compare)', () => {
    const mid = auditSeed[50].timestamp
    useAdminAuditStore.getState().setFilters({ dateFrom: mid })
    const items = useAdminAuditStore.getState().filteredItems()
    expect(items.every((i) => i.timestamp >= mid)).toBe(true)
  })

  it('null action/module = no filter (all items)', () => {
    const items = useAdminAuditStore.getState().filteredItems()
    expect(items).toHaveLength(auditSeed.length)
  })
})
