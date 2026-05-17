'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  listTestimonials,
  togglePublishTestimonial,
  deleteTestimonial,
} from '@/lib/api/testimonials'
import type {
  TestimonialDto,
  TestimonialStatus,
} from '@/lib/types/testimonials'

export const STATUS_LABELS: Record<TestimonialStatus, string> = {
  draft: 'ฉบับร่าง',
  published: 'เผยแพร่แล้ว',
}

const STATUS_BADGE: Record<TestimonialStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  published: 'bg-green-100 text-green-700',
}

function getToken(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('app3r_admin_token') ?? ''
}

export default function TestimonialList() {
  const [items, setItems] = useState<TestimonialDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<TestimonialStatus | ''>('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listTestimonials(getToken())
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const visible = items
    .filter((t) => (filterStatus ? t.status === filterStatus : true))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const handleToggle = async (id: string) => {
    setBusyId(id)
    setError(null)
    try {
      const updated = await togglePublishTestimonial(getToken(), id)
      if (updated && typeof updated === 'object') {
        setItems((prev) =>
          prev.map((t) => (t.id === id ? updated : t)),
        )
      } else {
        await load()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เปลี่ยนสถานะไม่สำเร็จ')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('ยืนยันลบรีวิวนี้? (ลบถาวร)')) return
    setBusyId(id)
    setError(null)
    try {
      await deleteTestimonial(getToken(), id)
      setItems((prev) => prev.filter((t) => t.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ลบไม่สำเร็จ')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          รีวิวลูกค้า (Testimonials)
        </h1>
        <Link
          href="/testimonials/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + เพิ่มรีวิว
        </Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as TestimonialStatus | '')
          }
          className="border rounded px-3 py-1.5 text-sm text-gray-700 bg-white"
          aria-label="กรองตามสถานะ"
        >
          <option value="">ทุกสถานะ</option>
          {(Object.entries(STATUS_LABELS) as [TestimonialStatus, string][]).map(
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
                <th className="px-4 py-3 text-left text-gray-600">ลำดับ</th>
                <th className="px-4 py-3 text-left text-gray-600">ชื่อ</th>
                <th className="px-4 py-3 text-left text-gray-600">บทบาท</th>
                <th className="px-4 py-3 text-left text-gray-600">ดาว</th>
                <th className="px-4 py-3 text-left text-gray-600">สถานะ</th>
                <th className="px-4 py-3 text-left text-gray-600">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    ไม่พบรีวิว
                  </td>
                </tr>
              )}
              {visible.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{t.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span className="mr-2">{t.avatar}</span>
                    <span className="font-medium text-gray-900">{t.name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.role}</td>
                  <td className="px-4 py-3 text-amber-500">{t.stars}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[t.status]}`}
                    >
                      {STATUS_LABELS[t.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-3">
                    <Link
                      href={`/testimonials/${t.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      แก้ไข
                    </Link>
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => handleToggle(t.id)}
                      className="text-xs text-gray-700 hover:underline disabled:opacity-40"
                    >
                      {t.status === 'published' ? 'ถอนเผยแพร่' : 'เผยแพร่'}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => handleDelete(t.id)}
                      className="text-xs text-red-500 hover:underline disabled:opacity-40"
                    >
                      ลบ
                    </button>
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
