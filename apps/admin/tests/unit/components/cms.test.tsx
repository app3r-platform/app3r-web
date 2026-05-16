/**
 * tests/unit/components/cms.test.tsx
 * ทดสอบ CMS components: ContentEditor / ContentPreview / ImageUploader
 * App3R-Admin — Phase D-4 Sub-3
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// ---- Mock TipTap (ไม่รองรับ jsdom) ----
const mockGetJSON = jest.fn().mockReturnValue({ type: 'doc', content: [] })
const mockSetContent = jest.fn()
const mockIsActive = jest.fn().mockReturnValue(false)
const mockChain = jest.fn().mockReturnValue({
  focus: jest.fn().mockReturnThis(),
  toggleBold: jest.fn().mockReturnThis(),
  toggleItalic: jest.fn().mockReturnThis(),
  toggleHeading: jest.fn().mockReturnThis(),
  toggleBulletList: jest.fn().mockReturnThis(),
  toggleOrderedList: jest.fn().mockReturnThis(),
  setHorizontalRule: jest.fn().mockReturnThis(),
  run: jest.fn(),
})

const mockEditor = {
  getJSON: mockGetJSON,
  commands: { setContent: mockSetContent },
  isActive: mockIsActive,
  chain: mockChain,
}

jest.mock('@tiptap/react', () => ({
  useEditor: jest.fn((config: { onUpdate?: (args: { editor: typeof mockEditor }) => void }) => {
    // Simulate onUpdate trigger for onChange tests
    if (config.onUpdate) {
      setTimeout(() => config.onUpdate?.({ editor: mockEditor }), 0)
    }
    return mockEditor
  }),
  EditorContent: ({ className }: { className?: string }) => (
    <div data-testid="editor-content" className={className}>Editor Area</div>
  ),
  generateHTML: jest.fn(() => '<p>Preview HTML</p>'),
}))

jest.mock('@tiptap/starter-kit', () => ({}))

// Mock upload API
jest.mock('@/lib/api/content', () => ({
  uploadContentImage: jest.fn(),
}))

import ContentEditor from '@/components/cms/ContentEditor'
import ContentPreview from '@/components/cms/ContentPreview'
import ImageUploader from '@/components/cms/ImageUploader'
import { uploadContentImage } from '@/lib/api/content'
import type { ContentPageDetailDto } from '@/lib/types/content'

const mockUpload = uploadContentImage as jest.MockedFunction<typeof uploadContentImage>

// ========== ContentEditor ==========
describe('ContentEditor', () => {
  beforeEach(() => {
    mockGetJSON.mockReturnValue({ type: 'doc', content: [] })
    mockIsActive.mockReturnValue(false)
  })

  it('renders editor content area', () => {
    render(<ContentEditor />)
    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
  })

  it('shows toolbar buttons when not readOnly', () => {
    render(<ContentEditor readOnly={false} />)
    expect(screen.getByTitle('Bold')).toBeInTheDocument()
    expect(screen.getByTitle('Italic')).toBeInTheDocument()
    expect(screen.getByTitle('Heading 1')).toBeInTheDocument()
    expect(screen.getByTitle('Heading 2')).toBeInTheDocument()
    expect(screen.getByTitle('Bullet List')).toBeInTheDocument()
    expect(screen.getByTitle('Ordered List')).toBeInTheDocument()
    expect(screen.getByTitle('Horizontal Rule')).toBeInTheDocument()
  })

  it('hides toolbar when readOnly=true', () => {
    render(<ContentEditor readOnly={true} />)
    expect(screen.queryByTitle('Bold')).not.toBeInTheDocument()
  })

  it('calls chain().toggleBold().run() on Bold button click', () => {
    render(<ContentEditor />)
    fireEvent.click(screen.getByTitle('Bold'))
    expect(mockChain).toHaveBeenCalled()
  })

  it('calls chain().toggleHeading() on H1 click', () => {
    render(<ContentEditor />)
    fireEvent.click(screen.getByTitle('Heading 1'))
    expect(mockChain).toHaveBeenCalled()
  })

  it('highlights active button when isActive returns true', () => {
    mockIsActive.mockReturnValue(true)
    render(<ContentEditor />)
    const boldBtn = screen.getByTitle('Bold')
    expect(boldBtn.className).toContain('bg-blue-600')
  })

  it('calls onChange when editor content updates', async () => {
    const handleChange = jest.fn()
    render(<ContentEditor onChange={handleChange} />)
    // onUpdate fires via setTimeout in mock
    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith({ type: 'doc', content: [] })
    })
  })
})

// ========== ContentPreview ==========
const basePage: ContentPageDetailDto = {
  id: 'page-1',
  slug: 'home-hero',
  type: 'hero',
  title: 'Hero Banner',
  body: { type: 'doc', content: [] },
  status: 'draft',
  version: 1,
  authorId: null,
  publishedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  images: [],
}

describe('ContentPreview', () => {
  it('renders page title', () => {
    render(<ContentPreview page={basePage} />)
    expect(screen.getByText('Hero Banner')).toBeInTheDocument()
  })

  it('shows slug and type in header', () => {
    render(<ContentPreview page={basePage} />)
    expect(screen.getByText('home-hero')).toBeInTheDocument()
    expect(screen.getByText('hero')).toBeInTheDocument()
  })

  it('shows ฉบับร่าง badge when status=draft', () => {
    render(<ContentPreview page={basePage} />)
    expect(screen.getByText('ฉบับร่าง')).toBeInTheDocument()
  })

  it('shows เผยแพร่แล้ว badge when status=published', () => {
    render(<ContentPreview page={{ ...basePage, status: 'published' }} />)
    expect(screen.getByText('เผยแพร่แล้ว')).toBeInTheDocument()
  })

  it('renders HTML from generateHTML', () => {
    render(<ContentPreview page={basePage} />)
    // generateHTML mock returns '<p>Preview HTML</p>'
    expect(screen.getByText('Preview HTML')).toBeInTheDocument()
  })

  it('shows images section when page has images', () => {
    const pageWithImages: ContentPageDetailDto = {
      ...basePage,
      images: [
        { id: 'img-1', contentPageId: 'page-1', url: 'https://example.com/img.jpg', r2Key: 'img.jpg', alt: 'Test', caption: null, order: 0, createdAt: '2026-01-01T00:00:00Z' },
      ],
    }
    render(<ContentPreview page={pageWithImages} />)
    expect(screen.getByText('รูปภาพที่แนบ (1)')).toBeInTheDocument()
  })

  it('hides images section when page has no images', () => {
    render(<ContentPreview page={basePage} />)
    expect(screen.queryByText(/รูปภาพที่แนบ/)).not.toBeInTheDocument()
  })
})

// ========== ImageUploader ==========
describe('ImageUploader', () => {
  const defaultProps = {
    contentPageId: 'page-1',
    token: 'test-token',
    onUploaded: jest.fn(),
  }

  beforeEach(() => {
    mockUpload.mockReset()
    defaultProps.onUploaded = jest.fn()
  })

  it('renders upload area with instruction text', () => {
    render(<ImageUploader {...defaultProps} />)
    expect(screen.getByText('ลากรูปภาพวางที่นี่')).toBeInTheDocument()
    expect(screen.getByText(/สูงสุด 5 MB/)).toBeInTheDocument()
  })

  it('has accessible role="button" on drop zone', () => {
    render(<ImageUploader {...defaultProps} />)
    expect(screen.getByRole('button', { name: /อัปโหลดรูปภาพ/ })).toBeInTheDocument()
  })

  it('shows error for non-image file type', async () => {
    render(<ImageUploader {...defaultProps} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['text'], 'doc.txt', { type: 'text/plain' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    fireEvent.change(input)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('รองรับเฉพาะไฟล์รูปภาพ')
    })
  })

  it('shows error for file over 5MB', async () => {
    render(<ImageUploader {...defaultProps} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const bigFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [bigFile], configurable: true })
    fireEvent.change(input)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('5 MB')
    })
  })

  it('calls uploadContentImage and onUploaded on valid image', async () => {
    mockUpload.mockResolvedValue({ id: 'img-new', url: 'https://r2.com/img.jpg', r2Key: 'img.jpg' })
    render(<ImageUploader {...defaultProps} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    fireEvent.change(input)
    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith('test-token', 'page-1', expect.any(FormData))
      expect(defaultProps.onUploaded).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'img-new', url: 'https://r2.com/img.jpg' }),
      )
    })
  })

  it('shows error when upload API fails', async () => {
    mockUpload.mockRejectedValue(new Error('Server error'))
    render(<ImageUploader {...defaultProps} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    fireEvent.change(input)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Server error')
    })
  })

  it('shows dragging highlight on dragOver', () => {
    render(<ImageUploader {...defaultProps} />)
    const dropZone = screen.getByRole('button', { name: /อัปโหลดรูปภาพ/ })
    fireEvent.dragOver(dropZone)
    expect(dropZone.className).toContain('border-blue-500')
  })

  it('removes dragging highlight on dragLeave', () => {
    render(<ImageUploader {...defaultProps} />)
    const dropZone = screen.getByRole('button', { name: /อัปโหลดรูปภาพ/ })
    fireEvent.dragOver(dropZone)
    fireEvent.dragLeave(dropZone)
    expect(dropZone.className).not.toContain('border-blue-500')
  })
})
