"use client";
/**
 * WalletDisplay — read-only platform balance display (Wave1 shell)
 *
 * Uses api-client#points.getBalance with RC-1 mock fallback.
 * Source: packages/shared/src/mock-fixtures/points.fixtures.ts (D6)
 *
 * NOTE: admin sees PLATFORM-level balances (not personal wallet).
 * Real platform balance endpoint (Wave2): /admin/platform/balance
 * Interim: reuse /points/balance with super-admin JWT (read-only).
 *
 * TODO: REMOVE BEFORE PROD — swap mock for real platform balance endpoint (TD-Wave2)
 */
import { useEffect, useState } from 'react'
import { getAdminClient } from '@/lib/auth-client'
import type { PointsBalanceResponse } from '@app3r/shared/src/api-client'
import { mockPointsBalanceLarge } from '@app3r/shared/src/mock-fixtures'

// mock fallback — ลบตอน Phase 4 (TD-06)
const MOCK_PLATFORM_BALANCE: PointsBalanceResponse = mockPointsBalanceLarge

export function WalletDisplay() {
  const [balance, setBalance] = useState<PointsBalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = getAdminClient()
    client.points
      .getBalance()
      .then((result) => {
        if (result.ok) setBalance(result.data)
        else throw new Error(result.error.error.code)
      })
      .catch((e) => {
        console.warn('[mock fallback] wallet balance:', e)
        setBalance(MOCK_PLATFORM_BALANCE)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex gap-3">
        <div className="animate-pulse h-14 w-28 bg-yellow-50 border border-yellow-200 rounded-lg" />
        <div className="animate-pulse h-14 w-28 bg-gray-100 border border-gray-200 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="flex gap-3 items-center">
      {/* Gold balance */}
      <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
        <span className="text-lg leading-none">🥇</span>
        <div>
          <p className="text-xs text-yellow-700 font-medium leading-none mb-0.5">Gold (Platform)</p>
          <p className="text-sm font-bold text-yellow-900 leading-none">
            {balance?.gold.toLocaleString() ?? '—'}
          </p>
        </div>
      </div>
      {/* Silver balance */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        <span className="text-lg leading-none">🥈</span>
        <div>
          <p className="text-xs text-gray-600 font-medium leading-none mb-0.5">Silver (Platform)</p>
          <p className="text-sm font-bold text-gray-900 leading-none">
            {balance?.silver.toLocaleString() ?? '—'}
          </p>
        </div>
      </div>
      <span className="text-xs text-gray-400 italic ml-1">mock</span>
    </div>
  )
}
