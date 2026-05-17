/**
 * tests/unit/components/admin-list/AdminListPage.test.tsx
 * Sub-5a D80 — AdminListPage render + pagination
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { AdminListPage } from '@/components/admin-list/AdminListPage'

const defaultProps = {
  title: 'Test List',
  totalCount: 100,
  page: 1,
  pageSize: 20,
  search: '',
  status: null,
  statusOptions: [],
  onSearchChange: jest.fn(),
  onStatusChange: jest.fn(),
  onPageChange: jest.fn(),
  onReset: jest.fn(),
}

describe('AdminListPage — render', () => {
  it('renders the title', () => {
    render(<AdminListPage {...defaultProps}><div /></AdminListPage>)
    expect(screen.getByText('Test List')).toBeInTheDocument()
  })

  it('renders total count', () => {
    render(<AdminListPage {...defaultProps}><div /></AdminListPage>)
    expect(screen.getByText('100 รายการ')).toBeInTheDocument()
  })

  it('renders children', () => {
    render(
      <AdminListPage {...defaultProps}>
        <div data-testid="child-content">content</div>
      </AdminListPage>
    )
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
  })

  it('shows pagination when totalPages > 1', () => {
    render(<AdminListPage {...defaultProps}><div /></AdminListPage>)
    expect(screen.getByText('หน้า 1 / 5')).toBeInTheDocument()
  })

  it('hides pagination when all items fit one page', () => {
    render(
      <AdminListPage {...defaultProps} totalCount={10} page={1} pageSize={20}>
        <div />
      </AdminListPage>
    )
    expect(screen.queryByText(/หน้า/)).not.toBeInTheDocument()
  })
})

describe('AdminListPage — pagination buttons', () => {
  it('calls onPageChange(2) when next is clicked', () => {
    const onPageChange = jest.fn()
    render(
      <AdminListPage {...defaultProps} onPageChange={onPageChange}>
        <div />
      </AdminListPage>
    )
    fireEvent.click(screen.getByText('ถัดไป'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('prev button is disabled on first page', () => {
    render(<AdminListPage {...defaultProps}><div /></AdminListPage>)
    const prev = screen.getByText('ก่อนหน้า')
    expect(prev).toBeDisabled()
  })

  it('next button is disabled on last page', () => {
    render(
      <AdminListPage {...defaultProps} page={5}>
        <div />
      </AdminListPage>
    )
    const next = screen.getByText('ถัดไป')
    expect(next).toBeDisabled()
  })
})
