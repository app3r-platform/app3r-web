// Sub-5a D80 Admin Lists Foundation — users store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRecord } from '@/lib/mocks/users.seed'
import { usersSeed } from '@/lib/mocks/users.seed'
import type { FilterState, PaginationState } from './services.store'
import { nextId } from './services.store'
import { logAuditEntry, getActor } from '@/lib/audit/log'

interface AdminUsersState {
  items: UserRecord[]
  filters: FilterState
  pagination: PaginationState
  setFilters: (patch: Partial<FilterState>) => void
  setPage: (page: number) => void
  resetMockData: () => void
  filteredItems: () => UserRecord[]
  createItem: (input: Omit<UserRecord, 'id' | 'registeredAt'>) => UserRecord
  updateItem: (id: string, patch: Partial<UserRecord>) => UserRecord
  removeItem: (id: string) => void
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

      createItem: (input) => {
        const item: UserRecord = {
          ...input,
          id: nextId(get().items, 'USR'),
          registeredAt: new Date().toISOString(),
        }
        set((s) => ({
          items: [item, ...s.items],
          pagination: { ...s.pagination, totalCount: s.items.length + 1 },
        }))
        logAuditEntry({ actor: getActor(), action: 'create', module: 'users', entityId: item.id })
        return item
      },

      updateItem: (id, patch) => {
        const updated = { ...get().items.find((i) => i.id === id)!, ...patch }
        set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }))
        logAuditEntry({ actor: getActor(), action: 'update', module: 'users', entityId: id })
        return updated
      },

      removeItem: (id) => {
        set((s) => ({
          items: s.items.filter((i) => i.id !== id),
          pagination: { ...s.pagination, totalCount: Math.max(0, s.items.length - 1) },
        }))
        logAuditEntry({ actor: getActor(), action: 'delete', module: 'users', entityId: id })
      },
    }),
    {
      name: 'app3r-admin-users-v1',
      partialize: (s) => ({ items: s.items, filters: s.filters, pagination: s.pagination }),
    }
  )
)
