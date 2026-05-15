/**
 * e2e/shared/auth.ts — Sub-CMD-9: Auth helpers for E2E tests
 *
 * Wraps API calls with Bearer token automatically.
 * Used by all E2E specs that need authenticated requests.
 */
import type { APIRequestContext } from '@playwright/test'

/**
 * Make an authenticated GET request
 */
export async function authGet(
  api: APIRequestContext,
  path: string,
  token: string,
  params?: Record<string, string>,
) {
  const url = params
    ? `${path}?${new URLSearchParams(params).toString()}`
    : path
  return api.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

/**
 * Make an authenticated POST request
 */
export async function authPost(
  api: APIRequestContext,
  path: string,
  token: string,
  data: unknown,
) {
  return api.post(path, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  })
}

/**
 * Make an authenticated PATCH request
 */
export async function authPatch(
  api: APIRequestContext,
  path: string,
  token: string,
  data: unknown,
) {
  return api.patch(path, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  })
}
