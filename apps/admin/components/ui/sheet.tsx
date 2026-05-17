'use client'
// Sub-5b D80 — Radix-direct Sheet wrapper (@radix-ui/react-dialog, right 480px)
// Pattern: ตรงกับ Sub-5a FilterBar (@radix-ui/react-toggle-group ตรง) — ไม่มี shadcn / cn helper
import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'

export const Sheet = Dialog.Root
export const SheetTrigger = Dialog.Trigger
export const SheetClose = Dialog.Close
export const SheetTitle = Dialog.Title
export const SheetDescription = Dialog.Description

export function SheetContent({ children }: { children: ReactNode }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 data-[state=open]:opacity-100 data-[state=closed]:opacity-0 transition-opacity duration-300" />
      <Dialog.Content
        className="fixed right-0 top-0 z-50 h-full w-[480px] max-w-full bg-gray-900 border-l border-gray-800 text-white shadow-xl flex flex-col data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full transition-transform duration-300 focus:outline-none"
      >
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  )
}
