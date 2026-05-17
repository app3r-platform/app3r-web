// API client for Content CMS endpoints
// Backend: /api/admin/content/* (JWT + admin role required)
// Fixed Bug A: path prefix /content/ → /api/admin/content/ (E2E remediation 2026-05-16)

import type {
  ContentPageDto,
  ContentPageDetailDto,
  ContentPreviewTokenDto,
  CreateContentPageInput,
  UpdateContentPageInput,
  ContentType,
  ContentStatus,
  ContentVersionDto,
} from '@/lib/types/content'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787'

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw Object.assign(new Error((err as { detail: string }).detail ?? 'API error'), {
      status: res.status,
    })
  }
  return res.json() as Promise<T>
}

// GET /api/admin/content — list all pages (admin)
export async function listContentPages(
  token: string,
  params?: { type?: ContentType; status?: ContentStatus },
): Promise<ContentPageDto[]> {
  const qs = new URLSearchParams()
  if (params?.type) qs.set('type', params.type)
  if (params?.status) qs.set('status', params.status)
  const query = qs.toString() ? `?${qs.toString()}` : ''
  return apiFetch<ContentPageDto[]>(`/api/admin/content${query}`, {}, token)
}

// GET /api/admin/content/:id — detail with images
// Note: Backend doesn't have a dedicated GET /:id endpoint yet.
// Fallback: fetch list and filter by id until Backend adds GET /:id.
export async function getContentPage(
  token: string,
  id: string,
): Promise<ContentPageDetailDto> {
  const pages = await apiFetch<ContentPageDto[]>(`/api/admin/content`, {}, token)
  const found = pages.find((p) => p.id === id)
  if (!found) throw Object.assign(new Error('Not found.'), { status: 404 })
  // Return as ContentPageDetailDto with empty images (images loaded separately)
  return { ...found, images: [] } as ContentPageDetailDto
}

// POST /api/admin/content — create new page
export async function createContentPage(
  token: string,
  input: CreateContentPageInput,
): Promise<ContentPageDetailDto> {
  return apiFetch<ContentPageDetailDto>(
    '/api/admin/content',
    { method: 'POST', body: JSON.stringify(input) },
    token,
  )
}

// PUT /api/admin/content/:id — update page (Backend uses PUT not PATCH)
export async function updateContentPage(
  token: string,
  id: string,
  input: UpdateContentPageInput,
): Promise<ContentPageDetailDto> {
  return apiFetch<ContentPageDetailDto>(
    `/api/admin/content/${id}`,
    { method: 'PUT', body: JSON.stringify(input) },
    token,
  )
}

// POST /api/admin/content/:id/publish — publish page
export async function publishContentPage(
  token: string,
  id: string,
): Promise<ContentPageDetailDto> {
  return apiFetch<ContentPageDetailDto>(
    `/api/admin/content/${id}/publish`,
    { method: 'POST' },
    token,
  )
}

// DELETE /api/admin/content/:id — delete page
export async function deleteContentPage(
  token: string,
  id: string,
): Promise<void> {
  await apiFetch<void>(`/api/admin/content/${id}`, { method: 'DELETE' }, token)
}

// GET /api/admin/content/:id/versions — version history
// Note: Backend doesn't have this endpoint yet (pending Backend add).
// Returns empty array until Backend implements GET /:id/versions.
export async function getContentVersions(
  _token: string,
  _id: string,
): Promise<ContentVersionDto[]> {
  // TODO: update path when Backend adds GET /api/admin/content/:id/versions
  return []
}

// POST /api/admin/content/:id/preview — generate preview token
export async function createPreviewToken(
  token: string,
  id: string,
): Promise<ContentPreviewTokenDto> {
  return apiFetch<ContentPreviewTokenDto>(
    `/api/admin/content/${id}/preview`,
    { method: 'POST' },
    token,
  )
}

// POST /api/admin/content/upload-image — upload image (multipart)
// FormData must include: file, contentPageId (UUID), alt (optional)
// Note: Backend endpoint is /upload-image (not /:id/images/)
export async function uploadContentImage(
  token: string,
  id: string,
  formData: FormData,
): Promise<{ id: string; url: string; r2Key: string }> {
  // Ensure contentPageId is in FormData (Backend requires it)
  if (!formData.get('contentPageId')) {
    formData.set('contentPageId', id)
  }
  const res = await fetch(`${API_BASE}/api/admin/content/upload-image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw Object.assign(new Error((err as { detail: string }).detail ?? 'Upload error'), {
      status: res.status,
    })
  }
  return res.json()
}
