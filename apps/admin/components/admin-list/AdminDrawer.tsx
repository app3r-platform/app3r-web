'use client'
// Sub-5b/5c D80 — drawer dispatcher (Sub-5c OBS-E v2 + OBS-T05-1: no hooks in dispatcher)
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
import { AuditDetailView } from './AuditDetailView'
import type { ModuleKey } from '@/lib/audit/log'
import type { AuditRecord } from '@/lib/mocks/audit.seed'

export type DrawerMode = 'view' | 'edit' | 'create' | 'closed'

export interface AdminDrawerProps<T extends { id: string }> {
  module: ModuleKey
  open: boolean
  mode: DrawerMode
  item: T | null
  onOpenChange: (open: boolean) => void
  onModeChange: (mode: DrawerMode) => void
  onSubmit?: (data: unknown) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  readOnly?: boolean
}

const TITLES: Record<ModuleKey, string> = {
  services: 'งานบริการ',
  listings: 'ประกาศ',
  users: 'ผู้ใช้',
  points: 'ธุรกรรมแต้ม',
  content: 'เนื้อหา',
  audit: 'บันทึกการตรวจสอบ',
}

// ★ Pure dispatcher — NO useForm / NO useEffect here (OBS-E v2)
export function AdminDrawer<T extends { id: string }>({
  module,
  readOnly,
  ...rest
}: AdminDrawerProps<T>) {
  // discriminant guard (module === 'audit') → TS narrows module in fall-through (OBS-T05-1)
  if (module === 'audit') {
    return <AuditDetailDrawer {...rest} />
  }
  return <FormDrawer module={module} {...rest} />
}

// AuditDetailDrawer — no useForm/useEffect; read-only Close-only footer
function AuditDetailDrawer<T extends { id: string }>({
  item,
  open,
  onOpenChange,
}: Omit<AdminDrawerProps<T>, 'module' | 'readOnly'>) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <div className="px-6 py-4 border-b border-gray-200">
          <SheetTitle className="text-lg font-semibold">
            รายละเอียด{TITLES.audit}
          </SheetTitle>
          <SheetDescription className="text-xs text-gray-500">
            {item ? item.id : '—'}
          </SheetDescription>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <AuditDetailView entry={item as AuditRecord | null} />
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            ปิด
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// FormDrawer props — narrow module only, keep generic <T> (OBS-T05-1)
type FormDrawerProps<T extends { id: string }> = Omit<
  AdminDrawerProps<T>,
  'module' | 'readOnly'
> & { module: Exclude<ModuleKey, 'audit'> }

// FormDrawer — ★ all hooks (useForm + useEffect) live here, unconditional
function FormDrawer<T extends { id: string }>({
  module,
  open,
  mode,
  item,
  onOpenChange,
  onModeChange,
  onSubmit,
  onDelete,
}: FormDrawerProps<T>) {
  const config = formFieldsRegistry[module]
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(config.schema!) })

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
    if (onSubmit) await onSubmit(data)
    if (mode === 'create') {
      onOpenChange(false)
    } else {
      onModeChange('view')
    }
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <div className="px-6 py-4 border-b border-gray-200">
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

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          {mode === 'view' && (
            <>
              <button
                type="button"
                onClick={() => onModeChange('edit')}
                className="px-4 py-2 text-sm rounded bg-admin-surface text-admin-primary hover:bg-blue-500"
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
                className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
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
                className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                form="admin-drawer-form"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm rounded bg-brand-success hover:bg-brand-success/90 text-white disabled:opacity-50"
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
