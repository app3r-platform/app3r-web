/**
 * points.fixtures.ts — Mock point balance + operation data
 * Aligned with: d2-openapi.yaml#/components/schemas/PointsBalanceResponse, etc.
 */
import type {
  PointsBalanceResponse,
  PointsTopupResponse,
  PointsWithdrawResponse,
} from '../api-client'

export const mockPointsBalanceZero: PointsBalanceResponse = {
  gold: 0,
  silver: 0,
}

export const mockPointsBalanceNormal: PointsBalanceResponse = {
  gold: 350,
  silver: 120,
}

export const mockPointsBalanceLarge: PointsBalanceResponse = {
  gold: 10000,
  silver: 2500,
}

/** Topup 100 THB → 100 Gold (no rounding) */
export const mockTopupExact: PointsTopupResponse = {
  goldCredited: 100,
  balanceAfter: 450,
  rounded: false,
}

/** Topup 50.70 THB → 51 Gold (D75 rounding up) */
export const mockTopupRoundedUp: PointsTopupResponse = {
  goldCredited: 51,
  balanceAfter: 401,
  rounded: true,
}

/** Topup 10.40 THB → 10 Gold (D75 rounding down) */
export const mockTopupRoundedDown: PointsTopupResponse = {
  goldCredited: 10,
  balanceAfter: 360,
  rounded: true,
}

export const mockWithdraw50: PointsWithdrawResponse = {
  goldDebited: 50,
  balanceAfter: 300,
}

export const mockWithdrawInsufficientError = {
  error: {
    code: 'INSUFFICIENT_GOLD',
    message: 'Insufficient Gold balance. Have 350, need 999999',
  },
}
