/**
 * tests/unit/components/sidebar.test.tsx
 * ทดสอบ components/sidebar.tsx — active state render + navigation
 * Sub-CMD-2 Wave 1 — App3R-Admin
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/components/sidebar'

// Mock next/image (จาก jest.setup.ts)
// Mock removeToken
jest.mock('@/lib/auth', () => ({
  removeToken: jest.fn(),
}))

// Mock usePathname สำหรับแต่ละ test
const mockUsePathname = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => mockUsePathname(),
}))

describe('Sidebar — render', () => {
  it('แสดง "App3R Admin" ในส่วน header', () => {
    mockUsePathname.mockReturnValue('/')
    render(<Sidebar />)
    expect(screen.getByText('App3R Admin')).toBeInTheDocument()
  })

  it('แสดงปุ่มออกจากระบบ (logout)', () => {
    mockUsePathname.mockReturnValue('/')
    render(<Sidebar />)
    expect(screen.getByText('ออกจากระบบ')).toBeInTheDocument()
  })

  it('แสดง nav link "แดชบอร์ด" (RC4 — i18n ไทย)', () => {
    mockUsePathname.mockReturnValue('/')
    render(<Sidebar />)
    const dashboardItems = screen.getAllByText('แดชบอร์ด')
    expect(dashboardItems.length).toBeGreaterThanOrEqual(1)
  })

  it('แสดง nav group "ซ่อม" (RC4 — i18n ไทย)', () => {
    mockUsePathname.mockReturnValue('/repair/jobs')
    render(<Sidebar />)
    expect(screen.getByText('ซ่อม')).toBeInTheDocument()
  })

  it('แสดง nav group "รับซาก" (RC4 — i18n ไทย)', () => {
    mockUsePathname.mockReturnValue('/scrap/jobs')
    render(<Sidebar />)
    expect(screen.getByText('รับซาก')).toBeInTheDocument()
  })
})

describe('Sidebar — active state (สถานะ active)', () => {
  it('แดชบอร์ด มี active class เมื่อ pathname = "/"', () => {
    mockUsePathname.mockReturnValue('/')
    render(<Sidebar />)
    const dashboardLink = screen.getByRole('link', { name: /แดชบอร์ด/ })
    expect(dashboardLink).toHaveClass('bg-admin-surface')
  })

  it('แดชบอร์ด ไม่มี active class เมื่อ pathname ≠ "/"', () => {
    mockUsePathname.mockReturnValue('/users')
    render(<Sidebar />)
    const dashboardLink = screen.getByRole('link', { name: /แดชบอร์ด/ })
    expect(dashboardLink).not.toHaveClass('bg-admin-surface')
  })

  it('งานซ่อม มี active class เมื่ออยู่หน้า repair/jobs', () => {
    mockUsePathname.mockReturnValue('/repair/jobs')
    render(<Sidebar />)
    const repairLink = screen.getByRole('link', { name: /งานซ่อม/ })
    expect(repairLink).toHaveClass('bg-admin-surface')
  })

  it('งานซ่อม มี active class เมื่ออยู่หน้า repair/jobs/{id} (startsWith)', () => {
    mockUsePathname.mockReturnValue('/repair/jobs/abc-123')
    render(<Sidebar />)
    const repairLink = screen.getByRole('link', { name: /งานซ่อม/ })
    expect(repairLink).toHaveClass('bg-admin-surface')
  })
})
