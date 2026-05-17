// Sub-5a D80 Admin Lists Foundation — services store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ServiceRecord } from '@/lib/mocks/services.seed'
import { servicesSeed } from '@/lib/mocks/services.seed'
import { logAuditEntry, getActor } from '@/lib/audit/log'

export function nextId<T extends { id: string }>(items: T[], prefix: string): string {
  const max = items.reduce((m, it) => {
    const n = parseInt(it.id.split('-')[1] ?? '', 10)
    return Number.isNaN(n) ? m : Math.max(m, n)
  }, 0)
  return `${prefix}-${String(max + 1).padStart(3, '0')}`
}

export interface FilterState {
  status: string | null
  search: string
  dateFrom: string | null
  dateTo: string | null
}

export interface PaginationState {
  page: number
  pageSize: 20
  totalCount: number
}

interface AdminServicesState {
  items: ServiceRecord[]
  filters: FilterState
  pagination: PaginationState
  setFilters: (patch: Partial<FilterState>) => void
  setPage: (page: number) => void
  resetMockData: () => void
  filteredItems: () => ServiceRecord[]
  createItem: (input: Omit<ServiceRecord, 'id' | 'createdAt'>) => ServiceRecord
  updateItem: (id: string, patch: Partial<ServiceRecord>) => ServiceRecord
  removeItem: (id: string) => void
}

const defaultFilters: FilterState = { status: null, search: '', dateFrom: null, dateTo: null }

export const useAdminServicesStore = create<AdminServicesState>()(
  persist(
    (set, get) => ({
      items: servicesSeed,
      filters: defaultFilters,
      pagination: { page: 1, pageSize: 20, totalCount: servicesSeed.length },

      setFilters: (patch) => set((s) => ({
        filters: { ...s.filters, ...patch },
        pagination: { ...s.pagination, page: 1 },
      })),

      setPage: (page) => set((s) => ({
        pagination: { ...s.pagination, page },
      })),

      resetMockData: () => set({
        items: servicesSeed,
        filters: defaultFilters,
        pagination: { page: 1, pageSize: 20, totalCount: servicesSeed.length },
      }),

      filteredItems: () => {
        const { items, filters } = get()
        const search = filters.search.toLowerCase()
        return items
          .filter((i) => !filters.status || i.status === filters.status)
          .filter((i) => !search || [i.id, i.customerName, i.technicianName]
            .some((f) => f.toLowerCase().includes(search)))
      },

      createItem: (input) => {
        const item: ServiceRecord = {
          ...input,
          id: nextId(get().items, 'SVC'),
          createdAt: new Date().toISOString(),
        }
        set((s) => ({
          items: [item, ...s.items],
          pagination: { ...s.pagination, totalCount: s.items.length + 1 },
        }))
        logAuditEntry({ actor: getActor(), action: 'create', module: 'services', entityId: item.id })
        return item
      },

      updateItem: (id, patch) => {
        const updated = { ...get().items.find((i) => i.id === id)!, ...patch }
        set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }))
        logAuditEntry({ actor: getActor(), action: 'update', module: 'services', entityId: id })
        return updated
      },

      removeItem: (id) => {
        set((s) => ({
          items: s.items.filter((i) => i.id !== id),
          pagination: { ...s.pagination, totalCount: Math.max(0, s.items.length - 1) },
        }))
        logAuditEntry({ actor: getActor(), action: 'delete', module: 'services', entityId: id })
      },
    }),
    {
      name: 'app3r-admin-services-v1',
      partialize: (s) => ({ items: s.items, filters: s.filters, pagination: s.pagination }),
    }
  )
)
