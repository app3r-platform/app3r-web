// Sub-5a D80 Admin Lists Foundation — audit store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuditRecord } from '@/lib/mocks/audit.seed'
import { auditSeed } from '@/lib/mocks/audit.seed'
import type { PaginationState } from './services.store'

interface AuditFilterState {
  search: string
  dateFrom: string | null
  dateTo: string | null
}

interface AdminAuditState {
  items: AuditRecord[]
  filters: AuditFilterState
  pagination: PaginationState
  setFilters: (patch: Partial<AuditFilterState>) => void
  setPage: (page: number) => void
  resetMockData: () => void
  filteredItems: () => AuditRecord[]
}

const defaultFilters: AuditFilterState = { search: '', dateFrom: null, dateTo: null }

export const useAdminAuditStore = create<AdminAuditState>()(
  persist(
    (set, get) => ({
      items: auditSeed,
      filters: defaultFilters,
      pagination: { page: 1, pageSize: 20, totalCount: auditSeed.length },

      setFilters: (patch) => set((s) => ({
        filters: { ...s.filters, ...patch },
        pagination: { ...s.pagination, page: 1 },
      })),

      setPage: (page) => set((s) => ({
        pagination: { ...s.pagination, page },
      })),

      resetMockData: () => set({
        items: auditSeed,
        filters: defaultFilters,
        pagination: { page: 1, pageSize: 20, totalCount: auditSeed.length },
      }),

      filteredItems: () => {
        const { items, filters } = get()
        const search = filters.search.toLowerCase()
        return items
          .filter((i) => !search || [i.actor, i.module, i.entityId]
            .some((f) => f.toLowerCase().includes(search)))
      },
    }),
    {
      name: 'app3r-admin-audit-v1',
      partialize: (s) => ({ items: s.items, filters: s.filters, pagination: s.pagination }),
    }
  )
)
