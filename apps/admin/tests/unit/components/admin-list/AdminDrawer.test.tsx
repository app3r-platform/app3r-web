/**
 * tests/unit/components/admin-list/AdminDrawer.test.tsx
 * Sub-5b D80 — drawer shell mode rendering
 * Buttons are queried by role+name (a status <option> also reads "ยกเลิก").
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { AdminDrawer } from '@/components/admin-list/AdminDrawer'
import type { ServiceRecord } from '@/lib/mocks/services.seed'

const item: ServiceRecord = {
  id: 'SVC-001',
  customerName: 'สมชาย ใจดี',
  technicianName: 'ช่างเอ',
  serviceType: 'repair',
  status: 'requested',
  createdAt: '2026-05-01T00:00:00.000Z',
}

const baseProps = {
  module: 'services' as const,
  open: true,
  item,
  onOpenChange: jest.fn(),
  onModeChange: jest.fn(),
  onSubmit: jest.fn().mockResolvedValue(undefined),
}

describe('AdminDrawer — view mode', () => {
  it('renders read-only field values + view footer', () => {
    render(<AdminDrawer<ServiceRecord> {...baseProps} mode="view" onDelete={jest.fn()} />)
    expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'แก้ไข' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ลบ' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ปิด' })).toBeInTheDocument()
  })
})

describe('AdminDrawer — create mode', () => {
  it('renders form inputs + create footer', () => {
    render(<AdminDrawer<ServiceRecord> {...baseProps} mode="create" item={null} />)
    expect(screen.getByRole('button', { name: 'สร้าง' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ยกเลิก' })).toBeInTheDocument()
    expect(screen.getByLabelText(/ลูกค้า/)).toBeInTheDocument()
  })
})

describe('AdminDrawer — edit mode', () => {
  it('renders save footer', () => {
    render(<AdminDrawer<ServiceRecord> {...baseProps} mode="edit" />)
    expect(screen.getByRole('button', { name: 'บันทึก' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ยกเลิก' })).toBeInTheDocument()
  })
})

describe('AdminDrawer — closed', () => {
  it('renders no form when open=false', () => {
    const { container } = render(
      <AdminDrawer<ServiceRecord> {...baseProps} open={false} mode="view" />
    )
    expect(container.querySelector('form')).toBeNull()
  })
})
