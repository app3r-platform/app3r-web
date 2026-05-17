/**
 * tests/unit/components/testimonials.test.tsx
 * Sub-2 D-4 — TestimonialList + TestimonialForm
 * App3R-Admin — Phase D-4 Sub-2
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

jest.mock('@/lib/api/testimonials', () => ({
  listTestimonials: jest.fn(),
  getTestimonial: jest.fn(),
  createTestimonial: jest.fn(),
  updateTestimonial: jest.fn(),
  deleteTestimonial: jest.fn(),
  togglePublishTestimonial: jest.fn(),
  getPublicTestimonials: jest.fn(),
}))

import TestimonialList from '@/components/testimonials/TestimonialList'
import TestimonialForm from '@/components/testimonials/TestimonialForm'
import {
  listTestimonials,
  getTestimonial,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  togglePublishTestimonial,
} from '@/lib/api/testimonials'
import type { TestimonialDto } from '@/lib/types/testimonials'

const mList = listTestimonials as jest.Mock
const mGet = getTestimonial as jest.Mock
const mCreate = createTestimonial as jest.Mock
const mUpdate = updateTestimonial as jest.Mock
const mDelete = deleteTestimonial as jest.Mock
const mToggle = togglePublishTestimonial as jest.Mock

const t1: TestimonialDto = {
  id: 't1',
  name: 'คุณสมหญิง ว.',
  role: 'ลูกค้า WeeeU — กรุงเทพฯ',
  stars: '★★★★★',
  starsRating: 5,
  text: 'ใช้งานง่ายมาก',
  avatar: '👩‍🦱',
  sortOrder: 1,
  status: 'published',
  publishedAt: '2026-05-17T00:00:00Z',
  createdAt: '2026-05-17T00:00:00Z',
  updatedAt: '2026-05-17T00:00:00Z',
}
const t2: TestimonialDto = {
  ...t1,
  id: 't2',
  name: 'ช่างสมชาย ต.',
  role: 'ช่าง WeeeT',
  stars: '★★★★☆',
  starsRating: 4,
  status: 'draft',
  sortOrder: 2,
  publishedAt: null,
}

beforeEach(() => {
  jest.clearAllMocks()
  window.localStorage.setItem('app3r_admin_token', 'test-token')
})

describe('TestimonialList', () => {
  it('renders rows sorted by sortOrder', async () => {
    mList.mockResolvedValue([t2, t1])
    render(<TestimonialList />)
    await waitFor(() =>
      expect(screen.getByText('คุณสมหญิง ว.')).toBeInTheDocument(),
    )
    expect(screen.getByText('ช่างสมชาย ต.')).toBeInTheDocument()
  })

  it('shows empty state', async () => {
    mList.mockResolvedValue([])
    render(<TestimonialList />)
    await waitFor(() =>
      expect(screen.getByText('ไม่พบรีวิว')).toBeInTheDocument(),
    )
  })

  it('shows error state', async () => {
    mList.mockRejectedValue(new Error('โหลดล้มเหลว'))
    render(<TestimonialList />)
    await waitFor(() =>
      expect(screen.getByText(/โหลดล้มเหลว/)).toBeInTheDocument(),
    )
  })

  it('filters by status', async () => {
    mList.mockResolvedValue([t1, t2])
    render(<TestimonialList />)
    await waitFor(() =>
      expect(screen.getByText('คุณสมหญิง ว.')).toBeInTheDocument(),
    )
    fireEvent.change(screen.getByLabelText('กรองตามสถานะ'), {
      target: { value: 'draft' },
    })
    await waitFor(() =>
      expect(screen.queryByText('คุณสมหญิง ว.')).not.toBeInTheDocument(),
    )
    expect(screen.getByText('ช่างสมชาย ต.')).toBeInTheDocument()
  })

  it('toggles publish status', async () => {
    mList.mockResolvedValue([t2])
    mToggle.mockResolvedValue({ ...t2, status: 'published' })
    render(<TestimonialList />)
    await waitFor(() =>
      expect(screen.getByText('ช่างสมชาย ต.')).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByText('เผยแพร่'))
    await waitFor(() =>
      expect(mToggle).toHaveBeenCalledWith('test-token', 't2'),
    )
  })

  it('deletes after confirm', async () => {
    mList.mockResolvedValue([t1])
    mDelete.mockResolvedValue(undefined)
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    render(<TestimonialList />)
    await waitFor(() =>
      expect(screen.getByText('คุณสมหญิง ว.')).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByText('ลบ'))
    await waitFor(() =>
      expect(mDelete).toHaveBeenCalledWith('test-token', 't1'),
    )
  })

  it('does not delete when confirm cancelled', async () => {
    mList.mockResolvedValue([t1])
    jest.spyOn(window, 'confirm').mockReturnValue(false)
    render(<TestimonialList />)
    await waitFor(() =>
      expect(screen.getByText('คุณสมหญิง ว.')).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByText('ลบ'))
    expect(mDelete).not.toHaveBeenCalled()
  })
})

describe('TestimonialForm — create', () => {
  it('renders empty create form', () => {
    render(<TestimonialForm />)
    expect(screen.getByText('เพิ่มรีวิวใหม่')).toBeInTheDocument()
  })

  it('validates required fields before submit', async () => {
    render(<TestimonialForm />)
    fireEvent.click(screen.getByText('สร้างรีวิว'))
    await waitFor(() =>
      expect(screen.getByText('กรอกชื่อผู้รีวิว')).toBeInTheDocument(),
    )
    expect(mCreate).not.toHaveBeenCalled()
  })

  it('creates testimonial when valid', async () => {
    mCreate.mockResolvedValue({ ...t1, id: 'new1' })
    render(<TestimonialForm />)
    fireEvent.change(screen.getByPlaceholderText('เช่น ลูกค้า WeeeU — กรุงเทพฯ'), {
      target: { value: 'ลูกค้า' },
    })
    // name + text + avatar via label-derived inputs
    const nameInput = screen
      .getByText('ชื่อผู้รีวิว *')
      .closest('div')!
      .querySelector('input') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'ทดสอบ' } })
    const textArea = screen
      .getByText(/ข้อความรีวิว/)
      .closest('div')!
      .querySelector('textarea') as HTMLTextAreaElement
    fireEvent.change(textArea, { target: { value: 'รีวิวดีมาก' } })
    fireEvent.change(screen.getByPlaceholderText('👩‍🦱 หรือ https://...'), {
      target: { value: '👷' },
    })
    fireEvent.click(screen.getByText('สร้างรีวิว'))
    await waitFor(() =>
      expect(mCreate).toHaveBeenCalledWith(
        'test-token',
        expect.objectContaining({ name: 'ทดสอบ', text: 'รีวิวดีมาก' }),
      ),
    )
  })
})

describe('TestimonialForm — edit', () => {
  it('loads existing testimonial then updates', async () => {
    mGet.mockResolvedValue(t1)
    mUpdate.mockResolvedValue(t1)
    render(<TestimonialForm id="t1" />)
    await waitFor(() =>
      expect(screen.getByDisplayValue('คุณสมหญิง ว.')).toBeInTheDocument(),
    )
    expect(screen.getByText('แก้ไขรีวิว')).toBeInTheDocument()
    fireEvent.click(screen.getByText('บันทึก'))
    await waitFor(() =>
      expect(mUpdate).toHaveBeenCalledWith(
        'test-token',
        't1',
        expect.objectContaining({ name: 'คุณสมหญิง ว.' }),
      ),
    )
  })

  it('shows error when load fails', async () => {
    mGet.mockRejectedValue(new Error('ไม่พบ'))
    render(<TestimonialForm id="t1" />)
    await waitFor(() =>
      expect(screen.getByText('ไม่พบ')).toBeInTheDocument(),
    )
  })
})
