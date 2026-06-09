/**
 * api-client.ts — App3R Typed API Client
 *
 * Wave0 Deliverable #5: Typed client generated from OpenAPI 3.1 spec
 * Source: apps/backend/docs/wave0/d2-openapi.yaml
 *
 * Status: WAVE0 DRAFT — aligned with contract, not yet backed by live DB.
 *         Use MockAdapter (d6-mock-fixtures) for development until Wave1 quality gate passes.
 *
 * Usage:
 *   import { createApiClient } from '@app3r/shared/src/api-client'
 *   const api = createApiClient({ baseUrl: 'http://localhost:8787/api/v1', getToken: () => '...' })
 *   const balance = await api.points.getBalance()
 *
 * Design: thin fetch wrapper — no dependency beyond native fetch API.
 * Each method matches exactly one OpenAPI path + method.
 */

// ── Types (derived from d2-openapi.yaml schemas) ──────────────────────────────

export interface ApiError {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: ApiError; status: number }

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface SignupRequest {
  email: string
  password: string
  role: 'weeeu' | 'weeer' | 'weeet'
}

export interface AuthResponse {
  access_token: string
  user: {
    id: string
    email: string
    role: string
  }
}

export interface OtpRequestBody {
  email: string
  type?: 'email_verify' | 'password_reset' | 'phone_verify'
}

export interface OtpRequestResponse {
  message: string
  expiresAt: string
  /** Only present in NODE_ENV=test|development */
  code?: string
}

export interface OtpVerifyBody {
  email: string
  code: string
  type?: 'email_verify' | 'password_reset' | 'phone_verify'
}

export interface OtpVerifyResponse {
  verified: boolean
}

// ── User/Shop Profile ─────────────────────────────────────────────────────────

export interface UserMeResponse {
  id: string
  email: string
  role: 'weeeu' | 'weeer' | 'weeet' | 'admin'
  displayName: string | null
  phone: string | null
  avatarUrl: string | null
  goldBalance: number
}

export interface UpdateUserMeBody {
  displayName?: string
  phone?: string
  avatarUrl?: string
}

export interface ShopMeResponse {
  userId: string
  shopName: string
  phone: string | null
  address: string | null
  description: string | null
}

export interface UpdateShopMeBody {
  shopName?: string
  phone?: string
  address?: string
  description?: string
}

// ── Points ────────────────────────────────────────────────────────────────────

export interface PointsBalanceResponse {
  gold: number
  silver: number
}

export interface PointsTopupRequest {
  amountThb: number
  reference?: string
  initiatedBy?: 'user' | 'admin' | 'payment_gateway'
}

export interface PointsTopupResponse {
  goldCredited: number
  balanceAfter: number
  rounded: boolean
}

export interface PointsWithdrawRequest {
  goldAmount: number
  bankReference?: string
}

export interface PointsWithdrawResponse {
  goldDebited: number
  balanceAfter: number
}

// ── Services / Jobs ───────────────────────────────────────────────────────────

export type ServiceStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled'
export type ServiceType = 'repair' | 'maintain' | 'resell' | 'scrap'

