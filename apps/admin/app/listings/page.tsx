'use client'
// Sub-5a D80 list + Sub-5b drawer/CRUD — listings
import { useMemo, useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { AdminListPage } from '@/components/admin-list/AdminListPage'
import { AdminDrawer, type DrawerMode } from '@/components/admin-list/AdminDrawer'
import { DeleteConfirmDialog } from '@/components/admin-list/DeleteConfirmDialog'
import { useAdminListingsStore } from '@/lib/stores/listings.store'
import type { ListingRecord } from '@/lib/mocks/listings.seed'

const STATUS_OPTIONS = [
  { value: 'draft',   label: 'ร่าง' },
  { value: 'active',  label: 'ประกาศอยู่' },
  { value: 'sold',    label: 'ขายแล้ว' },
  { value: 'expired', label: 'หมดอายุ' },
]

export default function ListingsPage() {
  const { filters, pagination, setFilters, setPage, resetMockData, filteredItems, createItem, updateItem, removeItem } = useAdminListingsStore()
  const items = filteredItems()

  const paged = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    return items.slice(start, start + pagination.pageSize)
  }, [items, pagination.page, pagination.pageSize])

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<DrawerMode>('closed')
  const [selected, setSelected] = useState<ListingRecord | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const openCreate = () => { setSelected(null); setMode('create'); setOpen(true) }
  const openView = (row: ListingRecord) => { setSelected(row); setMode('view'); setOpen(true) }

  const handleSubmit = async (data: unknown) => {
    if (mode === 'create') createItem(data as Omit<ListingRecord, 'id' | 'listedAt'>)
    else if (selected) setSelected(updateItem(selected.id, data as Partial<ListingRecord>))
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <AdminListPage
          title="ประกาศขายทั้งหมด"
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
              + เพิ่มประกาศ
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-left border-b border-gray-800">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">ชื่อประกาศ</th>
                <th className="px-4 py-3">ผู้ขาย</th>
                <th className="px-4 py-3">ประเภท</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">วันที่ลง</th>
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
                    <td className="px-4 py-3 max-w-[200px] truncate">{row.title}</td>
                    <td className="px-4 py-3 text-gray-400">{row.sellerName}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{row.listingType}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(row.listedAt).toLocaleDateString('th-TH')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </AdminListPage>

        <AdminDrawer<ListingRecord>
          module="listings"
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
