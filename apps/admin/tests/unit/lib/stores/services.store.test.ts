/**
 * tests/unit/lib/stores/services.store.test.ts
 * Sub-5a D80 — Zustand store actions + filteredItems selector
 */
import { useAdminServicesStore } from '@/lib/stores/services.store'
import { servicesSeed } from '@/lib/mocks/services.seed'

// Reset store state between tests
beforeEach(() => {
  useAdminServicesStore.getState().resetMockData()
})

describe('useAdminServicesStore — initial state', () => {
  it('loads all seed items', () => {
    const { items } = useAdminServicesStore.getState()
    expect(items).toHaveLength(servicesSeed.length)
  })

  it('default pagination page = 1, pageSize = 20', () => {
    const { pagination } = useAdminServicesStore.getState()
    expect(pagination.page).toBe(1)
    expect(pagination.pageSize).toBe(20)
  })

  it('default filters: status null, search empty', () => {
    const { filters } = useAdminServicesStore.getState()
    expect(filters.status).toBeNull()
    expect(filters.search).toBe('')
  })
})

describe('useAdminServicesStore — setFilters', () => {
  it('updates search and resets page to 1', () => {
    useAdminServicesStore.getState().setPage(3)
    useAdminServicesStore.getState().setFilters({ search: 'test' })
    const { filters, pagination } = useAdminServicesStore.getState()
    expect(filters.search).toBe('test')
    expect(pagination.page).toBe(1)
  })

  it('updates status filter', () => {
    useAdminServicesStore.getState().setFilters({ status: 'completed' })
    expect(useAdminServicesStore.getState().filters.status).toBe('completed')
  })
})

describe('useAdminServicesStore — filteredItems', () => {
  it('returns all items when no filter applied', () => {
    const items = useAdminServicesStore.getState().filteredItems()
    expect(items).toHaveLength(servicesSeed.length)
  })

  it('filters by status', () => {
    useAdminServicesStore.getState().setFilters({ status: 'completed' })
    const items = useAdminServicesStore.getState().filteredItems()
    expect(items.every((i) => i.status === 'completed')).toBe(true)
  })

  it('filters by search (case-insensitive)', () => {
    const firstItem = servicesSeed[0]
    const searchTerm = firstItem.customerName.slice(0, 3).toLowerCase()
    useAdminServicesStore.getState().setFilters({ search: searchTerm })
    const items = useAdminServicesStore.getState().filteredItems()
    expect(items.length).toBeGreaterThan(0)
  })

  it('returns empty array when search matches nothing', () => {
    useAdminServicesStore.getState().setFilters({ search: 'XXXXXXXXNOTFOUND' })
    const items = useAdminServicesStore.getState().filteredItems()
    expect(items).toHaveLength(0)
  })
})

describe('useAdminServicesStore — setPage', () => {
  it('updates pagination page', () => {
    useAdminServicesStore.getState().setPage(2)
    expect(useAdminServicesStore.getState().pagination.page).toBe(2)
  })
})

describe('useAdminServicesStore — resetMockData', () => {
  it('resets filters and pagination to defaults', () => {
    useAdminServicesStore.getState().setFilters({ search: 'foo', status: 'cancelled' })
    useAdminServicesStore.getState().setPage(5)
    useAdminServicesStore.getState().resetMockData()
    const { filters, pagination } = useAdminServicesStore.getState()
    expect(filters.search).toBe('')
    expect(filters.status).toBeNull()
    expect(pagination.page).toBe(1)
  })
})
