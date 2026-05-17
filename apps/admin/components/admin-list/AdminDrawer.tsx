'use client'
// Sub-5b D80 — shared drawer shell (mode-based: view/edit/create)
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { AdminFormFields, formFieldsRegistry } from './AdminFormFields'
import type { ModuleKey } from '@/lib/audit/log'

export type DrawerMode = 'view' | 'edit' | 'create' | 'closed'

export interface AdminDrawerProps<T extends { id: string }> {
  module: ModuleKey
  open: boolean
  mode: DrawerMode
  item: T | null
  onOpenChange: (open: boolean) => void
  onModeChange: (mode: DrawerMode) => void
  onSubmit: (data: unknown) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

const TITLES: Record<ModuleKey, string> = {
  services: 'งานบริการ',
  listings: 'ประกาศ',
  users: 'ผู้ใช้',
  points: 'ธุรกรรมแต้ม',
  content: 'เนื้อหา',
}

export function AdminDrawer<T extends { id: string }>({
  module,
  open,
  mode,
  item,
  onOpenChange,
  onModeChange,
  onSubmit,
  onDelete,
}: AdminDrawerProps<T>) {
  const config = formFieldsRegistry[module]
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(config.schema) })

  // Reset form whenever the target item or mode changes (no stale state on reopen)
  useEffect(() => {
    if (mode === 'create') {
      reset({})
    } else if (item) {
      reset(item as Record<string, unknown>)
    }
  }, [item, mode, reset])

  const headerLabel =
    mode === 'create'
      ? `เพิ่ม${TITLES[module]}`
      : mode === 'edit'
        ? `แก้ไข${TITLES[module]}`
        : `รายละเอียด${TITLES[module]}`

  const submit = handleSubmit(async (data) => {
    await onSubmit(data)
    if (mode === 'create') {
      onOpenChange(false)
    } else {
      onModeChange('view')
    }
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <div className="px-6 py-4 border-b border-gray-800">
          <SheetTitle className="text-lg font-semibold">{headerLabel}</SheetTitle>
          <SheetDescription className="text-xs text-gray-500">
            {item ? item.id : 'รายการใหม่'}
          </SheetDescription>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {mode === 'view' && item ? (
            <dl className="space-y-3">
              {config.fields.map((f) => (
                <div key={f.name} className="flex flex-col">
                  <dt className="text-xs text-gray-500">{f.label}</dt>
                  <dd className="text-sm text-white">
                    {String((item as Record<string, unknown>)[f.name] ?? '—')}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <form id="admin-drawer-form" onSubmit={submit}>
              <AdminFormFields module={module} register={register} errors={errors} />
            </form>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
          {mode === 'view' && (
            <>
              <button
                type="button"
                onClick={() => onModeChange('edit')}
                className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-500"
              >
                แก้ไข
              </button>
              {onDelete && item && (
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-500"
                >
                  ลบ
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm rounded border border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                ปิด
              </button>
            </>
          )}
          {(mode === 'edit' || mode === 'create') && (
            <>
              <button
                type="button"
                onClick={() => (mode === 'create' ? onOpenChange(false) : onModeChange('view'))}
                className="px-4 py-2 text-sm rounded border border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                form="admin-drawer-form"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-500 disabled:opacity-50"
              >
                {mode === 'create' ? 'สร้าง' : 'บันทึก'}
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
