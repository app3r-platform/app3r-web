'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

interface ContentEditorProps {
  initialContent?: Record<string, unknown>
  onChange?: (doc: Record<string, unknown>) => void
  readOnly?: boolean
}

const menuButtons = [
  { label: 'B', title: 'Bold', action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleBold().run(), isActive: (e: ReturnType<typeof useEditor>) => e?.isActive('bold') },
  { label: 'I', title: 'Italic', action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleItalic().run(), isActive: (e: ReturnType<typeof useEditor>) => e?.isActive('italic') },
  { label: 'H1', title: 'Heading 1', action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleHeading({ level: 1 }).run(), isActive: (e: ReturnType<typeof useEditor>) => e?.isActive('heading', { level: 1 }) },
  { label: 'H2', title: 'Heading 2', action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleHeading({ level: 2 }).run(), isActive: (e: ReturnType<typeof useEditor>) => e?.isActive('heading', { level: 2 }) },
  { label: 'UL', title: 'Bullet List', action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleBulletList().run(), isActive: (e: ReturnType<typeof useEditor>) => e?.isActive('bulletList') },
  { label: 'OL', title: 'Ordered List', action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleOrderedList().run(), isActive: (e: ReturnType<typeof useEditor>) => e?.isActive('orderedList') },
  { label: '—', title: 'Horizontal Rule', action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().setHorizontalRule().run(), isActive: () => false },
]

export default function ContentEditor({ initialContent, onChange, readOnly = false }: ContentEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent ?? { type: 'doc', content: [] },
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getJSON() as Record<string, unknown>)
    },
  })

  // sync external content changes (e.g. version restore)
  useEffect(() => {
    if (editor && initialContent) {
      const current = JSON.stringify(editor.getJSON())
      const next = JSON.stringify(initialContent)
      if (current !== next) {
        editor.commands.setContent(initialContent)
      }
    }
  }, [editor, initialContent])

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
                  ? 'bg-blue-600 text-white'
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
