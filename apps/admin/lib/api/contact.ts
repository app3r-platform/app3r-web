// API client for Sub-4 D78 Contact endpoints
// Backend contract: Schema Plan Sec 5 (363813ec-7277-81c2-b7b4-d9111d0b3427)
// Admin endpoints require JWT + admin role (Lesson #44).
// T+2: Backend merges 8 endpoints → this client switches from pending → live.

import type {
  ContactMessageDto,
  ContactCategory,
  ContactStatus,
  UpdateContactStatusInput,
  ContactInfoDto,
} from '@/lib/types/contact'

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
    const err = await res
      .json()
      .catch(() => ({ detail: res.statusText }))
    throw Object.assign(
      new Error((err as { detail: string }).detail ?? 'API error'),
      { status: res.status },
    )
  }
  // 204 No Content (DELETE) → no body
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// GET /api/admin/contact — list messages (Admin JWT, filter deletedAt IS NULL server-side)
export async function listContactMessages(
  token: string,
  params?: { category?: ContactCategory; status?: ContactStatus },
): Promise<ContactMessageDto[]> {
  const qs = new URLSearchParams()
  if (params?.category) qs.set('category', params.category)
  if (params?.status) qs.set('status', params.status)
  const query = qs.toString() ? `?${qs.toString()}` : ''
  return apiFetch<ContactMessageDto[]>(
    `/api/admin/contact${query}`,
    {},
    token,
  )
}

// GET /api/admin/contact/:id — single message (Admin JWT)
export async function getContactMessage(
  token: string,
  id: string,
): Promise<ContactMessageDto> {
  return apiFetch<ContactMessageDto>(`/api/admin/contact/${id}`, {}, token)
}

// PUT /api/admin/contact/:id/status — update status (Admin JWT)
export async function updateContactStatus(
  token: string,
  id: string,
  input: UpdateContactStatusInput,
): Promise<ContactMessageDto> {
  return apiFetch<ContactMessageDto>(
    `/api/admin/contact/${id}/status`,
    { method: 'PUT', body: JSON.stringify(input) },
    token,
  )
}

// DELETE /api/admin/contact/:id — soft delete (Admin JWT, SET deletedAt = now())
export async function deleteContactMessage(
  token: string,
  id: string,
): Promise<void> {
  await apiFetch<void>(
    `/api/admin/contact/${id}`,
    { method: 'DELETE' },
    token,
  )
}

// GET /api/admin/contact-info — read contact-info for edit form (Admin JWT)
export async function getAdminContactInfo(
  token: string,
): Promise<ContactInfoDto> {
  return apiFetch<ContactInfoDto>('/api/admin/contact-info', {}, token)
}

// PUT /api/admin/contact-info — update contact-info (Admin JWT)
// Body = ContactInfoDto without updatedAt (server stamps updatedAt)
export async function updateContactInfo(
  token: string,
  input: Omit<ContactInfoDto, 'updatedAt'>,
): Promise<ContactInfoDto> {
  return apiFetch<ContactInfoDto>(
    '/api/admin/contact-info',
    { method: 'PUT', body: JSON.stringify(input) },
    token,
  )
}

// GET /api/contact-info — public (Footer fetch, cache max-age=300)
export async function getPublicContactInfo(): Promise<ContactInfoDto> {
  return apiFetch<ContactInfoDto>('/api/contact-info', {})
}
