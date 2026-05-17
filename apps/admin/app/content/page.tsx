'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listContentPages } from '@/lib/api/content'
import type { ContentPageDto, ContentType, ContentStatus } from '@/lib/types/content'

const TYPE_LABELS: Record<ContentType, string> = {
  hero: 'Hero Banner',
  about: 'เกี่ยวกับเรา',
  faq: 'คำถามที่พบบ่อย',
  static: 'หน้าคงที่',
}

const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: 'ฉบับร่าง',
  published: 'เผยแพร่แล้ว',
}

function getToken(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('app3r_admin_token') ?? ''  // Bug B fix: align with lib/auth.ts TOKEN_KEY
}

export default function ContentDashboardPage() {
  const [pages, setPages] = useState<ContentPageDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<ContentType | ''>('')
  const [filterStatus, setFilterStatus] = useState<ContentStatus | ''>('')

  useEffect(() => {
    const token = getToken()
    setLoading(true)
    listContentPages(
      token,
      {
        type: filterType || undefined,
        status: filterStatus || undefined,
      },
    )
      .then(setPages)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [filterType, filterStatus])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">จัดการเนื้อหา (CMS)</h1>
        <Link
          href="/content/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + สร้างเนื้อหาใหม่
        </Link>
      </div>

      {/* filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ContentType | '')}
          className="border rounded px-3 py-1.5 text-sm text-gray-700 bg-white"
          aria-label="กรองตามประเภท"
        >
          <option value="">ทุกประเภท</option>
          {(Object.entries(TYPE_LABELS) as [ContentType, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ContentStatus | '')}
          className="border rounded px-3 py-1.5 text-sm text-gray-700 bg-white"
          aria-label="กรองตามสถานะ"
        >
          <option value="">ทุกสถานะ</option>
          {(Object.entries(STATUS_LABELS) as [ContentStatus, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* table */}
      {loading && <p className="text-gray-500">กำลังโหลด...</p>}
      {error && <p className="text-red-600">เกิดข้อผิดพลาด: {error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600">Slug</th>
                <th className="px-4 py-3 text-left text-gray-600">ชื่อ</th>
                <th className="px-4 py-3 text-left text-gray-600">ประเภท</th>
                <th className="px-4 py-3 text-left text-gray-600">สถานะ</th>
                <th className="px-4 py-3 text-left text-gray-600">เวอร์ชัน</th>
                <th className="px-4 py-3 text-left text-gray-600">อัปเดต</th>
                <th className="px-4 py-3 text-left text-gray-600">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pages.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    ไม่พบเนื้อหา
                  </td>
                </tr>
              )}
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{page.slug}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{page.title}</td>
                  <td className="px-4 py-3 text-gray-600">{TYPE_LABELS[page.type]}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      page.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {STATUS_LABELS[page.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">v{page.version}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(page.updatedAt).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/content/${page.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      แก้ไข
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
