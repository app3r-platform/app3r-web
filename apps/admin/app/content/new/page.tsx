'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createContentPage } from '@/lib/api/content'
import type { ContentType } from '@/lib/types/content'

const ContentEditor = dynamic(() => import('@/components/cms/ContentEditor'), { ssr: false })

const TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: 'hero', label: 'Hero Banner' },
  { value: 'about', label: 'เกี่ยวกับเรา' },
  { value: 'faq', label: 'คำถามที่พบบ่อย' },
  { value: 'static', label: 'หน้าคงที่' },
]

function getToken(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('app3r_admin_token') ?? ''  // Bug B fix: align with lib/auth.ts TOKEN_KEY
}

export default function NewContentPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [slug, setSlug] = useState('')
  const [type, setType] = useState<ContentType>('static')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState<Record<string, unknown>>({ type: 'doc', content: [] })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slug.trim() || !title.trim()) {
      setError('กรอก Slug และชื่อเนื้อหาให้ครบก่อน')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const created = await createContentPage(getToken(), { slug: slug.trim(), type, title: title.trim(), body })
      router.push(`/content/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ')
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← ย้อนกลับ
        </button>
        <h1 className="text-2xl font-bold text-gray-900">สร้างเนื้อหาใหม่</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="เช่น home-hero"
              className="w-full border rounded px-3 py-2 text-sm font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ประเภท <span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ContentType)}
              className="w-full border rounded px-3 py-2 text-sm bg-white"
              required
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ชื่อเนื้อหา <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ชื่อหน้าเนื้อหา"
            className="w-full border rounded px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">เนื้อหา</label>
          <ContentEditor onChange={setBody} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกฉบับร่าง'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border px-6 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  )
}
