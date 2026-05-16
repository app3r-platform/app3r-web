// API client for Content CMS endpoints
// Backend: /content/* (JWT + admin role required)
// T+2: ตรวจสอบ endpoint paths หลัง Backend merge

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

// GET /content/ — list all pages (admin)
export async function listContentPages(
  token: string,
  params?: { type?: ContentType; status?: ContentStatus },
): Promise<ContentPageDto[]> {
  const qs = new URLSearchParams()
  if (params?.type) qs.set('type', params.type)
  if (params?.status) qs.set('status', params.status)
  const query = qs.toString() ? `?${qs.toString()}` : ''
  return apiFetch<ContentPageDto[]>(`/content/${query}`, {}, token)
}

// GET /content/:id/ — detail with images
export async function getContentPage(
  token: string,
  id: string,
): Promise<ContentPageDetailDto> {
  return apiFetch<ContentPageDetailDto>(`/content/${id}/`, {}, token)
}

// POST /content/ — create new page
export async function createContentPage(
  token: string,
  input: CreateContentPageInput,
): Promise<ContentPageDetailDto> {
  return apiFetch<ContentPageDetailDto>(
    '/content/',
    { method: 'POST', body: JSON.stringify(input) },
    token,
  )
}

// PATCH /content/:id/ — update page
export async function updateContentPage(
  token: string,
  id: string,
  input: UpdateContentPageInput,
): Promise<ContentPageDetailDto> {
  return apiFetch<ContentPageDetailDto>(
    `/content/${id}/`,
    { method: 'PATCH', body: JSON.stringify(input) },
    token,
  )
}

// POST /content/:id/publish/ — publish page
export async function publishContentPage(
  token: string,
  id: string,
): Promise<ContentPageDetailDto> {
  return apiFetch<ContentPageDetailDto>(
    `/content/${id}/publish/`,
    { method: 'POST' },
    token,
  )
}

// DELETE /content/:id/ — soft-delete (admin only)
export async function deleteContentPage(
  token: string,
  id: string,
): Promise<void> {
  await apiFetch<void>(`/content/${id}/`, { method: 'DELETE' }, token)
}

// GET /content/:id/versions/ — version history
export async function getContentVersions(
  token: string,
  id: string,
): Promise<ContentVersionDto[]> {
  return apiFetch<ContentVersionDto[]>(`/content/${id}/versions/`, {}, token)
}

// POST /content/:id/preview/ — generate preview token
export async function createPreviewToken(
  token: string,
  id: string,
): Promise<ContentPreviewTokenDto> {
  return apiFetch<ContentPreviewTokenDto>(
    `/content/${id}/preview/`,
    { method: 'POST' },
    token,
  )
}

// POST /content/:id/images/ — upload image (multipart)
export async function uploadContentImage(
  token: string,
  id: string,
  formData: FormData,
): Promise<{ id: string; url: string; r2Key: string }> {
  const res = await fetch(`${API_BASE}/content/${id}/images/`, {
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
