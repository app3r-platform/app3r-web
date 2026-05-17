// API client for Sub-2 D-4 Testimonials endpoints
// Backend contract: Schema Plan Sec 5 (363813ec-7277-81dc-ac96-fd41d4fcdabf)
// Admin endpoints require JWT + admin role (Lesson #44).
// T+2: Backend merges endpoints → this client switches from pending → live.

import type {
  TestimonialDto,
  CreateTestimonialInput,
  UpdateTestimonialInput,
} from '@/lib/types/testimonials'

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
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// GET /api/admin/testimonials — list all incl. draft (Admin JWT)
export async function listTestimonials(
  token: string,
): Promise<TestimonialDto[]> {
  return apiFetch<TestimonialDto[]>('/api/admin/testimonials', {}, token)
}

// GET /api/admin/testimonials/:id — single (Admin JWT)
export async function getTestimonial(
  token: string,
  id: string,
): Promise<TestimonialDto> {
  return apiFetch<TestimonialDto>(
    `/api/admin/testimonials/${id}`,
    {},
    token,
  )
}

// POST /api/admin/testimonials — create (default draft) (Admin JWT)
export async function createTestimonial(
  token: string,
  input: CreateTestimonialInput,
): Promise<TestimonialDto> {
  return apiFetch<TestimonialDto>(
    '/api/admin/testimonials',
    { method: 'POST', body: JSON.stringify(input) },
    token,
  )
}

// PUT /api/admin/testimonials/:id — update (Admin JWT)
export async function updateTestimonial(
  token: string,
  id: string,
  input: UpdateTestimonialInput,
): Promise<TestimonialDto> {
  return apiFetch<TestimonialDto>(
    `/api/admin/testimonials/${id}`,
    { method: 'PUT', body: JSON.stringify(input) },
    token,
  )
}

// DELETE /api/admin/testimonials/:id — hard delete (Admin JWT)
export async function deleteTestimonial(
  token: string,
  id: string,
): Promise<void> {
  await apiFetch<void>(
    `/api/admin/testimonials/${id}`,
    { method: 'DELETE' },
    token,
  )
}

// POST /api/admin/testimonials/:id/publish — toggle draft ↔ published (Admin JWT)
export async function togglePublishTestimonial(
  token: string,
  id: string,
): Promise<TestimonialDto> {
  return apiFetch<TestimonialDto>(
    `/api/admin/testimonials/${id}/publish`,
    { method: 'POST' },
    token,
  )
}

// GET /api/testimonials — public (published only, sort_order ASC)
export async function getPublicTestimonials(): Promise<TestimonialDto[]> {
  return apiFetch<TestimonialDto[]>('/api/testimonials', {})
}
