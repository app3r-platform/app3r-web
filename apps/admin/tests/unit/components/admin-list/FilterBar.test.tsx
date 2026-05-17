/**
 * tests/unit/components/admin-list/FilterBar.test.tsx
 * Sub-5a D80 — FilterBar render + debounce
 */
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { FilterBar } from '@/components/admin-list/FilterBar'

jest.useFakeTimers()

const STATUS_OPTIONS = [
  { value: 'active',    label: 'ใช้งานอยู่' },
  { value: 'suspended', label: 'ระงับแล้ว' },
]

describe('FilterBar — render', () => {
  it('renders search input', () => {
    render(
      <FilterBar
        search=""
        status={null}
        statusOptions={STATUS_OPTIONS}
        onSearchChange={jest.fn()}
        onStatusChange={jest.fn()}
        onReset={jest.fn()}
      />
    )
    expect(screen.getByPlaceholderText('ค้นหา...')).toBeInTheDocument()
  })

  it('renders status option chips', () => {
    render(
      <FilterBar
        search=""
        status={null}
        statusOptions={STATUS_OPTIONS}
        onSearchChange={jest.fn()}
        onStatusChange={jest.fn()}
        onReset={jest.fn()}
      />
    )
    expect(screen.getByText('ใช้งานอยู่')).toBeInTheDocument()
    expect(screen.getByText('ระงับแล้ว')).toBeInTheDocument()
  })

  it('renders reset button', () => {
    render(
      <FilterBar
        search=""
        status={null}
        statusOptions={STATUS_OPTIONS}
        onSearchChange={jest.fn()}
        onStatusChange={jest.fn()}
        onReset={jest.fn()}
      />
    )
    expect(screen.getByText('รีเซ็ต')).toBeInTheDocument()
  })

  it('does not render chips when statusOptions is empty', () => {
    render(
      <FilterBar
        search=""
        status={null}
        statusOptions={[]}
        onSearchChange={jest.fn()}
        onStatusChange={jest.fn()}
        onReset={jest.fn()}
      />
    )
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })
})

describe('FilterBar — debounce', () => {
  it('debounces onSearchChange by 300ms', () => {
    const onSearch = jest.fn()
    render(
      <FilterBar
        search=""
        status={null}
        statusOptions={[]}
        onSearchChange={onSearch}
        onStatusChange={jest.fn()}
        onReset={jest.fn()}
      />
    )
    const input = screen.getByPlaceholderText('ค้นหา...')
    fireEvent.change(input, { target: { value: 'hello' } })
    expect(onSearch).not.toHaveBeenCalled()
    act(() => { jest.advanceTimersByTime(300) })
    expect(onSearch).toHaveBeenCalledWith('hello')
  })

  it('calls onReset when reset button is clicked', () => {
    const onReset = jest.fn()
    render(
      <FilterBar
        search="test"
        status={null}
        statusOptions={[]}
        onSearchChange={jest.fn()}
        onStatusChange={jest.fn()}
        onReset={onReset}
      />
    )
    fireEvent.click(screen.getByText('รีเซ็ต'))
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
