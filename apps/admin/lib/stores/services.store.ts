// Sub-5a D80 Admin Lists Foundation — services store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ServiceRecord } from '@/lib/mocks/services.seed'
import { servicesSeed } from '@/lib/mocks/services.seed'

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
    }),
    {
      name: 'app3r-admin-services-v1',
      partialize: (s) => ({ items: s.items, filters: s.filters, pagination: s.pagination }),
    }
  )
)
