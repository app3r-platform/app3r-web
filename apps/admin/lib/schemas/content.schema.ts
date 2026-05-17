// Sub-5b D80 — Zod schema for ContentRecord (omit id + createdAt — auto)
import { z } from 'zod'

export const contentSchema = z.object({
  title: z.string().min(1, 'กรอกหัวข้อ'),
  type: z.enum(['article', 'marketing', 'contact']),
  author: z.string().min(1, 'กรอกผู้เขียน'),
  status: z.enum(['draft', 'published', 'archived']),
})

export type ContentInput = z.infer<typeof contentSchema>
