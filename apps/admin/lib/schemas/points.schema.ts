// Sub-5b D80 — Zod schema for PointRecord (omit id + transactedAt — auto)
import { z } from 'zod'

export const pointsSchema = z.object({
  userName: z.string().min(1, 'กรอกชื่อผู้ใช้'),
  type: z.enum(['gold', 'silver']),
  amount: z.coerce.number().int().positive('จำนวนต้อง > 0'),
  status: z.enum(['pending', 'completed', 'reversed']),
})

export type PointsInput = z.infer<typeof pointsSchema>
