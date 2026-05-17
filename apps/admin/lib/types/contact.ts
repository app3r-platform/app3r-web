// ⚠️ STUB MIRROR from Backend Schema Plan (363813ec-7277-81c2-b7b4-d9111d0b3427) Sec 2-3
// Sub-4 D78 Contact — mirrors packages/shared/dal/contact.types.ts (Backend-owned)
// ห้าม import โดยตรงจาก packages/shared/dal/ (Lesson #33) — ห้ามสร้าง type นอก Schema Plan (Lesson #34)
// T+2: switch to real import หลัง Backend merge

// ── 8-category enum (D78 spec — authoritative) ────────────────────────────────
export type ContactCategory =
  | 'general'      // สอบถามทั่วไป
  | 'sales'        // สนใจบริการ
  | 'support'      // รายงานปัญหา / ขอความช่วยเหลือ
  | 'partnership'  // ขอเป็นพันธมิตร
  | 'press'        // สื่อ/PR
  | 'feedback'     // ความคิดเห็น/ข้อเสนอแนะ
  | 'careers'      // ร่วมงาน
  | 'other'        // อื่นๆ

// ── Contact message status ────────────────────────────────────────────────────
export type ContactStatus = 'new' | 'read' | 'replied' | 'closed'

// ── Contact message DTOs ──────────────────────────────────────────────────────
export interface ContactMessageDto {
  id: string
  category: ContactCategory
  name: string
  email: string
  phone: string | null
  subject: string
  body: string
  status: ContactStatus
  createdAt: string // ISO-8601
  updatedAt: string
  repliedAt: string | null
  repliedBy: string | null // UUID → users.id
  deletedAt: string | null // soft delete — null = active
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

// ── ContactInfoDto (Schema Plan Sec 3 — ตาม D78 spec เป๊ะ ห้ามแก้) ──────────────
export interface ContactInfoAddress {
  street: string // ที่อยู่สถานประกอบกิจการ
  district: string // อำเภอ
  province: string // จังหวัด
  postalCode: string
  country: string
}

export interface ContactInfoPhone {
  label: string // เช่น "สายด่วน" / "สำนักงานใหญ่"
  number: string // 02-xxx-xxxx
  hours?: string // เช่น "จ-ศ 9:00-18:00"
}

export interface ContactInfoEmail {
  label: string // เช่น "ทั่วไป" / "ฝ่ายขาย" / "ฝ่ายสนับสนุน"
  address: string
}

export type SocialPlatform =
  | 'line'
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'twitter'

export interface ContactInfoSocial {
  platform: SocialPlatform
  handle: string // @app3r
  url: string
}

export interface ContactInfoBusinessHours {
  weekdays: string // "จ-ศ 9:00-18:00"
  weekend?: string // "ส-อา 10:00-17:00"
  holidays?: string // "ปิดวันหยุดนักขัตฤกษ์"
}

export interface ContactInfoDto {
  companyName: string
  address: ContactInfoAddress
  phones: ContactInfoPhone[]
  emails: ContactInfoEmail[]
  socials: ContactInfoSocial[]
  businessHours: ContactInfoBusinessHours
  mapEmbedUrl: string | null
  updatedAt: string // ISO-8601
}
