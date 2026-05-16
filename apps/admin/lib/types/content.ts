// ⚠️ STUB MIRROR from Backend Schema Plan (362813ec-7277-81be-b041-e669c1b24b77)
// ห้าม import โดยตรงจาก packages/shared/dal/ (Lesson #33)
// T+2: switch to real import หลัง Backend merge

export type ContentType = 'hero' | 'about' | 'faq' | 'static'
export type ContentStatus = 'draft' | 'published'

export interface ContentImageDto {
  id: string
  contentPageId: string
  url: string
  r2Key: string
  alt: string | null
  caption: string | null
  order: number
  createdAt: string
}

export interface ContentVersionDto {
  id: string
  contentPageId: string
  version: number
  body: Record<string, unknown>
  publishedAt: string | null
  authorId: string | null
  createdAt: string
}

export interface ContentPageDto {
  id: string
  slug: string
  type: ContentType
  title: string
  body: Record<string, unknown>
  status: ContentStatus
  version: number
  authorId: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ContentPageDetailDto extends ContentPageDto {
  images: ContentImageDto[]
}

export interface CreateContentPageInput {
  slug: string
  type: ContentType
  title: string
  body: Record<string, unknown>
}

export interface UpdateContentPageInput {
  title?: string
  body?: Record<string, unknown>
  slug?: string
}

export interface ContentPreviewTokenDto {
  token: string
  contentPageId: string
  expiresAt: string
}
