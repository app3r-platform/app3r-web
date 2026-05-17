'use client'
// Sub-5a D80 Admin Lists Foundation — audit log list
import { useMemo } from 'react'
import { Sidebar } from '@/components/sidebar'
import { AdminListPage } from '@/components/admin-list/AdminListPage'
import { useAdminAuditStore } from '@/lib/stores/audit.store'

export default function AuditPage() {
  const { filters, pagination, setFilters, setPage, resetMockData, filteredItems } = useAdminAuditStore()
  const items = filteredItems()

  const paged = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    return items.slice(start, start + pagination.pageSize)
  }, [items, pagination.page, pagination.pageSize])

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <AdminListPage
          title="Audit Log"
          totalCount={items.length}
          page={pagination.page}
          pageSize={pagination.pageSize}
          search={filters.search}
          status={null}
          statusOptions={[]}
          onSearchChange={(s) => setFilters({ search: s })}
          onStatusChange={() => {}}
          onPageChange={setPage}
          onReset={resetMockData}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-left border-b border-gray-800">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity ID</th>
                <th className="px-4 py-3">เวลา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-600">
                    ไม่พบรายการ
                  </td>
                </tr>
              ) : (
                paged.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-800/40">
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{row.id}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{row.actor}</td>
                    <td className="px-4 py-3 text-xs">{row.module}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                        {row.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{row.entityId}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(row.timestamp).toLocaleString('th-TH')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </AdminListPage>
      </main>
    </div>
  )
}
