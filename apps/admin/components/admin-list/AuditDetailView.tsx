'use client'
// Sub-5c D80 — read-only audit entry display (D9-B: field display, no before/after diff)
import type { AuditRecord } from '@/lib/mocks/audit.seed'

export interface AuditDetailViewProps {
  entry: AuditRecord | null
}

const ACTION_COLOR: Record<AuditRecord['action'], string> = {
  create: 'bg-green-600',
  update: 'bg-blue-600',
  delete: 'bg-red-600',
  approve: 'bg-brand-success',
  reject: 'bg-orange-600',
}

const ACTION_LABEL: Record<AuditRecord['action'], string> = {
  create: 'สร้าง',
  update: 'แก้ไข',
  delete: 'ลบ',
  approve: 'อนุมัติ',
  reject: 'ปฏิเสธ',
}

export function AuditDetailView({ entry }: AuditDetailViewProps) {
  if (!entry) {
    return <p className="text-sm text-gray-500">ไม่ได้เลือกรายการ</p>
  }

  return (
    <dl className="divide-y divide-gray-200">
      <div className="flex justify-between py-2">
        <dt className="text-xs text-gray-500">การกระทำ</dt>
        <dd>
          <span className={`text-xs px-2 py-0.5 rounded-full text-white ${ACTION_COLOR[entry.action]}`}>
            {ACTION_LABEL[entry.action]}
          </span>
        </dd>
      </div>
      <div className="flex justify-between py-2">
        <dt className="text-xs text-gray-500">โมดูล</dt>
        <dd className="text-sm text-white">{entry.module}</dd>
      </div>
      <div className="flex justify-between py-2">
        <dt className="text-xs text-gray-500">ผู้กระทำ</dt>
        <dd className="text-sm text-white">{entry.actor}</dd>
      </div>
      <div className="flex justify-between py-2">
        <dt className="text-xs text-gray-500">Entity ID</dt>
        <dd className="text-sm text-gray-900 font-mono">{entry.entityId}</dd>
      </div>
      <div className="flex justify-between py-2">
        <dt className="text-xs text-gray-500">เวลา</dt>
        <dd className="text-sm text-white">
          {new Date(entry.timestamp).toLocaleString('th-TH')}
        </dd>
      </div>
      <div className="flex justify-between py-2">
        <dt className="text-xs text-gray-500">ID</dt>
        <dd className="text-sm text-gray-900 font-mono truncate max-w-[220px]" title={entry.id}>
          {entry.id}
        </dd>
      </div>
    </dl>
  )
}
