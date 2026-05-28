'use client'
// W-3-B Sub-B.2 — per-type form schema (legal / contact / social_links)
// TipTap editor preserved for: hero / about / faq / static / article / marketing / undefined

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useState } from 'react'
import type { ContentType } from '@/lib/types/content'

// ─── Structured form config ───────────────────────────────────────────────────

const STRUCTURED_TYPES = new Set<ContentType>(['legal', 'contact', 'social_links'])

interface StructuredField {
  key: string
  label: string
  inputType: 'text' | 'email' | 'date' | 'textarea'
  required: boolean
}

const STRUCTURED_FIELDS: Partial<Record<ContentType, StructuredField[]>> = {
  legal: [
    { key: 'content_markdown', label: 'เนื้อหา (Markdown)',    inputType: 'textarea', required: true  },
    { key: 'last_updated_date', label: 'วันที่อัปเดตล่าสุด', inputType: 'date',     required: true  },
  ],
  contact: [
    { key: 'phone',         label: 'เบอร์โทรศัพท์', inputType: 'text',  required: true  },
    { key: 'email',         label: 'อีเมล',          inputType: 'email', required: true  },
    { key: 'address',       label: 'ที่อยู่',         inputType: 'text',  required: false },
    { key: 'line_id',       label: 'Line ID',         inputType: 'text',  required: false },
    { key: 'opening_hours', label: 'เวลาทำการ',       inputType: 'text',  required: false },
  ],
  social_links: [
    { key: 'facebook',  label: 'Facebook URL',  inputType: 'text', required: false },
    { key: 'line',      label: 'Line ID / URL', inputType: 'text', required: false },
    { key: 'instagram', label: 'Instagram URL', inputType: 'text', required: false },
  ],
}

// ─── TipTap toolbar config ────────────────────────────────────────────────────

const menuButtons = [
  { label: 'B',  title: 'Bold',            action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleBold().run(),                   isActive: (e: ReturnType<typeof useEditor>) => e?.isActive('bold') },
  { label: 'I',  title: 'Italic',          action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleItalic().run(),                 isActive: (e: ReturnType<typeof useEditor>) => e?.isActive('italic') },
  { label: 'H1', title: 'Heading 1',       action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleHeading({ level: 1 }).run(),    isActive: (e: ReturnType<typeof useEditor>) => e?.isActive('heading', { level: 1 }) },
  { label: 'H2', title: 'Heading 2',       action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleHeading({ level: 2 }).run(),    isActive: (e: ReturnType<typeof useEditor>) => e?.isActive('heading', { level: 2 }) },
  { label: 'UL', title: 'Bullet List',     action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleBulletList().run(),             isActive: (e: ReturnType<typeof useEditor>) => e?.isActive('bulletList') },
  { label: 'OL', title: 'Ordered List',    action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleOrderedList().run(),            isActive: (e: ReturnType<typeof useEditor>) => e?.isActive('orderedList') },
  { label: '—',  title: 'Horizontal Rule', action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().setHorizontalRule().run(),            isActive: () => false },
]

// ─── Main component ───────────────────────────────────────────────────────────

interface ContentEditorProps {
  type?: ContentType
  initialContent?: Record<string, unknown>
  onChange?: (doc: Record<string, unknown>) => void
  readOnly?: boolean
}

export default function ContentEditor({ type, initialContent, onChange, readOnly = false }: ContentEditorProps) {
  const isStructured = !!type && STRUCTURED_TYPES.has(type)

  // Always call useEditor — hooks must run unconditionally (OBS-E v2 pattern)
  const editor = useEditor({
    extensions: [StarterKit],
    // For structured types, pass empty doc (structured data is not ProseMirror JSON)
    content: isStructured ? { type: 'doc', content: [] } : (initialContent ?? { type: 'doc', content: [] }),
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      if (!isStructured) {
        onChange?.(ed.getJSON() as Record<string, unknown>)
      }
    },
  })

  // Sync external content changes for TipTap path only (e.g. version restore)
  useEffect(() => {
    if (editor && initialContent && !isStructured) {
      const current = JSON.stringify(editor.getJSON())
      const next = JSON.stringify(initialContent)
      if (current !== next) {
        editor.commands.setContent(initialContent)
      }
    }
  }, [editor, initialContent, isStructured])

  // ── Structured form for legal / contact / social_links ──
  if (isStructured) {
    return (
      <StructuredEditor
        type={type}
        initialContent={initialContent}
        onChange={onChange}
        readOnly={readOnly}
      />
    )
  }

  // ── TipTap rich-text editor for hero / about / faq / static / article / marketing ──
  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {!readOnly && (
        <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
          {menuButtons.map((btn) => (
            <button
              key={btn.label}
              title={btn.title}
              type="button"
              onClick={() => btn.action(editor)}
              className={`px-2 py-1 text-sm rounded font-mono ${
                btn.isActive(editor)
                  ? 'bg-admin-surface text-admin-primary'
                  : 'bg-white border text-gray-700 hover:bg-gray-100'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[300px] focus:outline-none"
      />
    </div>
  )
}

// ─── Structured form sub-component ───────────────────────────────────────────

interface StructuredEditorProps {
  type: ContentType
  initialContent?: Record<string, unknown>
  onChange?: (doc: Record<string, unknown>) => void
  readOnly?: boolean
}

function StructuredEditor({ type, initialContent, onChange, readOnly }: StructuredEditorProps) {
  const fields = STRUCTURED_FIELDS[type] ?? []

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, String(initialContent?.[f.key] ?? '')]))
  )
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const handleChange = (key: string, value: string) => {
    const next = { ...values, [key]: value }
    setValues(next)
    onChange?.(next)
  }

  const handleBlur = (key: string) => {
    setTouched((t) => ({ ...t, [key]: true }))
  }

  return (
    <div className="border rounded-lg bg-white p-4 space-y-4">
      {fields.map((f) => {
        const hasError = f.required && touched[f.key] && !values[f.key]?.trim()
        return (
          <div key={f.key} className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              {f.label}
              {f.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {f.inputType === 'textarea' ? (
              <textarea
                value={values[f.key] ?? ''}
                onChange={(e) => handleChange(f.key, e.target.value)}
                onBlur={() => handleBlur(f.key)}
                readOnly={readOnly}
                rows={8}
                className={`border rounded px-3 py-2 text-sm font-mono resize-y focus:outline-none ${
                  hasError ? 'border-red-400' : 'border-gray-300 focus:border-blue-400'
                }`}
              />
            ) : (
              <input
                type={f.inputType === 'email' ? 'email' : f.inputType === 'date' ? 'date' : 'text'}
                value={values[f.key] ?? ''}
                onChange={(e) => handleChange(f.key, e.target.value)}
                onBlur={() => handleBlur(f.key)}
                readOnly={readOnly}
                className={`border rounded px-3 py-2 text-sm focus:outline-none ${
                  hasError ? 'border-red-400' : 'border-gray-300 focus:border-blue-400'
                }`}
              />
            )}
            {hasError && (
              <span className="text-xs text-red-500">กรุณากรอกข้อมูล</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
