'use client'
// Sub-5a list + Sub-5c read-only drawer + filters — audit log
import { useEffect, useMemo, useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { AdminListPage } from '@/components/admin-list/AdminListPage'
import { AdminDrawer, type DrawerMode } from '@/components/admin-list/AdminDrawer'
import { useAdminAuditStore } from '@/lib/stores/audit.store'
import type { AuditRecord } from '@/lib/mocks/audit.seed'

const MODULE_LABELS: Record<string, string> = {
  services: 'บริการ',
  listings: 'ประกาศ',
  users: 'ผู้ใช้',
  points: 'คะแนน',
  content: 'เนื้อหา',
  contact: 'ติดต่อ',
}

function deriveModuleOptions(items: AuditRecord[]): { value: string; label: string }[] {
  const distinct = Array.from(new Set(items.map((e) => e.module))).sort()
  return distinct.map((m) => ({ value: m, label: MODULE_LABELS[m] ?? m }))
}

const ACTION_OPTIONS = [
  { value: 'create', label: 'สร้าง' },
  { value: 'update', label: 'แก้ไข' },
  { value: 'delete', label: 'ลบ' },
  { value: 'approve', label: 'อนุมัติ' },
  { value: 'reject', label: 'ปฏิเสธ' },
]

export default function AuditPage() {
  const { items: allItems, filters, pagination, setFilters, setPage, resetMockData, seedIfEmpty, filteredItems } =
    useAdminAuditStore()

  useEffect(() => {
    seedIfEmpty()
  }, [seedIfEmpty])

  const items = filteredItems()

  const paged = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    return items.slice(start, start + pagination.pageSize)
  }, [items, pagination.page, pagination.pageSize])

  const moduleOptions = useMemo(() => deriveModuleOptions(allItems), [allItems])

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<DrawerMode>('closed')
  const [selected, setSelected] = useState<AuditRecord | null>(null)

  const openView = (row: AuditRecord) => {
    setSelected(row)
    setMode('view')
    setOpen(true)
  }

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
          extraChips={[
            {
              field: 'action',
              label: 'การกระทำ',
              value: filters.action,
              options: ACTION_OPTIONS,
              onChange: (v) => setFilters({ action: v as AuditRecord['action'] | null }),
            },
            {
              field: 'module',
              label: 'โมดูล',
              value: filters.module,
              options: moduleOptions,
              onChange: (v) => setFilters({ module: v }),
            },
          ]}
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
                  <tr
                    key={row.id}
                    onClick={() => openView(row)}
                    className="hover:bg-gray-800/40 cursor-pointer"
                  >
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

        <AdminDrawer<AuditRecord>
          module="audit"
          readOnly
          open={open}
          mode={mode}
          item={selected}
          onOpenChange={setOpen}
          onModeChange={setMode}
        />
      </main>
    </div>
  )
}
