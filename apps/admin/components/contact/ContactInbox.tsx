'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listContactMessages } from '@/lib/api/contact'
import type {
  ContactMessageDto,
  ContactCategory,
  ContactStatus,
} from '@/lib/types/contact'

export const CATEGORY_LABELS: Record<ContactCategory, string> = {
  general: 'สอบถามทั่วไป',
  sales: 'สนใจบริการ',
  support: 'รายงานปัญหา',
  partnership: 'พันธมิตร',
  press: 'สื่อ/PR',
  feedback: 'ข้อเสนอแนะ',
  careers: 'ร่วมงาน',
  other: 'อื่นๆ',
}

export const STATUS_LABELS: Record<ContactStatus, string> = {
  new: 'ใหม่',
  read: 'อ่านแล้ว',
  replied: 'ตอบแล้ว',
  closed: 'ปิดแล้ว',
}

const STATUS_BADGE: Record<ContactStatus, string> = {
  new: 'bg-red-100 text-red-700',
  read: 'bg-yellow-100 text-yellow-700',
  replied: 'bg-blue-100 text-blue-700',
  closed: 'bg-green-100 text-green-700',
}

function getToken(): string {
  if (typeof window === 'undefined') return ''
  // Bug B alignment with lib/auth.ts TOKEN_KEY
  return localStorage.getItem('app3r_admin_token') ?? ''
}

export default function ContactInbox() {
  const [messages, setMessages] = useState<ContactMessageDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<ContactCategory | ''>('')
  const [filterStatus, setFilterStatus] = useState<ContactStatus | ''>('')

  useEffect(() => {
    const token = getToken()
    setLoading(true)
    setError(null)
    listContactMessages(token, {
      category: filterCategory || undefined,
      status: filterStatus || undefined,
    })
      // defensive: always coerce to array (Carry-over #2 — avoid undefined.length)
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch((e) => setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [filterCategory, filterStatus])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">กล่องข้อความติดต่อ (Inbox)</h1>
        <Link
          href="/contact/info"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          แก้ข้อมูลติดต่อ
        </Link>
      </div>

      {/* filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as ContactCategory | '')}
          className="border rounded px-3 py-1.5 text-sm text-gray-700 bg-white"
          aria-label="กรองตามหมวด"
        >
          <option value="">ทุกหมวด</option>
          {(Object.entries(CATEGORY_LABELS) as [ContactCategory, string][]).map(
            ([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ),
          )}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ContactStatus | '')}
          className="border rounded px-3 py-1.5 text-sm text-gray-700 bg-white"
          aria-label="กรองตามสถานะ"
        >
          <option value="">ทุกสถานะ</option>
          {(Object.entries(STATUS_LABELS) as [ContactStatus, string][]).map(
            ([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ),
          )}
        </select>
      </div>

      {loading && <p className="text-gray-500">กำลังโหลด...</p>}
      {error && <p className="text-red-600">เกิดข้อผิดพลาด: {error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600">สถานะ</th>
                <th className="px-4 py-3 text-left text-gray-600">หมวด</th>
                <th className="px-4 py-3 text-left text-gray-600">ชื่อผู้ติดต่อ</th>
                <th className="px-4 py-3 text-left text-gray-600">หัวข้อ</th>
                <th className="px-4 py-3 text-left text-gray-600">วันที่</th>
                <th className="px-4 py-3 text-left text-gray-600">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {messages.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    ไม่พบข้อความ
                  </td>
                </tr>
              )}
              {messages.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[m.status]}`}
                    >
                      {STATUS_LABELS[m.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {CATEGORY_LABELS[m.category]}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
                    {m.subject}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(m.createdAt).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/contact/${m.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      ดูรายละเอียด
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
