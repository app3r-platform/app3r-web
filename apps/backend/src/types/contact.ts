/**
 * types/contact.ts — Sub-4 D78: Contact Info + Form (Backend local mirror)
 *
 * ★ Backend ใช้ไฟล์นี้ (rootDir: src ป้องกัน import จาก packages/)
 *   FE chats (Admin/WeeeR/WeeeT/WeeeU/Website) import จาก
 *   packages/shared/dal/contact.types.ts เท่านั้น (Lesson #34)
 *
 * Schema Plan: 363813ec-7277-81c2-b7b4-d9111d0b3427
 * Master CMD:  363813ec-7277-813c-ba73-e56b9695d828 (v4.2)
 * D78 Decision: 35d813ec-7277-81ba-b07e-dd8289a709a0
 */

// ── 8-category enum (D78 spec) ───────────────────────────────────────────────
export type ContactCategory =
  | 'general' | 'sales' | 'support' | 'partnership'
  | 'press' | 'feedback' | 'careers' | 'other'

// ── Contact message status ───────────────────────────────────────────────────
export type ContactStatus = 'new' | 'read' | 'replied' | 'closed'

// ── Contact message DTOs ─────────────────────────────────────────────────────
export interface ContactMessageDto {
  id: string
  category: ContactCategory
  name: string
  email: string
  phone: string | null
  subject: string
  body: string
  status: ContactStatus
  createdAt: string
  updatedAt: string
  repliedAt: string | null
  repliedBy: string | null
  deletedAt: string | null  // soft delete — null = active
}

export interface CreateContactMessageInput {
  category: ContactCategory
  name: string
  email: string
  phone?: string
  subject: string
  body: string
}

export interface UpdateContactStatusInput {
  status: ContactStatus
}

// ── ContactInfoDto (D78 spec — section 6, ห้ามแก้ structure) ─────────────────
export interface ContactInfoAddress {
  street: string
  district: string
  province: string
  postalCode: string
  country: string
}

export interface ContactInfoPhone {
  label: string
  number: string
  hours?: string
}

export interface ContactInfoEmail {
  label: string
  address: string
}

export type SocialPlatform = 'line' | 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'twitter'

export interface ContactInfoSocial {
  platform: SocialPlatform
  handle: string
  url: string
}

export interface ContactInfoBusinessHours {
  weekdays: string
  weekend?: string
  holidays?: string
}

export interface ContactInfoDto {
  companyName: string
  address: ContactInfoAddress
  phones: ContactInfoPhone[]
  emails: ContactInfoEmail[]
  socials: ContactInfoSocial[]
  businessHours: ContactInfoBusinessHours
  mapEmbedUrl: string | null
  updatedAt: string
}
