// Sub-5b D80 — Zod schema for UserRecord (omit id + registeredAt — auto)
import { z } from 'zod'

export const usersSchema = z.object({
  name: z.string().min(1, 'กรอกชื่อ'),
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  phone: z.string().regex(/^[0-9]{9,10}$/, 'เบอร์โทร 9-10 หลัก'),
  role: z.enum(['weeeu', 'weeer', 'weeet']),
  status: z.enum(['active', 'suspended', 'pending_verify', 'banned']),
})

export type UsersInput = z.infer<typeof usersSchema>