export interface ServiceResponse {
  id: string
  ownerId: string
  serviceType: ServiceType
  status: ServiceStatus
  title: string | null
  description: string | null
  pointAmount: number | null
  deadline: string | null
  listingMetaId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateServiceRequest {
  serviceType: ServiceType
  title?: string
  description?: string
  pointAmount?: number
  deadline?: string
}

export interface ServiceListResponse {
  items: ServiceResponse[]
  total: number
}

// ── Listings ──────────────────────────────────────────────────────────────────

export type ListingState =
  | 'draft'
  | 'announced'
  | 'receiving_offers'
  | 'offer_selected'
  | 'buyer_confirmed'
  | 'in_progress'
  | 'delivered'
  | 'inspection_period'
  | 'completed'
  | 'cancelled'
  | 'disputed'

export type ListingType = 'repair' | 'maintain' | 'resell' | 'scrap' | 'parts'

export interface ListingMetaResponse {
  listingId: string
  listingType: ListingType
  ownerId: string
  state: ListingState
  viewCount: number
  offerCount: number
  tambonId: number | null
  createdAt: string
  updatedAt: string
}

export interface ListingListQuery {
  listingType?: ListingType
  state?: ListingState
  tambonId?: number
  limit?: number
  offset?: number
}

export interface ListingListResponse {
  items: ListingMetaResponse[]
  total: number
}

export type ListingTransitionAction =
  | 'publish'
  | 'cancel'
  | 'mark_in_progress'
  | 'mark_delivered'
  | 'complete'
  | 'dispute'
  | 'approve_inspection'

export interface ListingTransitionRequest {
  action: ListingTransitionAction
  reason?: string
}

// ── Offers ────────────────────────────────────────────────────────────────────

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired'

export interface OfferResponse {
  id: string
  listingId: string
  buyerId: string
  price: number
  status: OfferStatus
  message: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateOfferRequest {
  listingId: string
  price: number
  message?: string
}

// ── Transfers ─────────────────────────────────────────────────────────────────

export type TransferStatus = 'pending' | 'approved' | 'rejected'

export interface TransferResponse {
  id: string
  userId: string
  amountThb: number
  goldRequested: number
  status: TransferStatus
  slipUrl: string | null
  adminNote: string | null
  createdAt: string
}

export interface CreateTransferRequest {
  amountThb: number
  slipUrl?: string
}

export interface TransferListResponse {
  items: TransferResponse[]
}

// ── Notifications ─────────────────────────────────────────────────────────────

export type NotificationChannel = 'websocket' | 'fcm' | 'apns' | 'email_fallback'

export interface NotificationResponse {
  id: string
  type: string
  title: string
  body: string | null
  channel: NotificationChannel
  sentAt: string
  readAt: string | null
}

export interface NotificationListResponse {
  items: NotificationResponse[]
  unreadCount: number
}

// ── Ads ───────────────────────────────────────────────────────────────────────

export type AdPlacement = 'banner_top' | 'sidebar' | 'feed_inline' | 'email_header'

export interface CreateAdRequest {
  listingId: string
  placement: AdPlacement
  startDate: string
  endDate: string
}

// ── Client Config ─────────────────────────────────────────────────────────────

export interface ApiClientConfig {
  /** Base URL, e.g. 'http://localhost:8787/api/v1' */
  baseUrl: string
  /** Returns current JWT access token (or null if unauthenticated) */
  getToken?: () => string | null | undefined
  /** Called when a 401 is received — e.g. trigger refresh flow */
  onUnauthorized?: () => void
}

// ── Internal fetch helper ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryParams = Record<string, any>

async function apiFetch<T>(
  config: ApiClientConfig,
  method: string,
  path: string,
  options?: {
    body?: unknown
    query?: QueryParams
    idempotencyKey?: string
  },
): Promise<ApiResult<T>> {
  const url = new URL(`${config.baseUrl}${path}`)

  if (options?.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v))
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token = config.getToken?.()
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (options?.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey

  const fetchOptions: RequestInit = { method, headers }
  if (options?.body !== undefined) {
    fetchOptions.body = JSON.stringify(options.body)
  }

  const res = await fetch(url.toString(), fetchOptions)

  if (res.status === 401) config.onUnauthorized?.()

  const data = (await res.json()) as T | ApiError

  if (res.ok) {
    return { ok: true, data: data as T, status: res.status }
  } else {
    return { ok: false, error: data as ApiError, status: res.status }
  }
}

// ── API Client Factory ────────────────────────────────────────────────────────

export function createApiClient(config: ApiClientConfig) {
  const f = <T>(
    method: string,
    path: string,
    options?: Parameters<typeof apiFetch>[3],
  ) => apiFetch<T>(config, method, path, options)

  return {
    // ── Auth ────────────────────────────────────────────────────────────────
    auth: {
      signup: (body: SignupRequest) =>
        f<AuthResponse>('POST', '/auth/signup', { body }),

      signin: (body: { email: string; password: string }) =>
        f<AuthResponse>('POST', '/auth/signin', { body }),

      refresh: () =>
        f<{ access_token: string }>('POST', '/auth/refresh'),

      logout: () =>
        f<{ message: string }>('POST', '/auth/logout'),

      me: () =>
        f<UserMeResponse>('GET', '/auth/me'),

      otpRequest: (body: OtpRequestBody) =>
        f<OtpRequestResponse>('POST', '/auth/otp-request', { body }),

      otpVerify: (body: OtpVerifyBody) =>
        f<OtpVerifyResponse>('POST', '/auth/otp-verify', { body }),
    },

    // ── Profile ─────────────────────────────────────────────────────────────
    profile: {
      getMe: () =>
        f<UserMeResponse>('GET', '/users/me'),

      updateMe: (body: UpdateUserMeBody) =>
        f<UserMeResponse>('PUT', '/users/me', { body }),

      getShopMe: () =>
        f<ShopMeResponse>('GET', '/shops/me'),

      updateShopMe: (body: UpdateShopMeBody) =>
        f<ShopMeResponse>('PUT', '/shops/me', { body }),
    },

    // ── Points ──────────────────────────────────────────────────────────────
    points: {
      getBalance: () =>
        f<PointsBalanceResponse>('GET', '/points/balance'),

      topup: (body: PointsTopupRequest, idempotencyKey: string) =>
        f<PointsTopupResponse>('POST', '/points/topup', { body, idempotencyKey }),

      withdraw: (body: PointsWithdrawRequest, idempotencyKey: string) =>
        f<PointsWithdrawResponse>('POST', '/points/withdraw', { body, idempotencyKey }),
    },

    // ── Services ────────────────────────────────────────────────────────────
    services: {
      list: (params?: { status?: ServiceStatus; serviceType?: ServiceType; limit?: number; offset?: number }) =>
        f<ServiceListResponse>('GET', '/services', { query: params }),

      create: (body: CreateServiceRequest) =>
        f<ServiceResponse>('POST', '/services', { body }),

      get: (id: string) =>
        f<ServiceResponse>('GET', `/services/${id}`),

      update: (id: string, body: Partial<CreateServiceRequest>) =>
        f<ServiceResponse>('PATCH', `/services/${id}`, { body }),

      delete: (id: string) =>
        f<void>('DELETE', `/services/${id}`),

      complete: (id: string) =>
        f<{ service: ServiceResponse; pointsReleased: number }>('POST', `/services/${id}/complete`),
    },

    // ── Listings ────────────────────────────────────────────────────────────
    listings: {
      list: (params?: ListingListQuery) =>
        f<ListingListResponse>('GET', '/listings', { query: params }),

      get: (id: string) =>
        f<ListingMetaResponse>('GET', `/listings/${id}`),

      update: (id: string, body: Partial<ListingMetaResponse>) =>
        f<ListingMetaResponse>('PATCH', `/listings/${id}`, { body }),

      transition: (id: string, body: ListingTransitionRequest) =>
        f<ListingMetaResponse>('POST', `/listings/${id}/transition`, { body }),

      getReviews: (id: string, params?: { limit?: number }) =>
        f<{ items: unknown[] }>('GET', `/listings/${id}/reviews`, { query: params }),

      submitReview: (id: string, body: { rating: number; comment?: string }) =>
        f<unknown>('POST', `/listings/${id}/reviews`, { body }),

      getQuestions: (id: string) =>
        f<{ items: unknown[] }>('GET', `/listings/${id}/questions`),

      postQuestion: (id: string, body: { text: string }) =>
        f<unknown>('POST', `/listings/${id}/questions`, { body }),
    },

    // ── Offers ──────────────────────────────────────────────────────────────
    offers: {
      create: (body: CreateOfferRequest) =>
        f<OfferResponse>('POST', '/offers', { body }),

      get: (id: string) =>
        f<OfferResponse>('GET', `/offers/${id}`),

      accept: (id: string) =>
        f<OfferResponse>('POST', `/offers/${id}/accept`),

      withdraw: (id: string) =>
        f<OfferResponse>('POST', `/offers/${id}/withdraw`),
    },

    // ── Transfers ────────────────────────────────────────────────────────────
    transfers: {
      create: (body: CreateTransferRequest) =>
        f<TransferResponse>('POST', '/transfers', { body }),

      list: () =>
        f<TransferListResponse>('GET', '/transfers'),

      approve: (id: string, body?: { note?: string }) =>
        f<TransferResponse>('POST', `/transfers/${id}/approve`, { body }),
    },

    // ── Notifications ────────────────────────────────────────────────────────
    notifications: {
      list: (params?: { unreadOnly?: boolean; limit?: number }) =>
        f<NotificationListResponse>('GET', '/notifications', { query: params }),

      markRead: (id: string) =>
        f<{ success: boolean }>('POST', `/notifications/${id}/read`),
    },

    // ── Ads ──────────────────────────────────────────────────────────────────
    ads: {
      list: (params?: { placement?: AdPlacement; limit?: number }) =>
        f<{ items: unknown[] }>('GET', '/ads', { query: params }),

      create: (body: CreateAdRequest) =>
        f<unknown>('POST', '/ads', { body }),

      cancel: (id: string) =>
        f<unknown>('POST', `/ads/${id}/cancel`),
    },

    // ── Location ─────────────────────────────────────────────────────────────
    location: {
      getProvinces: () =>
        f<{ items: unknown[] }>('GET', '/locations/provinces'),

      getNearbyTambons: (params: { lat: number; lng: number; radiusKm?: number }) =>
        f<{ items: unknown[] }>('GET', '/locations/tambons/nearby', { query: params }),
    },

    // ── Admin ─────────────────────────────────────────────────────────────────
    admin: {
      getConfig: () =>
        f<{ items: unknown[] }>('GET', '/admin/config'),

      updateConfig: (body: { key: string; value: string }) =>
        f<unknown>('PUT', '/admin/config', { body }),

      getModerationQueue: () =>
        f<{ items: unknown[] }>('GET', '/admin/moderation'),

      approveModeration: (id: string) =>
        f<unknown>('POST', `/admin/moderation/${id}/approve`),

      rejectModeration: (id: string, body?: { reason?: string }) =>
        f<unknown>('POST', `/admin/moderation/${id}/reject`, { body }),
    },
  }
}

export type App3RApiClient = ReturnType<typeof createApiClient>
