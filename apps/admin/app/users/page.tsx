'use client'
// Sub-5a D80 list + Sub-5b drawer/CRUD — users
// MOCK_USERS — reference data (mock provided via useAdminUsersStore / lib/mocks/users.seed.ts)
// const MOCK_USERS = [
//   { id: "u-001", name: "สมชาย ใจดี",    email: "somchai@test.com",   role: "weeeu",  status: "active"    },
//   { id: "u-002", name: "สมหญิง รักดี",   email: "somying@test.com",   role: "weeeu",  status: "active"    },
//   { id: "u-003", name: "ร้านซ่อม A+",    email: "shopaplus@test.com", role: "weeer",  status: "active"    },
//   { id: "u-004", name: "ช่าง สมศักดิ์",  email: "somsak@test.com",    role: "weeet",  status: "active"    },
//   { id: "u-005", name: "มานะ ดีงาม",     email: "mana@test.com",      role: "weeeu",  status: "suspended" },
// ];
import { useMemo, useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { AdminListPage } from '@/components/admin-list/AdminListPage'
import { AdminDrawer, type DrawerMode } from '@/components/admin-list/AdminDrawer'
import { DeleteConfirmDialog } from '@/components/admin-list/DeleteConfirmDialog'
import { useAdminUsersStore } from '@/lib/stores/users.store'
import type { UserRecord } from '@/lib/mocks/users.seed'

const STATUS_OPTIONS = [
  { value: 'active',         label: 'ใช้งานอยู่' },
  { value: 'suspended',      label: 'ระงับแล้ว' },
  { value: 'pending_verify', label: 'รอยืนยัน' },
  { value: 'banned',         label: 'แบนแล้ว' },
]

const ROLE_LABELS: Record<string, string> = {
  weeeu: 'WeeeU',
  weeer: 'WeeeR',
  weeet: 'WeeeT',
}

export default function UsersPage() {
  const { filters, pagination, setFilters, setPage, resetMockData, filteredItems, createItem, updateItem, removeItem } = useAdminUsersStore()
  const items = filteredItems()

  const paged = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    return items.slice(start, start + pagination.pageSize)
  }, [items, pagination.page, pagination.pageSize])

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<DrawerMode>('closed')
  const [selected, setSelected] = useState<UserRecord | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const openCreate = () => { setSelected(null); setMode('create'); setOpen(true) }
  const openView = (row: UserRecord) => { setSelected(row); setMode('view'); setOpen(true) }

  const handleSubmit = async (data: unknown) => {
    if (mode === 'create') createItem(data as Omit<UserRecord, 'id' | 'registeredAt'>)
    else if (selected) setSelected(updateItem(selected.id, data as Partial<UserRecord>))
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <AdminListPage
          title="ผู้ใช้งานทั้งหมด"
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
          <div className="flex justify-end p-3 bg-white/40 border-b border-gray-200">
            <button
              onClick={openCreate}
              className="px-4 py-2 text-sm rounded bg-brand-success hover:bg-brand-success/90 text-white"
            >
              + เพิ่มผู้ใช้
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-left border-b border-gray-200">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">ชื่อ</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">เบอร์โทร</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">วันที่สมัคร</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-600">
                    ไม่พบรายการ
                  </td>
                </tr>
              ) : (
                paged.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => openView(row)}
                    className="hover:bg-gray-100/40 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{row.id}</td>
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{row.email}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{row.phone}</td>
                    <td className="px-4 py-3 text-xs">{ROLE_LABELS[row.role] ?? row.role}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(row.registeredAt).toLocaleDateString('th-TH')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </AdminListPage>

        <AdminDrawer<UserRecord>
          module="users"
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
