/**
 * auth.fixtures.ts — Mock auth data
 * Aligned with: d2-openapi.yaml#/components/schemas/AuthResponse
 */
import type { AuthResponse, OtpRequestResponse, OtpVerifyResponse } from '../api-client'

export const mockAuthResponseWeeeu: AuthResponse = {
  access_token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXdlZWV1LTAwMSIsInJvbGUiOiJ3ZWVldSIsImlhdCI6MTc0OTQ3MjAwMCwiZXhwIjoxNzQ5NDczMDAwfQ.mock',
  user: {
    id: 'user-weeeu-001',
    email: 'weeeu@app3r.test',
    role: 'weeeu',
  },
}

export const mockAuthResponseWeeer: AuthResponse = {
  access_token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXdlZWVyLTAwMSIsInJvbGUiOiJ3ZWVlciIsImlhdCI6MTc0OTQ3MjAwMCwiZXhwIjoxNzQ5NDczMDAwfQ.mock',
  user: {
    id: 'user-weeer-001',
    email: 'weeer@app3r.test',
    role: 'weeer',
  },
}

export const mockAuthResponseWeeet: AuthResponse = {
  access_token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXdlZWV0LTAwMSIsInJvbGUiOiJ3ZWVldCIsImlhdCI6MTc0OTQ3MjAwMCwiZXhwIjoxNzQ5NDczMDAwfQ.mock',
  user: {
    id: 'user-weeet-001',
    email: 'weeet@app3r.test',
    role: 'weeet',
  },
}

export const mockOtpRequestResponse: OtpRequestResponse = {
  message: 'OTP sent to weeeu@app3r.test',
  expiresAt: '2026-06-09T12:10:00Z',
  code: '123456', // dev/test mode only
}

export const mockOtpVerifyResponse: OtpVerifyResponse = {
  verified: true,
}
