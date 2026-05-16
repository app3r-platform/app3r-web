'use client'

import { use, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  getContentPage,
  updateContentPage,
  publishContentPage,
  deleteContentPage,
  getContentVersions,
  createPreviewToken,
} from '@/lib/api/content'
import type { ContentPageDetailDto, ContentVersionDto } from '@/lib/types/content'

const ContentEditor = dynamic(() => import('@/components/cms/ContentEditor'), { ssr: false })
const ContentPreview = dynamic(() => import('@/components/cms/ContentPreview'), { ssr: false })
const ImageUploader = dynamic(() => import('@/components/cms/ImageUploader'), { ssr: false })

function getToken(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('app3r_admin_token') ?? ''  // Bug B fix: align with lib/auth.ts TOKEN_KEY
}

interface EditContentPageProps {
  params: Promise<{ id: string }>
}

export default function EditContentPage({ params }: EditContentPageProps) {
  const { id } = use(params)
  const router = useRouter()

  const [page, setPage] = useState<ContentPageDetailDto | null>(null)
  const [versions, setVersions] = useState<ContentVersionDto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState<Record<string, unknown>>({ type: 'doc', content: [] })
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'images' | 'versions'>('editor')

  const loadPage = useCallback(async () => {
    const token = getToken()
    try {
      const [p, v] = await Promise.all([
        getContentPage(token, id),
        getContentVersions(token, id),
      ])
      setPage(p)
      setTitle(p.title)
      setBody(p.body)
      setVersions(v)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadPage() }, [loadPage])

  const handleSave = async () => {
    if (!page) return
    setSaving(true)
    setError(null)
    try {
      const updated = await updateContentPage(getToken(), id, { title: title.trim(), body })
      setPage(updated)
      setSuccess('บันทึกเรียบร้อย')
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!page || !window.confirm('ยืนยันเผยแพร่เนื้อหานี้?')) return
    setPublishing(true)
    setError(null)
    try {
      const updated = await publishContentPage(getToken(), id)
      setPage(updated)
      setSuccess('เผยแพร่เรียบร้อย')
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เผยแพร่ไม่สำเร็จ')
    } finally {
      setPublishing(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('ยืนยันลบเนื้อหานี้? ไม่สามารถกู้คืนได้')) return
    try {
      await deleteContentPage(getToken(), id)
      router.push('/content')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ลบไม่สำเร็จ')
    }
  }

  const handleCopyPreviewLink = async () => {
    try {
      const { token, expiresAt } = await createPreviewToken(getToken(), id)
      const url = `${process.env.NEXT_PUBLIC_WEBSITE_URL ?? 'http://localhost:3001'}/preview?token=${token}`
      await navigator.clipboard.writeText(url)
      setSuccess(`คัดลอกลิงก์ preview แล้ว (หมดอายุ: ${new Date(expiresAt).toLocaleString('th-TH')})`)
      setTimeout(() => setSuccess(null), 5000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'สร้าง preview link ไม่สำเร็จ')
    }
  }

  const restoreVersion = (v: ContentVersionDto) => {
    if (!window.confirm(`กู้คืนเวอร์ชัน v${v.version}?`)) return
    setBody(v.body)
    setActiveTab('editor')
  }

  if (loading) return <div className="p-6 text-gray-500">กำลังโหลด...</div>
  if (!page) return <div className="p-6 text-red-600">{error ?? 'ไม่พบเนื้อหา'}</div>

  const previewPage = { ...page, title, body }

  return (
    <div className="p-6 max-w-5xl space-y-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/content')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← กลับ
          </button>
          <h1 className="text-xl font-bold text-gray-900">แก้ไขเนื้อหา</h1>
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
            page.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {page.status === 'published' ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'} v{page.version}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopyPreviewLink}
            className="border px-3 py-1.5 rounded text-sm text-gray-700 hover:bg-gray-50"
          >
            🔗 Preview Link
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`border px-3 py-1.5 rounded text-sm ${showPreview ? 'bg-blue-50 border-blue-300 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            {showPreview ? 'ซ่อน Preview' : 'แสดง Preview'}
          </button>
          {page.status !== 'published' && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {publishing ? 'กำลังเผยแพร่...' : 'เผยแพร่'}
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded">{success}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded">{error}</div>}

      {/* title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเนื้อหา</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      {/* tabs */}
      <div className="border-b flex gap-4">
        {(['editor', 'images', 'versions'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`pb-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {{ editor: 'แก้ไขเนื้อหา', images: `รูปภาพ (${page.images.length})`, versions: `ประวัติเวอร์ชัน (${versions.length})` }[tab]}
          </button>
        ))}
      </div>

      {/* main area — split if preview open */}
      <div className={showPreview && activeTab === 'editor' ? 'grid grid-cols-2 gap-4' : ''}>
        {/* tab content */}
        <div>
          {activeTab === 'editor' && (
            <ContentEditor initialContent={body} onChange={setBody} />
          )}

          {activeTab === 'images' && (
            <div className="space-y-4">
              <ImageUploader
                contentPageId={id}
                token={getToken()}
                onUploaded={(img) => setPage((prev) => prev ? { ...prev, images: [...prev.images, img] } : prev)}
              />
              {page.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {page.images.map((img) => (
                    <div key={img.id} className="border rounded overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.alt ?? ''} className="w-full h-24 object-cover" />
                      <p className="text-xs text-gray-500 p-1 truncate">{img.alt ?? img.r2Key}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-2">
              {versions.length === 0 && <p className="text-gray-500 text-sm">ยังไม่มีประวัติเวอร์ชัน</p>}
              {versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between border rounded px-4 py-3">
                  <div>
                    <span className="font-medium text-sm">v{v.version}</span>
                    <span className="text-gray-400 text-xs ml-2">
                      {new Date(v.createdAt).toLocaleString('th-TH')}
                    </span>
                    {v.publishedAt && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 rounded">เผยแพร่แล้ว</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => restoreVersion(v)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    กู้คืน
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* preview pane */}
        {showPreview && activeTab === 'editor' && (
          <ContentPreview page={previewPage} />
        )}
      </div>

      {/* danger zone */}
      <div className="pt-4 border-t">
        <button
          type="button"
          onClick={handleDelete}
          className="text-sm text-red-500 hover:text-red-700"
        >
          ลบเนื้อหานี้
        </button>
      </div>
    </div>
  )
}
