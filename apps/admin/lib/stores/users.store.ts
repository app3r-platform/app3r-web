// Sub-5a D80 Admin Lists Foundation — users store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRecord } from '@/lib/mocks/users.seed'
import { usersSeed } from '@/lib/mocks/users.seed'
import type { FilterState, PaginationState } from './services.store'

interface AdminUsersState {
  items: UserRecord[]
  filters: FilterState
  pagination: PaginationState
  setFilters: (patch: Partial<FilterState>) => void
  setPage: (page: number) => void
  resetMockData: () => void
  filteredItems: () => UserRecord[]
}

const defaultFilters: FilterState = { status: null, search: '', dateFrom: null, dateTo: null }

export const useAdminUsersStore = create<AdminUsersState>()(
  persist(
    (set, get) => ({
      items: usersSeed,
      filters: defaultFilters,
      pagination: { page: 1, pageSize: 20, totalCount: usersSeed.length },

      setFilters: (patch) => set((s) => ({
        filters: { ...s.filters, ...patch },
        pagination: { ...s.pagination, page: 1 },
      })),

      setPage: (page) => set((s) => ({
        pagination: { ...s.pagination, page },
      })),

      resetMockData: () => set({
        items: usersSeed,
        filters: defaultFilters,
        pagination: { page: 1, pageSize: 20, totalCount: usersSeed.length },
      }),

      filteredItems: () => {
        const { items, filters } = get()
        const search = filters.search.toLowerCase()
        return items
          .filter((i) => !filters.status || i.status === filters.status)
          .filter((i) => !search || [i.id, i.name, i.email, i.phone]
            .some((f) => f.toLowerCase().includes(search)))
      },
    }),
    {
      name: 'app3r-admin-users-v1',
      partialize: (s) => ({ items: s.items, filters: s.filters, pagination: s.pagination }),
    }
  )
)
