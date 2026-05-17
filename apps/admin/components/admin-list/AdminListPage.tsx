'use client'
// Sub-5a D80 Admin Lists Foundation — generic list page shell
import { ReactNode } from 'react'
import { FilterBar } from './FilterBar'

interface AdminListPageProps {
  title: string
  totalCount: number
  page: number
  pageSize: number
  search: string
  status: string | null
  statusOptions: { value: string; label: string }[]
  onSearchChange: (value: string) => void
  onStatusChange: (value: string | null) => void
  onPageChange: (page: number) => void
  onReset: () => void
  children: ReactNode
}

export function AdminListPage({
  title,
  totalCount,
  page,
  pageSize,
  search,
  status,
  statusOptions,
  onSearchChange,
  onStatusChange,
  onPageChange,
  onReset,
  children,
}: AdminListPageProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <div className="p-6 min-h-screen bg-gray-950 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">{title}</h1>
        <span className="text-sm text-gray-400">{totalCount} รายการ</span>
      </div>

      <FilterBar
        search={search}
        status={status}
        statusOptions={statusOptions}
        onSearchChange={onSearchChange}
        onStatusChange={onStatusChange}
        onReset={onReset}
      />

      <div className="rounded-lg border border-gray-800 overflow-hidden">
        {children}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
          <span>
            หน้า {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1 rounded border border-gray-700 disabled:opacity-40 hover:border-gray-500 transition-colors"
            >
              ก่อนหน้า
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded border border-gray-700 disabled:opacity-40 hover:border-gray-500 transition-colors"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
