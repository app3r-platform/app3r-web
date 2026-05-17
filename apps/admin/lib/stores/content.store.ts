// Sub-5a D80 Admin Lists Foundation — content store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ContentRecord } from '@/lib/mocks/content.seed'
import { contentSeed } from '@/lib/mocks/content.seed'
import type { FilterState, PaginationState } from './services.store'

interface AdminContentState {
  items: ContentRecord[]
  filters: FilterState
  pagination: PaginationState
  setFilters: (patch: Partial<FilterState>) => void
  setPage: (page: number) => void
  resetMockData: () => void
  filteredItems: () => ContentRecord[]
}

const defaultFilters: FilterState = { status: null, search: '', dateFrom: null, dateTo: null }

export const useAdminContentStore = create<AdminContentState>()(
  persist(
    (set, get) => ({
      items: contentSeed,
      filters: defaultFilters,
      pagination: { page: 1, pageSize: 20, totalCount: contentSeed.length },

      setFilters: (patch) => set((s) => ({
        filters: { ...s.filters, ...patch },
        pagination: { ...s.pagination, page: 1 },
      })),

      setPage: (page) => set((s) => ({
        pagination: { ...s.pagination, page },
      })),

      resetMockData: () => set({
        items: contentSeed,
        filters: defaultFilters,
        pagination: { page: 1, pageSize: 20, totalCount: contentSeed.length },
      }),

      filteredItems: () => {
        const { items, filters } = get()
        const search = filters.search.toLowerCase()
        return items
          .filter((i) => !filters.status || i.status === filters.status)
          .filter((i) => !search || [i.id, i.title, i.type, i.author]
            .some((f) => f.toLowerCase().includes(search)))
      },
    }),
    {
      name: 'app3r-admin-content-v1',
      partialize: (s) => ({ items: s.items, filters: s.filters, pagination: s.pagination }),
    }
  )
)
