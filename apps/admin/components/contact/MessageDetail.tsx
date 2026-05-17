'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getContactMessage,
  updateContactStatus,
  deleteContactMessage,
} from '@/lib/api/contact'
import type { ContactMessageDto, ContactStatus } from '@/lib/types/contact'
import { CATEGORY_LABELS, STATUS_LABELS } from '@/components/contact/ContactInbox'

function getToken(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('app3r_admin_token') ?? ''
}

const NEXT_STATUSES: ContactStatus[] = ['read', 'replied', 'closed']

export default function MessageDetail({ id }: { id: string }) {
  const router = useRouter()
  const [message, setMessage] = useState<ContactMessageDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const m = await getContactMessage(getToken(), id)
      setMessage(m)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const changeStatus = async (status: ContactStatus) => {
    setBusy(true)
    setError(null)
    try {
      const updated = await updateContactStatus(getToken(), id, { status })
      // defensive: only setMessage if a valid object returned
      if (updated && typeof updated === 'object') setMessage(updated)
      setSuccess(`เปลี่ยนสถานะเป็น "${STATUS_LABELS[status]}" แล้ว`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เปลี่ยนสถานะไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('ยืนยันลบข้อความนี้? (soft delete — ซ่อนจาก Inbox)')) return
    setBusy(true)
    setError(null)
    try {
      await deleteContactMessage(getToken(), id)
      router.push('/contact')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ลบไม่สำเร็จ')
      setBusy(false)
    }
  }

  if (loading) return <div className="p-6 text-gray-500">กำลังโหลด...</div>
  if (!message)
    return <div className="p-6 text-red-600">{error ?? 'ไม่พบข้อความ'}</div>

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/contact')}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← กลับ Inbox
        </button>
        <h1 className="text-xl font-bold text-gray-900">รายละเอียดข้อความ</h1>
        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          {STATUS_LABELS[message.status]}
        </span>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded">
          {error}
        </div>
      )}

      <div className="rounded-lg border divide-y">
        <Row label="หมวด" value={CATEGORY_LABELS[message.category]} />
        <Row label="ชื่อผู้ติดต่อ" value={message.name} />
        <Row label="อีเมล" value={message.email} />
        <Row label="โทรศัพท์" value={message.phone ?? '—'} />
        <Row label="หัวข้อ" value={message.subject} />
        <div className="px-4 py-3">
          <p className="text-xs text-gray-500 mb-1">เนื้อหา</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.body}</p>
        </div>
        <Row
          label="ส่งเมื่อ"
          value={new Date(message.createdAt).toLocaleString('th-TH')}
        />
        {message.repliedAt && (
          <Row
            label="ตอบเมื่อ"
            value={new Date(message.repliedAt).toLocaleString('th-TH')}
          />
        )}
      </div>

      {/* status change */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-600">เปลี่ยนสถานะ:</span>
        {NEXT_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy || message.status === s}
            onClick={() => changeStatus(s)}
            className="border px-3 py-1.5 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="pt-4 border-t">
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="text-sm text-red-500 hover:text-red-700 disabled:opacity-40"
        >
          ลบข้อความนี้
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 flex gap-4">
      <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 break-words">{value}</span>
    </div>
  )
}
