/**
 * lib/types/contact-info.ts
 * ★ SOURCE-OF-TRUTH: packages/shared/dal/contact.types.ts (Backend Sub-4 T+2)
 *   Mirrored for WeeeU — DO NOT edit types here; update Backend first, then sync.
 *
 * Sub-CMD-4 D78 — WeeeU Footer
 * Remediation v2: branch phase-d-4/weeeu-sub4-contact base 8be4344
 */

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

export type SocialPlatform =
  | 'line'
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'twitter'

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
