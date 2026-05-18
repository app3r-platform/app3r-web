/**
 * tests/unit/components/admin-list/AuditDetailView.test.tsx
 * Sub-5c D80 — read-only audit entry display (D9-B: no diff)
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { AuditDetailView } from '@/components/admin-list/AuditDetailView'
import type { AuditRecord } from '@/lib/mocks/audit.seed'

const entry: AuditRecord = {
  id: 'AUD-001',
  actor: 'admin@app3r.th',
  module: 'services',
  action: 'create',
  entityId: 'SVC-001',
  timestamp: '2026-05-17T05:00:00.000Z',
}

describe('AuditDetailView', () => {
  it('renders placeholder when entry is null', () => {
    render(<AuditDetailView entry={null} />)
    expect(screen.getByText('ไม่ได้เลือกรายการ')).toBeInTheDocument()
  })

  it('renders all 6 field rows when entry is provided', () => {
    render(<AuditDetailView entry={entry} />)
    expect(screen.getByText('การกระทำ')).toBeInTheDocument()
    expect(screen.getByText('โมดูล')).toBeInTheDocument()
    expect(screen.getByText('ผู้กระทำ')).toBeInTheDocument()
    expect(screen.getByText('Entity ID')).toBeInTheDocument()
    expect(screen.getByText('เวลา')).toBeInTheDocument()
    expect(screen.getByText('ID')).toBeInTheDocument()
    expect(screen.getByText('admin@app3r.th')).toBeInTheDocument()
    expect(screen.getByText('SVC-001')).toBeInTheDocument()
    expect(screen.getByText('AUD-001')).toBeInTheDocument()
  })

  it('renders Thai action badge label per action (5 values)', () => {
    const cases: Array<[AuditRecord['action'], string]> = [
      ['create', 'สร้าง'],
      ['update', 'แก้ไข'],
      ['delete', 'ลบ'],
      ['approve', 'อนุมัติ'],
      ['reject', 'ปฏิเสธ'],
    ]
    for (const [action, label] of cases) {
      const { unmount } = render(<AuditDetailView entry={{ ...entry, action }} />)
      expect(screen.getByText(label)).toBeInTheDocument()
      unmount()
    }
  })

  it('does not render any before/after diff (D9-B)', () => {
    render(<AuditDetailView entry={entry} />)
    expect(screen.queryByText(/before/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/after/i)).not.toBeInTheDocument()
  })
})
