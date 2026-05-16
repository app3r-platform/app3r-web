'use client'

import { generateHTML } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { ContentPageDetailDto } from '@/lib/types/content'

interface ContentPreviewProps {
  page: ContentPageDetailDto
}

export default function ContentPreview({ page }: ContentPreviewProps) {
  let html = ''
  try {
    html = generateHTML(page.body as Parameters<typeof generateHTML>[0], [StarterKit])
  } catch {
    html = '<p class="text-red-500">เนื้อหาไม่ถูกต้อง (preview error)</p>'
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* preview header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
        <span className="text-sm font-medium text-gray-700">Preview</span>
        <div className="flex gap-2 text-xs text-gray-500">
          <span>slug: <code className="bg-gray-100 px-1 rounded">{page.slug}</code></span>
          <span>type: <code className="bg-gray-100 px-1 rounded">{page.type}</code></span>
          <span className={`px-2 py-0.5 rounded-full font-medium ${
            page.status === 'published'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {page.status === 'published' ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
          </span>
        </div>
      </div>

      {/* rendered content */}
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">{page.title}</h1>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {/* images gallery (if any) */}
      {page.images.length > 0 && (
        <div className="px-6 pb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">รูปภาพที่แนบ ({page.images.length})</p>
          <div className="grid grid-cols-3 gap-2">
            {page.images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.id}
                src={img.url}
                alt={img.alt ?? img.r2Key}
                className="w-full h-24 object-cover rounded border"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
