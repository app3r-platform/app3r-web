"use client";
/**
 * Platform Config — Wave1 Shell Placeholder
 * Screen: A-56b (platform-level config separate from module config)
 *
 * Uses api-client#admin.getConfig with RC-1 mock fallback.
 * Real implementation: Wave2 (Admin Config Management feature)
 *
 * TODO: REMOVE BEFORE PROD — mock fallback (TD-Wave2)
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { getAdminClient } from '@/lib/auth-client'
import { Sidebar } from '@/components/sidebar'

interface ConfigItem {
  key: string
  value: string
  updatedAt?: string
}

// mock fallback — ลบตอน Phase 4 (TD-06)
const MOCK_CONFIG: ConfigItem[] = [
  { key: 'platform.maintenance_mode', value: 'false', updatedAt: '2026-06-09T00:00:00Z' },
  { key: 'platform.fee.repair', value: '5', updatedAt: '2026-06-09T00:00:00Z' },
  { key: 'platform.fee.maintain', value: '5', updatedAt: '2026-06-09T00:00:00Z' },
  { key: 'platform.fee.resell', value: '8', updatedAt: '2026-06-09T00:00:00Z' },
  { key: 'platform.fee.scrap', value: '7', updatedAt: '2026-06-09T00:00:00Z' },
]

export default function PlatformConfigPage() {
  const router = useRouter()
  const [items, setItems] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }

    const client = getAdminClient()
    client.admin
      .getConfig()
      .then((result) => {
        if (result.ok && Array.isArray(result.data.items)) {
          setItems(result.data.items as ConfigItem[])
        } else {
          throw new Error('config not available')
        }
      })
      .catch((e) => {
        console.warn('[mock fallback] platform config:', e)
        setItems(MOCK_CONFIG)
      })
      .finally(() => setLoading(false))
  }, [router])

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-3xl">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">⚙️ ตั้งค่าแพลตฟอร์ม</h1>
          <p className="text-gray-500 text-sm mt-1">
            ค่าตั้งระดับแพลตฟอร์ม — Wave2 implementation
          </p>
          <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full">
            🔶 Wave1 Shell — read-only mock · เขียนจริงใน Wave2
          </span>
        </div>

        {/* Config table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700">🔑 รายการตั้งค่า</h2>
            <span className="text-xs text-gray-400">
              {loading ? 'กำลังโหลด…' : `${items.length} entries (mock)`}
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm animate-pulse">
              กำลังโหลด config…
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3">คีย์</th>
                  <th className="px-5 py-3">ค่า</th>
                  <th className="px-5 py-3 text-right">อัพเดตเมื่อ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={item.key}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-gray-700">
                      {item.key}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-medium">{item.value}</span>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-gray-400">
                      {item.updatedAt
                        ? new Date(item.updatedAt).toLocaleDateString('th-TH')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Wave2 note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            📋 Wave2 Scope (ยังไม่ implement)
          </h3>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>แก้ไขค่าตั้งค่าผ่าน PUT /admin/config</li>
            <li>บันทึกตรวจสอบ — ใครแก้/เมื่อไหร่/เก่า→ใหม่</li>
            <li>สลับโหมดปิดปรับปรุงระบบ</li>
            <li>จัดการตารางค่าธรรมเนียม (ค่าธรรมเนียมแพลตฟอร์มต่อโมดูล)</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
