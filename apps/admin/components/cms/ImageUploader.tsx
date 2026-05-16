'use client'

import { useCallback, useRef, useState } from 'react'
import { uploadContentImage } from '@/lib/api/content'
import type { ContentImageDto } from '@/lib/types/content'

interface ImageUploaderProps {
  contentPageId: string
  token: string
  onUploaded?: (image: ContentImageDto) => void
}

export default function ImageUploader({ contentPageId, token, onUploaded }: ImageUploaderProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      const file = files[0]

      if (!file.type.startsWith('image/')) {
        setError('รองรับเฉพาะไฟล์รูปภาพ (jpg, png, webp, gif)')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('ขนาดไฟล์ต้องไม่เกิน 5 MB')
        return
      }

      setError(null)
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('alt', file.name.replace(/\.[^.]+$/, ''))

        const result = await uploadContentImage(token, contentPageId, fd)
        onUploaded?.({
          id: result.id,
          contentPageId,
          url: result.url,
          r2Key: result.r2Key,
          alt: null,
          caption: null,
          order: 0,
          createdAt: new Date().toISOString(),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'อัปโหลดล้มเหลว')
      } finally {
        setUploading(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [contentPageId, token, onUploaded],
  )

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label="อัปโหลดรูปภาพ — ลากไฟล์วางที่นี่"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {uploading ? (
          <p className="text-sm text-gray-500">กำลังอัปโหลด...</p>
        ) : (
          <>
            <p className="text-sm text-gray-600 font-medium">ลากรูปภาพวางที่นี่</p>
            <p className="text-xs text-gray-400 mt-1">หรือคลิกเพื่อเลือกไฟล์ • สูงสุด 5 MB</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
