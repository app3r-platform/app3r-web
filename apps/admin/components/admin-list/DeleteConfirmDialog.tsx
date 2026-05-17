'use client'
// Sub-5b D80 — delete confirm (wrapper over ui/alert-dialog, Escape closes via Radix)
import {
  AlertDialogRoot,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogActionPrimitive,
  AlertDialogCancelPrimitive,
} from '@/components/ui/alert-dialog'

export interface DeleteConfirmDialogProps {
  open: boolean
  entityLabel: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
}

export function DeleteConfirmDialog({
  open,
  entityLabel,
  onOpenChange,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialogRoot open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle className="text-lg font-semibold">ยืนยันการลบ</AlertDialogTitle>
        <AlertDialogDescription className="mt-2 text-sm text-gray-400">
          ต้องการลบ <span className="text-white font-mono">{entityLabel}</span> หรือไม่? การกระทำนี้ย้อนกลับไม่ได้
        </AlertDialogDescription>
        <div className="mt-6 flex justify-end gap-3">
          <AlertDialogCancelPrimitive className="px-4 py-2 text-sm rounded border border-gray-700 text-gray-300 hover:bg-gray-800">
            ยกเลิก
          </AlertDialogCancelPrimitive>
          <AlertDialogActionPrimitive
            onClick={() => onConfirm()}
            className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-500"
          >
            ลบ
          </AlertDialogActionPrimitive>
        </div>
      </AlertDialogContent>
    </AlertDialogRoot>
  )
}
