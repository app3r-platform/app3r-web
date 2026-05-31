'use client'
// A2 Ads-config — อนุมัติโฆษณา + กำหนด/แก้อัตรา + จัดตำแหน่ง + banner ร้าน/บริษัท
// C12 · Ad Spec Gen 100 (36f813ec-7277-81868c2cc933dd2fc972)
// Backend ads API ยังไม่พร้อม → mock + log (per CMD WP-A guardrail)
// DEPENDENCY-LOG: รอ Backend ตาราง ads + logic ตัด Gold Point (D75)

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'

// ── Types ────────────────────────────────────────────────────────────────────

type AdStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'expired'
type AdType = 'listing_boost' | 'banner_shop' | 'banner_company'
type AdPosition = 'first_row_home' | 'first_row_module' | 'sidebar'

interface AdRequest {
  id: string
  type: AdType
  position: AdPosition
  advertiser: string
  listingTitle?: string
  durationDays: number
  goldPoints: number
  status: AdStatus
  createdAt: string
  expiresAt?: string
}

interface AdRate {
  position: AdPosition
  goldPerDay: number
}

// ── Mock data ─────────────────────────────────────────────────────────────────
// ⚠️ MOCK — Backend ads API not ready (dependency-logged WP-A block log)

const MOCK_ADS: AdRequest[] = [
  { id: 'ad-001', type: 'listing_boost', position: 'first_row_module', advertiser: 'นิพนธ์ ใจดี', listingTitle: 'ตู้เย็น Samsung 2 ประตู สีเงิน 14 คิว', durationDays: 7, goldPoints: 21, status: 'pending', createdAt: '2026-05-30' },
  { id: 'ad-002', type: 'listing_boost', position: 'sidebar', advertiser: 'สมชาย พิมพ์ใจ', listingTitle: 'เครื่องซักผ้า LG Front-load 10kg', durationDays: 3, goldPoints: 9, status: 'pending', createdAt: '2026-05-30' },
  { id: 'ad-003', type: 'banner_shop', position: 'first_row_home', advertiser: 'ร้านช่างฝีมือ (แฟรนไชส์)', durationDays: 14, goldPoints: 70, status: 'approved', createdAt: '2026-05-25', expiresAt: '2026-06-08' },
  { id: 'ad-004', type: 'banner_company', position: 'sidebar', advertiser: 'บริษัท WeeeClean จำกัด', durationDays: 30, goldPoints: 90, status: 'active', createdAt: '2026-05-01', expiresAt: '2026-05-31' },
  { id: 'ad-005', type: 'listing_boost', position: 'first_row_module', advertiser: 'อนงค์ มีโชค', listingTitle: 'ทีวี Sony 55" OLED มือสอง', durationDays: 7, goldPoints: 21, status: 'rejected', createdAt: '2026-05-28' },
]

const DEFAULT_RATES: AdRate[] = [
  { position: 'first_row_home', goldPerDay: 5 },
  { position: 'first_row_module', goldPerDay: 3 },
  { position: 'sidebar', goldPerDay: 3 },
]

