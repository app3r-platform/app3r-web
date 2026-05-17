'use client'
// Sub-5a D80 Admin Lists Foundation — content list (mock)
import { useMemo } from 'react'
import { Sidebar } from '@/components/sidebar'
import { AdminListPage } from '@/components/admin-list/AdminListPage'
import { useAdminContentStore } from '@/lib/stores/content.store'

const STATUS_OPTIONS = [
  { value: 'draft',     label: 'ฉบับร่าง' },
  { value: 'published', label: 'เผยแพร่แล้ว' },
  { value: 'archived',  label: 'จัดเก็บแล้ว' },
]

const TYPE_LABELS: Record<string, string> = {
  article:   'บทความ',
  marketing: 'การตลาด',
  contact:   'ติดต่อ',
}

export default function ContentPage() {
  const { filters, pagination, setFilters, setPage, resetMockData, filteredItems } = useAdminContentStore()
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
          title="จัดการเนื้อหา"
          totalCount={items.length}
          page={pagination.page}
          pageSize={pagination.pageSize}
          search={filters.search}
          status={filters.status}
          statusOptions={STATUS_OPTIONS}
          onSearchChange={(s) => setFilters({ search: s })}
          onStatusChange={(s) => setFilters({ status: s })}
          onPageChange={setPage}
          onReset={resetMockData}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-left border-b border-gray-800">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">ชื่อเรื่อง</th>
                <th className="px-4 py-3">ประเภท</th>
                <th className="px-4 py-3">ผู้เขียน</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">วันที่สร้าง</th>
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
                    <td className="px-4 py-3 max-w-[200px] truncate font-medium">{row.title}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{TYPE_LABELS[row.type] ?? row.type}</td>
                    <td className="px-4 py-3 text-gray-400">{row.author}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(row.createdAt).toLocaleDateString('th-TH')}
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
