'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getTestimonial,
  createTestimonial,
  updateTestimonial,
} from '@/lib/api/testimonials'
import type {
  TestimonialStatus,
  CreateTestimonialInput,
} from '@/lib/types/testimonials'

function getToken(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('app3r_admin_token') ?? ''
}

const TEXT_MAX = 2000 // Schema Plan Sec 4 Zod: text max 2000

const EMPTY: CreateTestimonialInput = {
  name: '',
  role: '',
  starsRating: 5,
  text: '',
  avatar: '',
  sortOrder: 0,
  status: 'draft',
}

export default function TestimonialForm({ id }: { id?: string }) {
  const router = useRouter()
  const isEdit = !!id
  const [form, setForm] = useState<CreateTestimonialInput>(EMPTY)
  const [loading, setLoading] = useState<boolean>(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const t = await getTestimonial(getToken(), id)
      setForm({
        name: t.name,
        role: t.role,
        starsRating: t.starsRating,
        text: t.text,
        avatar: t.avatar,
        sortOrder: t.sortOrder,
        status: t.status,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const validate = (): string | null => {
    if (!form.name.trim()) return 'กรอกชื่อผู้รีวิว'
    if (!form.role.trim()) return 'กรอกบทบาท/ที่มา'
    if (!form.text.trim()) return 'กรอกข้อความรีวิว'
    if (form.text.length > TEXT_MAX)
      return `ข้อความยาวเกิน ${TEXT_MAX} ตัวอักษร`
    if (!form.avatar.trim()) return 'กรอก avatar (emoji หรือ URL)'
    if (form.starsRating < 1 || form.starsRating > 5)
      return 'คะแนนดาวต้องอยู่ระหว่าง 1–5'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (isEdit && id) {
        await updateTestimonial(getToken(), id, form)
        setSuccess('บันทึกเรียบร้อย')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const created = await createTestimonial(getToken(), form)
        router.push(`/testimonials/${created.id}`)
        return
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-gray-500">กำลังโหลด...</div>

  return (
    <div className="p-6 max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/testimonials')}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← กลับ
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          {isEdit ? 'แก้ไขรีวิว' : 'เพิ่มรีวิวใหม่'}
        </h1>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="ชื่อผู้รีวิว *">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </Field>
          <Field label="บทบาท / ที่มา *">
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="เช่น ลูกค้า WeeeU — กรุงเทพฯ"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <Field label={`ข้อความรีวิว * (${form.text.length}/${TEXT_MAX})`}>
          <textarea
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            rows={4}
            maxLength={TEXT_MAX}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Avatar (emoji/URL) *">
            <input
              type="text"
              value={form.avatar}
              onChange={(e) => setForm({ ...form, avatar: e.target.value })}
              placeholder="👩‍🦱 หรือ https://..."
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </Field>
          <Field label="คะแนนดาว (1–5) *">
            <select
              value={form.starsRating}
              onChange={(e) =>
                setForm({ ...form, starsRating: Number(e.target.value) })
              }
              className="w-full border rounded px-3 py-2 text-sm bg-white"
              aria-label="คะแนนดาว"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {'★'.repeat(n)} ({n})
                </option>
              ))}
            </select>
          </Field>
          <Field label="ลำดับแสดงผล">
            <input
              type="number"
              value={form.sortOrder ?? 0}
              onChange={(e) =>
                setForm({ ...form, sortOrder: Number(e.target.value) })
              }
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <Field label="สถานะ">
          <select
            value={form.status ?? 'draft'}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as TestimonialStatus,
              })
            }
            className="w-full border rounded px-3 py-2 text-sm bg-white max-w-xs"
            aria-label="สถานะ"
          >
            <option value="draft">ฉบับร่าง</option>
            <option value="published">เผยแพร่แล้ว</option>
          </select>
        </Field>

        <div className="flex gap-3 pt-2 border-t">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? 'กำลังบันทึก...' : isEdit ? 'บันทึก' : 'สร้างรีวิว'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/testimonials')}
            className="border px-6 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}
