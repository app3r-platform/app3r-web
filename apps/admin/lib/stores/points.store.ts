// Sub-5a D80 Admin Lists Foundation — points store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PointRecord } from '@/lib/mocks/points.seed'
import { pointsSeed } from '@/lib/mocks/points.seed'
import type { FilterState, PaginationState } from './services.store'

interface AdminPointsState {
  items: PointRecord[]
  filters: FilterState
  pagination: PaginationState
  setFilters: (patch: Partial<FilterState>) => void
  setPage: (page: number) => void
  resetMockData: () => void
  filteredItems: () => PointRecord[]
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
    }),
    {
      name: 'app3r-admin-points-v1',
      partialize: (s) => ({ items: s.items, filters: s.filters, pagination: s.pagination }),
    }
  )
)
