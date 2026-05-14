/**
 * tests/unit/pages/reconciliation.test.tsx
 * ทดสอบ Settlement Reconciliation page — Sub-CMD-7 Wave 2
 * App3R-Admin
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  isAuthenticated: jest.fn().mockReturnValue(true),
  isSuperAdmin: jest.fn().mockReturnValue(true),
  getToken: jest.fn().mockReturnValue('mock-token'),
}))

jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}))

jest.mock('@/components/sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}))

import SettlementReconciliationPage, {
  type StuckSettlement,
  type ReconciliationReport,
} from '@/app/reconciliation/page'
import { api } from '@/lib/api'
import { isSuperAdmin } from '@/lib/auth'

const mockApi = api as jest.Mocked<typeof api>
const mockIsSuperAdmin = isSuperAdmin as jest.Mock

// ─── Mock data ─────────────────────────────────────────────────────────────────

const mockStuckItem: StuckSettlement = {
  id: 'settle-abc-123',
  job_id: 'job-xyz-456',
  job_type: 'repair',
  amount: 2500,
  status: 'pending',
  created_at: '2026-05-14T08:00:00Z',
  updated_at: '2026-05-14T08:00:00Z',
  stuck_since_hours: 5.5,
  error_message: null,
}

const mockReport: ReconciliationReport = {
  total_stuck: 3,
  total_pending: 2,
  total_processing: 1,
  total_failed: 0,
  last_worker_run_at: '2026-05-14T10:00:00Z',
  worker_status: 'idle',
  items: [mockStuckItem],
}

const emptyReport: ReconciliationReport = {
  ...mockReport,
  total_stuck: 0,
  total_pending: 0,
  total_processing: 0,
  total_failed: 0,
  items: [],
}

beforeEach(() => {
  jest.clearAllMocks()
  mockApi.get.mockResolvedValue(mockReport)
  mockIsSuperAdmin.mockReturnValue(true)
})

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('SettlementReconciliationPage — render', () => {
  it('แสดง heading "Settlement Reconciliation"', async () => {
    render(<SettlementReconciliationPage />)
    await waitFor(() => {
      expect(screen.getByText(/Settlement Reconciliation/)).toBeInTheDocument()
    })
  })

  it('แสดง summary card "ค้างทั้งหมด" พร้อมจำนวน', async () => {
    render(<SettlementReconciliationPage />)
    await waitFor(() => {
      expect(screen.getByText('ค้างทั้งหมด')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  it('แสดงปุ่ม "Run Worker" เมื่อเป็น Super Admin', async () => {
    render(<SettlementReconciliationPage />)
    await waitFor(() => {
      expect(screen.getByText(/Run Worker ตอนนี้/)).toBeInTheDocument()
    })
  })

  it('ไม่แสดงปุ่ม "Run Worker" เมื่อไม่ใช่ Super Admin', async () => {
    mockIsSuperAdmin.mockReturnValue(false)
    render(<SettlementReconciliationPage />)
    await waitFor(() => {
      expect(screen.queryByText(/Run Worker/)).not.toBeInTheDocument()
    })
  })

  it('แสดง worker status "Idle"', async () => {
    render(<SettlementReconciliationPage />)
    await waitFor(() => {
      expect(screen.getByText(/Idle/)).toBeInTheDocument()
    })
  })
})

describe('SettlementReconciliationPage — table', () => {
  it('แสดง settlement ค้างในตาราง', async () => {
    render(<SettlementReconciliationPage />)
    await waitFor(() => {
      expect(screen.getByText(/settle-abc/)).toBeInTheDocument()
    })
  })

  it('แสดงปุ่ม "แก้ไข" สำหรับ Super Admin', async () => {
    render(<SettlementReconciliationPage />)
    await waitFor(() => {
      expect(screen.getByText('🔧 แก้ไข')).toBeInTheDocument()
    })
  })

  it('แสดง "ไม่มี settlement ค้าง" เมื่อ list ว่าง', async () => {
    mockApi.get.mockResolvedValue(emptyReport)
    render(<SettlementReconciliationPage />)
    await waitFor(() => {
      expect(screen.getByText(/ไม่มี settlement ค้าง/)).toBeInTheDocument()
    })
  })
})

describe('SettlementReconciliationPage — actions', () => {
  it('เรียก api.post เมื่อกด Run Worker', async () => {
    mockApi.post.mockResolvedValue({})
    render(<SettlementReconciliationPage />)
    await waitFor(() => screen.getByText(/Run Worker ตอนนี้/))
    fireEvent.click(screen.getByText(/Run Worker ตอนนี้/))
    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/reconciliation/run', {})
    })
  })

  it('เปิด Resolve Modal เมื่อกดปุ่ม "แก้ไข"', async () => {
    render(<SettlementReconciliationPage />)
    await waitFor(() => screen.getByText('🔧 แก้ไข'))
    fireEvent.click(screen.getByText('🔧 แก้ไข'))
    expect(screen.getByText('🔧 แก้ไข Settlement ค้าง')).toBeInTheDocument()
  })

  it('ปิด Resolve Modal เมื่อกด "ยกเลิก"', async () => {
    render(<SettlementReconciliationPage />)
    await waitFor(() => screen.getByText('🔧 แก้ไข'))
    fireEvent.click(screen.getByText('🔧 แก้ไข'))
    fireEvent.click(screen.getByText('ยกเลิก'))
    expect(screen.queryByText('🔧 แก้ไข Settlement ค้าง')).not.toBeInTheDocument()
  })
})

describe('SettlementReconciliationPage — filter', () => {
  it('กรอง filter "pending" แสดงเฉพาะ pending items', async () => {
    const multiItems: ReconciliationReport = {
      ...mockReport,
      items: [
        { ...mockStuckItem, id: 'a1', status: 'pending' },
        { ...mockStuckItem, id: 'b2', status: 'failed' },
      ],
    }
    mockApi.get.mockResolvedValue(multiItems)
    render(<SettlementReconciliationPage />)
    await waitFor(() => screen.getByText('ทั้งหมด'))
    fireEvent.click(screen.getByRole('button', { name: 'รอดำเนินการ' }))
    await waitFor(() => {
      expect(screen.getByText(/แสดง 1 รายการ/)).toBeInTheDocument()
    })
  })
})
