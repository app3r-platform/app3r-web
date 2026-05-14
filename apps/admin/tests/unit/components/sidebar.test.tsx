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

  it('แสดง nav link "Dashboard"', () => {
    mockUsePathname.mockReturnValue('/')
    render(<Sidebar />)
    // Dashboard ปรากฏ 2 ครั้ง (logo subtitle + nav link) — ใช้ getAllByText
    const dashboardItems = screen.getAllByText('Dashboard')
    expect(dashboardItems.length).toBeGreaterThanOrEqual(1)
  })

  it('แสดง nav group "Repair"', () => {
    mockUsePathname.mockReturnValue('/repair/jobs')
    render(<Sidebar />)
    expect(screen.getByText('Repair')).toBeInTheDocument()
  })

  it('แสดง nav group "Scrap"', () => {
    mockUsePathname.mockReturnValue('/scrap/jobs')
    render(<Sidebar />)
    expect(screen.getByText('Scrap')).toBeInTheDocument()
  })
})

describe('Sidebar — active state (สถานะ active)', () => {
  it('Dashboard มี active class เมื่อ pathname = "/"', () => {
    mockUsePathname.mockReturnValue('/')
    render(<Sidebar />)
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toHaveClass('bg-blue-600')
  })

  it('Dashboard ไม่มี active class เมื่อ pathname ≠ "/"', () => {
    mockUsePathname.mockReturnValue('/users')
    render(<Sidebar />)
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).not.toHaveClass('bg-blue-600')
  })

  it('Repair Jobs มี active class เมื่ออยู่หน้า repair/jobs', () => {
    mockUsePathname.mockReturnValue('/repair/jobs')
    render(<Sidebar />)
    const repairLink = screen.getByRole('link', { name: /repair jobs/i })
    expect(repairLink).toHaveClass('bg-blue-600')
  })

  it('Repair Jobs มี active class เมื่ออยู่หน้า repair/jobs/{id} (startsWith)', () => {
    mockUsePathname.mockReturnValue('/repair/jobs/abc-123')
    render(<Sidebar />)
    const repairLink = screen.getByRole('link', { name: /repair jobs/i })
    expect(repairLink).toHaveClass('bg-blue-600')
  })
})
