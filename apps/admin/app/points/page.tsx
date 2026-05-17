'use client'
// Sub-5a D80 list + Sub-5b drawer/CRUD — points
import { useMemo, useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { AdminListPage } from '@/components/admin-list/AdminListPage'
import { AdminDrawer, type DrawerMode } from '@/components/admin-list/AdminDrawer'
import { DeleteConfirmDialog } from '@/components/admin-list/DeleteConfirmDialog'
import { useAdminPointsStore } from '@/lib/stores/points.store'
import type { PointRecord } from '@/lib/mocks/points.seed'

const STATUS_OPTIONS = [
  { value: 'pending',   label: 'รอดำเนินการ' },
  { value: 'completed', label: 'เสร็จแล้ว' },
  { value: 'reversed',  label: 'ยกเลิก/คืน' },
]

export default function PointsPage() {
  const { filters, pagination, setFilters, setPage, resetMockData, filteredItems, createItem, updateItem, removeItem } = useAdminPointsStore()
  const items = filteredItems()

  const paged = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    return items.slice(start, start + pagination.pageSize)
  }, [items, pagination.page, pagination.pageSize])

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<DrawerMode>('closed')
  const [selected, setSelected] = useState<PointRecord | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const openCreate = () => { setSelected(null); setMode('create'); setOpen(true) }
  const openView = (row: PointRecord) => { setSelected(row); setMode('view'); setOpen(true) }

  const handleSubmit = async (data: unknown) => {
    if (mode === 'create') createItem(data as Omit<PointRecord, 'id' | 'transactedAt'>)
    else if (selected) setSelected(updateItem(selected.id, data as Partial<PointRecord>))
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <AdminListPage
          title="Point Transactions"
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
          <div className="flex justify-end p-3 bg-gray-900/40 border-b border-gray-800">
            <button
              onClick={openCreate}
              className="px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-500"
            >
              + เพิ่มธุรกรรม
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-left border-b border-gray-800">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">ผู้ใช้</th>
                <th className="px-4 py-3">ประเภท</th>
                <th className="px-4 py-3 text-right">จำนวน</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">วันที่</th>
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
                  <tr
                    key={row.id}
                    onClick={() => openView(row)}
                    className="hover:bg-gray-800/40 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{row.id}</td>
                    <td className="px-4 py-3">{row.userName}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{row.type}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {row.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(row.transactedAt).toLocaleDateString('th-TH')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </AdminListPage>

        <AdminDrawer<PointRecord>
          module="points"
          open={open}
          mode={mode}
          item={selected}
          onOpenChange={setOpen}
          onModeChange={setMode}
          onSubmit={handleSubmit}
          onDelete={async (id) => setDeleteId(id)}
        />

        <DeleteConfirmDialog
          open={deleteId !== null}
          entityLabel={deleteId ?? ''}
          onOpenChange={(o) => !o && setDeleteId(null)}
          onConfirm={() => {
            if (deleteId) removeItem(deleteId)
            setDeleteId(null)
            setOpen(false)
          }}
        />
      </main>
    </div>
  )
}
