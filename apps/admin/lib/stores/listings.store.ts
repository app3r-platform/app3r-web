// Sub-5a D80 Admin Lists Foundation — listings store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ListingRecord } from '@/lib/mocks/listings.seed'
import { listingsSeed } from '@/lib/mocks/listings.seed'
import type { FilterState, PaginationState } from './services.store'

interface AdminListingsState {
  items: ListingRecord[]
  filters: FilterState
  pagination: PaginationState
  setFilters: (patch: Partial<FilterState>) => void
  setPage: (page: number) => void
  resetMockData: () => void
  filteredItems: () => ListingRecord[]
}

const defaultFilters: FilterState = { status: null, search: '', dateFrom: null, dateTo: null }

export const useAdminListingsStore = create<AdminListingsState>()(
  persist(
    (set, get) => ({
      items: listingsSeed,
      filters: defaultFilters,
      pagination: { page: 1, pageSize: 20, totalCount: listingsSeed.length },

      setFilters: (patch) => set((s) => ({
        filters: { ...s.filters, ...patch },
        pagination: { ...s.pagination, page: 1 },
      })),

      setPage: (page) => set((s) => ({
        pagination: { ...s.pagination, page },
      })),

      resetMockData: () => set({
        items: listingsSeed,
        filters: defaultFilters,
        pagination: { page: 1, pageSize: 20, totalCount: listingsSeed.length },
      }),

      filteredItems: () => {
        const { items, filters } = get()
        const search = filters.search.toLowerCase()
        return items
          .filter((i) => !filters.status || i.status === filters.status)
          .filter((i) => !search || [i.id, i.title, i.sellerName]
            .some((f) => f.toLowerCase().includes(search)))
      },
    }),
    {
      name: 'app3r-admin-listings-v1',
      partialize: (s) => ({ items: s.items, filters: s.filters, pagination: s.pagination }),
    }
  )
)
