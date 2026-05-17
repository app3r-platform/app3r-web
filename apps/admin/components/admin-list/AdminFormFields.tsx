'use client'
// Sub-5b D80 — form fields registry + renderer (react-hook-form)
import type { UseFormRegister, FieldErrors, FieldValues } from 'react-hook-form'
import type { z } from 'zod'
import { servicesSchema } from '@/lib/schemas/services.schema'
import { listingsSchema } from '@/lib/schemas/listings.schema'
import { usersSchema } from '@/lib/schemas/users.schema'
import { pointsSchema } from '@/lib/schemas/points.schema'
import { contentSchema } from '@/lib/schemas/content.schema'
import type { ModuleKey } from '@/lib/audit/log'

export interface FieldConfig {
  name: string
  label: string
  type: 'text' | 'select' | 'number' | 'date' | 'email'
  options?: { value: string; label: string }[]
  required?: boolean
}

export interface FormFieldsConfig {
  fields: FieldConfig[]
  schema: z.ZodTypeAny
}

const serviceTypeOpts = [
  { value: 'repair', label: 'ซ่อม' },
  { value: 'maintain', label: 'บำรุงรักษา' },
  { value: 'resell', label: 'ขายต่อ' },
  { value: 'scrap', label: 'ทิ้ง/รีไซเคิล' },
]
const serviceStatusOpts = [
  { value: 'requested', label: 'รอรับงาน' },
  { value: 'accepted', label: 'รับงานแล้ว' },
  { value: 'in_progress', label: 'กำลังดำเนินการ' },
  { value: 'completed', label: 'เสร็จแล้ว' },
  { value: 'cancelled', label: 'ยกเลิก' },
]

export const formFieldsRegistry: Record<ModuleKey, FormFieldsConfig> = {
  services: {
    schema: servicesSchema,
    fields: [
      { name: 'customerName', label: 'ลูกค้า', type: 'text', required: true },
      { name: 'technicianName', label: 'ช่าง', type: 'text', required: true },
      { name: 'serviceType', label: 'ประเภท', type: 'select', options: serviceTypeOpts, required: true },
      { name: 'status', label: 'สถานะ', type: 'select', options: serviceStatusOpts, required: true },
    ],
  },
  listings: {
    schema: listingsSchema,
    fields: [
      { name: 'title', label: 'ชื่อประกาศ', type: 'text', required: true },
      { name: 'sellerName', label: 'ผู้ขาย', type: 'text', required: true },
      { name: 'listingType', label: 'ประเภท', type: 'select', required: true, options: [
        { value: 'resell', label: 'ขายต่อ' },
        { value: 'scrap', label: 'ทิ้ง/รีไซเคิล' },
      ] },
      { name: 'status', label: 'สถานะ', type: 'select', required: true, options: [
        { value: 'draft', label: 'ร่าง' },
        { value: 'active', label: 'เปิดขาย' },
        { value: 'sold', label: 'ขายแล้ว' },
        { value: 'expired', label: 'หมดอายุ' },
      ] },
    ],
  },
  users: {
    schema: usersSchema,
    fields: [
      { name: 'name', label: 'ชื่อ', type: 'text', required: true },
      { name: 'email', label: 'อีเมล', type: 'email', required: true },
      { name: 'phone', label: 'เบอร์โทร', type: 'text', required: true },
      { name: 'role', label: 'บทบาท', type: 'select', required: true, options: [
        { value: 'weeeu', label: 'ผู้ใช้ทั่วไป (WeeeU)' },
        { value: 'weeer', label: 'ช่างซ่อม (WeeeR)' },
        { value: 'weeet', label: 'ผู้ค้า (WeeeT)' },
      ] },
      { name: 'status', label: 'สถานะ', type: 'select', required: true, options: [
        { value: 'active', label: 'ใช้งานอยู่' },
        { value: 'suspended', label: 'ระงับ' },
        { value: 'pending_verify', label: 'รอยืนยัน' },
        { value: 'banned', label: 'แบน' },
      ] },
    ],
  },
  points: {
    schema: pointsSchema,
    fields: [
      { name: 'userName', label: 'ผู้ใช้', type: 'text', required: true },
      { name: 'type', label: 'ประเภท', type: 'select', required: true, options: [
        { value: 'gold', label: 'Gold' },
        { value: 'silver', label: 'Silver' },
      ] },
      { name: 'amount', label: 'จำนวน', type: 'number', required: true },
      { name: 'status', label: 'สถานะ', type: 'select', required: true, options: [
        { value: 'pending', label: 'รอดำเนินการ' },
        { value: 'completed', label: 'สำเร็จ' },
        { value: 'reversed', label: 'ย้อนกลับ' },
      ] },
    ],
  },
  content: {
    schema: contentSchema,
    fields: [
      { name: 'title', label: 'หัวข้อ', type: 'text', required: true },
      { name: 'type', label: 'ประเภท', type: 'select', required: true, options: [
        { value: 'article', label: 'บทความ' },
        { value: 'marketing', label: 'การตลาด' },
        { value: 'contact', label: 'ติดต่อ' },
      ] },
      { name: 'author', label: 'ผู้เขียน', type: 'text', required: true },
      { name: 'status', label: 'สถานะ', type: 'select', required: true, options: [
        { value: 'draft', label: 'ร่าง' },
        { value: 'published', label: 'เผยแพร่' },
        { value: 'archived', label: 'จัดเก็บ' },
      ] },
    ],
  },
}

interface AdminFormFieldsProps {
  module: ModuleKey
  register: UseFormRegister<FieldValues>
  errors: FieldErrors<FieldValues>
}

export function AdminFormFields({ module, register, errors }: AdminFormFieldsProps) {
  const config = formFieldsRegistry[module]
  return (
    <div className="space-y-4">
      {config.fields.map((f) => {
        const err = errors[f.name]
        return (
          <div key={f.name} className="flex flex-col gap-1">
            <label htmlFor={f.name} className="text-sm text-gray-400">
              {f.label}
              {f.required && <span className="text-red-400"> *</span>}
            </label>
            {f.type === 'select' ? (
              <select
                id={f.name}
                {...register(f.name)}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
              >
                <option value="">— เลือก —</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input
                id={f.name}
                type={f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : 'text'}
                {...register(f.name)}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
              />
            )}
            {err && (
              <span className="text-xs text-red-400">{String(err.message)}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