const AD_TYPE_LABEL: Record<AdType, string> = {
  listing_boost: 'ดันประกาศ',
  banner_shop: 'Banner ร้าน',
  banner_company: 'Banner บริษัท',
}
const AD_TYPE_COLOR: Record<AdType, string> = {
  listing_boost: 'bg-blue-50 text-blue-700',
  banner_shop: 'bg-teal-50 text-teal-700',
  banner_company: 'bg-orange-50 text-orange-700',
}
const POSITION_LABEL: Record<AdPosition, string> = {
  first_row_home: 'แถวแรกหน้าแรก',
  first_row_module: 'แถวแรกโมดูล',
  sidebar: 'Sidebar',
}
const STATUS_LABEL: Record<AdStatus, { label: string; color: string }> = {
  pending:  { label: 'รออนุมัติ', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  approved: { label: 'อนุมัติแล้ว', color: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'ปฏิเสธ', color: 'bg-red-50 text-red-700 border-red-200' },
  active:   { label: 'กำลังแสดง', color: 'bg-admin-surface text-admin-primary border-admin-primary/30' },
  expired:  { label: 'หมดอายุ', color: 'bg-gray-100 text-gray-500 border-gray-200' },
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdsConfigPage() {
  const [ads, setAds] = useState<AdRequest[]>(MOCK_ADS)
  const [rates, setRates] = useState<AdRate[]>(DEFAULT_RATES)
  const [activeTab, setActiveTab] = useState<'queue' | 'active' | 'rates'>('queue')
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [editingRate, setEditingRate] = useState<AdPosition | null>(null)
  const [rateInput, setRateInput] = useState<string>('')

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function handleApprove(id: string) {
    // Mock: approve → deduct gold points (real: Backend POST /api/v1/ads/:id/approve)
    setAds(prev => prev.map(a => a.id === id ? { ...a, status: 'active' as AdStatus, expiresAt: '(+' + prev.find(x => x.id === id)!.durationDays + 'วัน)' } : a))
    showToast('✅ อนุมัติโฆษณาแล้ว — พอยต์ทอง (Gold Point) จะถูกตัดเมื่อ Backend พร้อม')
  }

  function handleReject(id: string) {
    // Mock: reject → คืน Gold Point (real: Backend POST /api/v1/ads/:id/reject)
    setAds(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' as AdStatus } : a))
    showToast('ปฏิเสธโฆษณาแล้ว — พอยต์ทอง (Gold Point) จะคืนให้ผู้ซื้อเมื่อ Backend พร้อม', 'err')
  }

  function startEditRate(pos: AdPosition, current: number) {
    setEditingRate(pos)
    setRateInput(String(current))
  }

  function saveRate(pos: AdPosition) {
    const val = Number(rateInput)
    if (!val || val <= 0) { showToast('กรุณากรอกตัวเลขที่ถูกต้อง', 'err'); return }
    setRates(prev => prev.map(r => r.position === pos ? { ...r, goldPerDay: val } : r))
    setEditingRate(null)
    showToast(`✅ อัปเดตอัตรา ${POSITION_LABEL[pos]} → ${val} พอยต์ทอง/วัน`)
  }

  const pendingAds = ads.filter(a => a.status === 'pending')
  const activeAds  = ads.filter(a => a.status === 'active' || a.status === 'approved')

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 min-w-0">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">📢 จัดการโฆษณา (Ads Config)</h1>
            {pendingAds.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200">
                ⚠ รออนุมัติ {pendingAds.length}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">C12 · Ad Spec Gen 100 — อนุมัติโฆษณา · อัตรา · จัดตำแหน่ง · banner ร้าน/บริษัท</p>
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
            <span>⚠️</span>
            <span>Mock data — Backend ads API ยังไม่พร้อม (dependency-logged)</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 flex gap-6 mb-6">
          {([
            { key: 'queue', label: `คิวรออนุมัติ (${pendingAds.length})` },
            { key: 'active', label: `กำลังแสดง (${activeAds.length})` },
            { key: 'rates', label: 'อัตราค่าโฆษณา' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? 'border-admin-primary text-admin-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Queue tab */}
        {activeTab === 'queue' && (
          <div className="space-y-3">
            {pendingAds.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 py-20 text-center text-gray-400">
                <div className="text-4xl mb-2">✅</div>
                <p>ไม่มีคำขอโฆษณาที่รออนุมัติ</p>
              </div>
            ) : pendingAds.map(ad => (
              <div key={ad.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${AD_TYPE_COLOR[ad.type]}`}>
                      {AD_TYPE_LABEL[ad.type]}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {POSITION_LABEL[ad.position]}
                    </span>
                  </div>
                  {ad.listingTitle && <p className="font-medium text-gray-900 mb-1">{ad.listingTitle}</p>}
                  <p className="text-sm text-gray-600">ผู้ลงโฆษณา: <span className="font-medium">{ad.advertiser}</span></p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>⏱ {ad.durationDays} วัน</span>
                    <span>💰 {ad.goldPoints} พอยต์ทอง</span>
                    <span>📅 {ad.createdAt}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(ad.id)}
                    className="px-4 py-2 text-sm bg-admin-primary hover:bg-admin-dark text-white rounded-lg transition-colors"
                  >
                    ✓ อนุมัติ
                  </button>
                  <button
                    onClick={() => handleReject(ad.id)}
                    className="px-4 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors"
                  >
                    ✕ ปฏิเสธ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active tab */}
        {activeTab === 'active' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {activeAds.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <div className="text-4xl mb-2">📢</div>
                <p>ไม่มีโฆษณาที่กำลังแสดงอยู่</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-left border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3">ผู้ลงโฆษณา</th>
                    <th className="px-4 py-3">ประเภท</th>
                    <th className="px-4 py-3">ตำแหน่ง</th>
                    <th className="px-4 py-3">พอยต์ทอง</th>
                    <th className="px-4 py-3">หมดอายุ</th>
                    <th className="px-4 py-3">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeAds.map(ad => {
                    const s = STATUS_LABEL[ad.status]
                    return (
                      <tr key={ad.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{ad.advertiser}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${AD_TYPE_COLOR[ad.type]}`}>
                            {AD_TYPE_LABEL[ad.type]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{POSITION_LABEL[ad.position]}</td>
                        <td className="px-4 py-3 text-gray-700">{ad.goldPoints} pt</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{ad.expiresAt ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${s.color}`}>
                            {s.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Rates tab */}
        {activeTab === 'rates' && (
          <div className="space-y-4 max-w-xl">
            <p className="text-sm text-gray-600">อัตราเริ่มต้น (default) — Admin แก้ได้ · Backend ตัด Gold Point ตาม D75 เมื่อพร้อม</p>
            {rates.map(r => (
              <div key={r.position} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">{POSITION_LABEL[r.position]}</p>
                  <p className="text-xs text-gray-500 mt-0.5">ตำแหน่ง: {r.position}</p>
                </div>
                {editingRate === r.position ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min={1} value={rateInput}
                      onChange={e => setRateInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveRate(r.position); if (e.key === 'Escape') setEditingRate(null) }}
                      className="w-20 border rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:border-admin-primary"
                      autoFocus
                    />
                    <span className="text-xs text-gray-500">pt/วัน</span>
                    <button onClick={() => saveRate(r.position)} className="px-3 py-1.5 text-xs bg-admin-primary text-white rounded-lg hover:bg-admin-dark transition-colors">บันทึก</button>
                    <button onClick={() => setEditingRate(null)} className="px-3 py-1.5 text-xs text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิก</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-admin-primary">{r.goldPerDay}</span>
                    <span className="text-xs text-gray-500">พอยต์ทอง/วัน</span>
                    <button
                      onClick={() => startEditRate(r.position, r.goldPerDay)}
                      className="text-xs text-admin-primary hover:text-admin-dark border border-admin-primary/30 px-2.5 py-1 rounded-lg hover:bg-admin-surface transition-colors"
                    >
                      แก้ไข
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div className="bg-admin-surface border border-admin-primary/20 rounded-xl p-4 text-xs text-gray-600">
              <p className="font-medium text-admin-primary mb-1">💡 หมายเหตุ (Ad Spec Gen 100)</p>
              <ul className="space-y-1 list-disc ml-4">
                <li>ตัด Gold Point ล่วงหน้าตอนซื้อ → คืนถ้า Admin ไม่อนุมัติ</li>
                <li>การปัดเศษตาม D75 (Math.round + audit log)</li>
                <li>Banner ร้าน/บริษัท: ติดต่อ Admin ผ่าน contact form — Admin ลงให้เอง</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 text-sm px-5 py-3 rounded-xl shadow-xl border ${
          toast.type === 'ok' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
