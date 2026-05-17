// Sub-5a D80 Admin Lists Foundation — points store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PointRecord } from '@/lib/mocks/points.seed'
import { pointsSeed } from '@/lib/mocks/points.seed'
import type { FilterState, PaginationState } from './services.store'
import { nextId } from './services.store'
import { logAuditEntry, getActor } from '@/lib/audit/log'

interface AdminPointsState {
  items: PointRecord[]
  filters: FilterState
  pagination: PaginationState
  setFilters: (patch: Partial<FilterState>) => void
  setPage: (page: number) => void
  resetMockData: () => void
  filteredItems: () => PointRecord[]
  createItem: (input: Omit<PointRecord, 'id' | 'transactedAt'>) => PointRecord
  updateItem: (id: string, patch: Partial<PointRecord>) => PointRecord
  removeItem: (id: string) => void
}

const defaultFilters: FilterState = { status: null, search: '', dateFrom: null, dateTo: null }

export const useAdminPointsStore = create<AdminPointsState>()(
  persist(
    (set, get) => ({
      items: pointsSeed,
      filters: defaultFilters,
      pagination: { page: 1, pageSize: 20, totalCount: pointsSeed.length },

      setFilters: (patch) => set((s) => ({
        filters: { ...s.filters, ...patch },
        pagination: { ...s.pagination, page: 1 },
      })),

      setPage: (page) => set((s) => ({
        pagination: { ...s.pagination, page },
      })),

      resetMockData: () => set({
        items: pointsSeed,
        filters: defaultFilters,
        pagination: { page: 1, pageSize: 20, totalCount: pointsSeed.length },
      }),

      filteredItems: () => {
        const { items, filters } = get()
        const search = filters.search.toLowerCase()
        return items
          .filter((i) => !filters.status || i.status === filters.status)
          .filter((i) => !search || [i.id, i.userName, i.type]
            .some((f) => f.toLowerCase().includes(search)))
      },

      createItem: (input) => {
        const item: PointRecord = {
          ...input,
          id: nextId(get().items, 'TXN'),
          transactedAt: new Date().toISOString(),
        }
        set((s) => ({
          items: [item, ...s.items],
          pagination: { ...s.pagination, totalCount: s.items.length + 1 },
        }))
        logAuditEntry({ actor: getActor(), action: 'create', module: 'points', entityId: item.id })
        return item
      },

      updateItem: (id, patch) => {
        const updated = { ...get().items.find((i) => i.id === id)!, ...patch }
        set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }))
        logAuditEntry({ actor: getActor(), action: 'update', module: 'points', entityId: id })
        return updated
      },

      removeItem: (id) => {
        set((s) => ({
          items: s.items.filter((i) => i.id !== id),
          pagination: { ...s.pagination, totalCount: Math.max(0, s.items.length - 1) },
        }))
        logAuditEntry({ actor: getActor(), action: 'delete', module: 'points', entityId: id })
      },
    }),
    {
      name: 'app3r-admin-points-v1',
      partialize: (s) => ({ items: s.items, filters: s.filters, pagination: s.pagination }),
    }
  )
)
