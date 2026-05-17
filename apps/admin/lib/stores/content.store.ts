// Sub-5a D80 Admin Lists Foundation — content store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ContentRecord } from '@/lib/mocks/content.seed'
import { contentSeed } from '@/lib/mocks/content.seed'
import type { FilterState, PaginationState } from './services.store'
import { nextId } from './services.store'
import { logAuditEntry, getActor } from '@/lib/audit/log'

interface AdminContentState {
  items: ContentRecord[]
  filters: FilterState
  pagination: PaginationState
  setFilters: (patch: Partial<FilterState>) => void
  setPage: (page: number) => void
  resetMockData: () => void
  filteredItems: () => ContentRecord[]
  createItem: (input: Omit<ContentRecord, 'id' | 'createdAt'>) => ContentRecord
  updateItem: (id: string, patch: Partial<ContentRecord>) => ContentRecord
  removeItem: (id: string) => void
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

      createItem: (input) => {
        const item: ContentRecord = {
          ...input,
          id: nextId(get().items, 'CNT'),
          createdAt: new Date().toISOString(),
        }
        set((s) => ({
          items: [item, ...s.items],
          pagination: { ...s.pagination, totalCount: s.items.length + 1 },
        }))
        logAuditEntry({ actor: getActor(), action: 'create', module: 'content', entityId: item.id })
        return item
      },

      updateItem: (id, patch) => {
        const updated = { ...get().items.find((i) => i.id === id)!, ...patch }
        set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }))
        logAuditEntry({ actor: getActor(), action: 'update', module: 'content', entityId: id })
        return updated
      },

      removeItem: (id) => {
        set((s) => ({
          items: s.items.filter((i) => i.id !== id),
          pagination: { ...s.pagination, totalCount: Math.max(0, s.items.length - 1) },
        }))
        logAuditEntry({ actor: getActor(), action: 'delete', module: 'content', entityId: id })
      },
    }),
    {
      name: 'app3r-admin-content-v1',
      partialize: (s) => ({ items: s.items, filters: s.filters, pagination: s.pagination }),
    }
  )
)
