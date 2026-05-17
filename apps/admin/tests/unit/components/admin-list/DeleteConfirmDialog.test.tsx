/**
 * tests/unit/components/admin-list/DeleteConfirmDialog.test.tsx
 * Sub-5b D80 — delete confirm dialog
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeleteConfirmDialog } from '@/components/admin-list/DeleteConfirmDialog'

describe('DeleteConfirmDialog', () => {
  it('renders title + entity label when open', () => {
    render(
      <DeleteConfirmDialog
        open
        entityLabel="SVC-001"
        onOpenChange={jest.fn()}
        onConfirm={jest.fn()}
      />
    )
    expect(screen.getByText('ยืนยันการลบ')).toBeInTheDocument()
    expect(screen.getByText('SVC-001')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(
      <DeleteConfirmDialog
        open={false}
        entityLabel="SVC-001"
        onOpenChange={jest.fn()}
        onConfirm={jest.fn()}
      />
    )
    expect(screen.queryByText('ยืนยันการลบ')).not.toBeInTheDocument()
  })

  it('calls onConfirm when ลบ is clicked', () => {
    const onConfirm = jest.fn()
    render(
      <DeleteConfirmDialog
        open
        entityLabel="SVC-001"
        onOpenChange={jest.fn()}
        onConfirm={onConfirm}
      />
    )
    fireEvent.click(screen.getByText('ลบ'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
