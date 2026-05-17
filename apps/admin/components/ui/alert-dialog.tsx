'use client'
// Sub-5b D80 — Radix-direct AlertDialog wrapper (@radix-ui/react-alert-dialog, modal)
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import type { ReactNode } from 'react'

export const AlertDialogRoot = AlertDialog.Root
export const AlertDialogTrigger = AlertDialog.Trigger
export const AlertDialogActionPrimitive = AlertDialog.Action
export const AlertDialogCancelPrimitive = AlertDialog.Cancel

export function AlertDialogContent({ children }: { children: ReactNode }) {
  return (
    <AlertDialog.Portal>
      <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
      <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[400px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-gray-900 border border-gray-800 p-6 text-white shadow-xl focus:outline-none">
        {children}
      </AlertDialog.Content>
    </AlertDialog.Portal>
  )
}

export const AlertDialogTitle = AlertDialog.Title
export const AlertDialogDescription = AlertDialog.Description
