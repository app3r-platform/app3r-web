// Sub-5b D80 — Zod schema for ServiceRecord (omit id + createdAt — auto)
import { z } from 'zod'

export const servicesSchema = z.object({
  customerName: z.string().min(1, 'กรอกชื่อลูกค้า'),
  technicianName: z.string().min(1, 'กรอกชื่อช่าง'),
  serviceType: z.enum(['repair', 'maintain', 'resell', 'scrap']),
  status: z.enum(['requested', 'accepted', 'in_progress', 'completed', 'cancelled']),
})

export type ServicesInput = z.infer<typeof servicesSchema>
