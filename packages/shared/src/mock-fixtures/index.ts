/**
 * mock-fixtures/index.ts — Wave0 Deliverable #6
 *
 * Reference mock data derived from OpenAPI schemas (d2-openapi.yaml).
 * Used by frontend shells during Wave1 (before real API is live).
 *
 * Usage:
 *   import { mockUser, mockService, mockListing } from '@app3r/shared/src/mock-fixtures'
 *
 * Convention:
 *   - mockX     → single instance
 *   - mockXList → array of 3+ instances
 *   - Dates are ISO strings from a fixed reference time (2026-06-09T12:00:00Z)
 */

export * from './auth.fixtures'
export * from './profile.fixtures'
export * from './points.fixtures'
export * from './services.fixtures'
export * from './listings.fixtures'
export * from './offers.fixtures'
export * from './notifications.fixtures'
