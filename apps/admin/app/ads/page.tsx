'use client'
// C12 Ads-config — อนุมัติโฆษณา + กำหนด/แก้อัตรา + จัดตำแหน่ง
// Wired to real Backend API: /api/v1/ads?all=1 + /api/v1/ads/{id}/approve|reject
//   + /api/v1/admin/config/ad_rates (PUT to override rates per position)
// CMD admin-c12-cleanup · Backend ads routes merged @ 2aedce2 (origin/main)

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { api } from '@/lib/api'
import { Sidebar } from '@/components/sidebar'

// ── Types ─────────────────────────────────────────────────────────────────────

type AdStatus   = 'pending' | 'active' | 'rejected' | 'cancelled' | 'expired'
type AdType     = 'own_listing' | 'banner_shop' | 'banner_company'
type AdPosition = 'home_first_row' | 'module_first_row' | 'sidebar'

interface AdItem {
  id: string
  adType: AdType
  listingId: string | null
  position: AdPosition
  goldCost: number
  durationDays: number
  status: AdStatus
  rejectReason: string | null
  startDate: string | null
  endDate: string | null
  cancelledAt: string | null
  createdAt: string
}
interface AdsListResponse { items: AdItem[] }

// ad_rates: admin_config key='ad_rates', value=JSONB { home_first_row:n, module_first_row:n, sidebar:n }
type AdRates = Record<AdPosition, number>
const DEFAULT_RATES: AdRates = { home_first_row: 5, module_first_row: 3, sidebar: 3 }

// mock fallback — ใช้เมื่อ API ไม่พร้อม (Wave 1 · TD-06)
const MOCK_ADS: AdItem[] = [
  { id: 'mock-001', adType: 'own_listing',    listingId: 'LST-001', position: 'home_first_row',   goldCost: 35, durationDays: 7,  status: 'pending',  rejectReason: null, startDate: null, endDate: null, cancelledAt: null, createdAt: '2026-06-14T08:00:00Z' },
  { id: 'mock-002', adType: 'banner_shop',    listingId: null,       position: 'module_first_row', goldCost: 21, durationDays: 7,  status: 'active',   rejectReason: null, startDate: '2026-06-10T00:00:00Z', endDate: '2026-06-17T00:00:00Z', cancelledAt: null, createdAt: '2026-06-09T10:00:00Z' },
  { id: 'mock-003', adType: 'banner_company', listingId: null,       position: 'sidebar',          goldCost: 90, durationDays: 30, status: 'active',   rejectReason: null, startDate: '2026-06-01T00:00:00Z', endDate: '2026-07-01T00:00:00Z', cancelledAt: null, createdAt: '2026-05-31T12:00:00Z' },
  { id: 'mock-004', adType: 'own_listing',    listingId: 'LST-002', position: 'home_first_row',   goldCost: 35, durationDays: 7,  status: 'pending',  rejectReason: null, startDate: null, endDate: null, cancelledAt: null, createdAt: '2026-06-14T09:00:00Z' },
]

// ── Admin-created Ad (CRUD mock) ──────────────────────────────────────────────
interface AdminAd {
  id: string
  name: string
  adType: AdType
  position: AdPosition
  goldCostPerDay: number
  durationDays: number
  note: string
}
const DEFAULT_ADMIN_ADS: AdminAd[] = [
  { id: 'adm-001', name: 'Banner หน้าแรก (ตัวอย่าง)', adType: 'banner_company', position: 'home_first_row',   goldCostPerDay: 5,  durationDays: 14, note: 'โฆษณาเปิดตัว platform' },
  { id: 'adm-002', name: 'Banner ซ่อมรถ (ตัวอย่าง)', adType: 'banner_shop',    position: 'module_first_row', goldCostPerDay: 3,  durationDays: 7,  note: 'โปรโมต WeeeR ซ่อมรถ' },
]

// ── Labels ────────────────────────────────────────────────────────────────────

const POSITION_LABEL: Record<AdPosition, string> = {
  home_first_row:   'แถวแรกหน้าแรก',
  module_first_row: 'แถวแรกของโมดูล',
  sidebar:          'แถบข้าง',
}
const AD_TYPE_LABEL: Record<AdType, { label: string; color: string }> = {
  own_listing:    { label: 'ดันประกาศ',    color: 'bg-blue-50 text-blue-700' },
  banner_shop:    { label: 'Banner ร้าน',  color: 'bg-teal-50 text-teal-700' },
  banner_company: { label: 'Banner บริษัท',color: 'bg-orange-50 text-orange-700' },
}
const STATUS_LABEL: Record<AdStatus, { label: string; color: string }> = {
  pending:   { label: 'รออนุมัติ', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  active:    { label: 'กำลังแสดง', color: 'bg-admin-surface text-admin-primary border-admin-primary/30' },
  rejected:  { label: 'ปฏิเสธ',   color: 'bg-red-50 text-red-700 border-red-200' },
  cancelled: { label: 'ยกเลิก',   color: 'bg-gray-100 text-gray-500 border-gray-200' },
  expired:   { label: 'หมดอายุ',  color: 'bg-gray-100 text-gray-400 border-gray-200' },
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdsConfigPage() {
  const router = useRouter()
  const [ads,          setAds]         = useState<AdItem[]>([])
  const [rates,        setRates]       = useState<AdRates>(DEFAULT_RATES)
  const [loading,      setLoading]     = useState(true)
  const [actionId,     setActionId]    = useState<string | null>(null)
  const [activeTab,    setActiveTab]   = useState<'queue' | 'active' | 'rates' | 'manage'>('queue')
  const [toast,        setToast]       = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [rejectModal,  setRejectModal] = useState<AdItem | null>(null)
  const [rejectReason, setRejectReason]= useState('')
  const [editingPos,   setEditingPos]  = useState<AdPosition | null>(null)
  const [rateInput,    setRateInput]   = useState('')
  // Admin CRUD state
  const [adminAds,     setAdminAds]    = useState<AdminAd[]>(DEFAULT_ADMIN_ADS)
  const [adForm,       setAdForm]      = useState<Partial<AdminAd> | null>(null)
  const [editAdId,     setEditAdId]    = useState<string | null>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<AdsListResponse>('/ads?all=1')
      setAds(res.items)
      // load ad_rates override (ไม่ error ถ้ายังไม่มี key)
      try {
        const cfg = await api.get<{ value: AdRates }>('/admin/config/ad_rates')
        if (cfg.value && typeof cfg.value === 'object') {
          setRates(r => ({ ...r, ...cfg.value }))
        }
      } catch { /* key not set yet → use DEFAULT_RATES */ }
    } catch {
      console.warn('[mock fallback] ads page — using MOCK_ADS')
      setAds(MOCK_ADS)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    void loadData()
  }, [loadData, router])

  async function handleApprove(id: string) {
    setActionId(id)
    try {
      await api.post(`/ads/${id}/approve`, {})
      showToast('✅ อนุมัติโฆษณาแล้ว — พอยต์ทอง (Gold Point) ถูกตัดแล้ว')
      void loadData()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'อนุมัติไม่สำเร็จ', 'err')
    } finally { setActionId(null) }
  }

  async function handleReject() {
    if (!rejectModal) return
    setActionId(rejectModal.id)
    try {
      await api.post(`/ads/${rejectModal.id}/reject`, { reason: rejectReason.trim() || undefined })
      showToast('ปฏิเสธโฆษณาแล้ว — คืนพอยต์ทอง (Gold Point) ให้ผู้ลงโฆษณาแล้ว')
      setRejectModal(null)
      setRejectReason('')
      void loadData()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'ปฏิเสธไม่สำเร็จ', 'err')
    } finally { setActionId(null) }
  }

  async function saveRate(pos: AdPosition) {
    const val = Number(rateInput)
    if (!Number.isFinite(val) || val < 0) { showToast('กรุณากรอกตัวเลขที่ถูกต้อง', 'err'); return }
    try {
      const nextRates = { ...rates, [pos]: val }
      await api.put('/admin/config/ad_rates', {
        value: nextRates,
        description: 'C12 ad rates — admin-tunable Gold/วัน per position',
      })
      setRates(nextRates)
      setEditingPos(null)
      showToast(`✅ อัปเดตอัตรา ${POSITION_LABEL[pos]} → ${val} พอยต์ทอง/วัน`)
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'บันทึกอัตราไม่สำเร็จ', 'err')
    }
  }

  const pendingAds = ads.filter(a => a.status === 'pending')
  const activeAds  = ads.filter(a => a.status === 'active')

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 min-w-0">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">📢 จัดการโฆษณา (C12)</h1>
            {!loading && pendingAds.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200">
                ⚠ รออนุมัติ {pendingAds.length}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            อนุมัติ/ปฏิเสธโฆษณา · กำหนดอัตราค่าโฆษณา (Gold Point/วัน) · จัดตำแหน่งแสดงผล
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 flex gap-6 mb-6">
          {([
            { key: 'queue',  label: `คิวรออนุมัติ (${loading ? '…' : pendingAds.length})` },
            { key: 'active', label: `กำลังแสดง (${loading ? '…' : activeAds.length})` },
            { key: 'manage', label: `จัดการโฆษณา (${adminAds.length})` },
            { key: 'rates',  label: 'อัตราค่าโฆษณา' },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
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

        {loading ? (
          <div className="flex items-center gap-3 text-gray-500 py-20 justify-center">
            <span className="animate-spin text-xl">⟳</span> กำลังโหลด...
          </div>
        ) : (
          <>
            {/* Queue */}
            {activeTab === 'queue' && (
              <div className="space-y-3">
                {pendingAds.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 py-20 text-center text-gray-400">
                    <div className="text-4xl mb-2">✅</div><p>ไม่มีโฆษณารออนุมัติ</p>
                  </div>
                ) : pendingAds.map(ad => {
                  const tInfo = AD_TYPE_LABEL[ad.adType]
                  return (
                    <div key={ad.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tInfo.color}`}>{tInfo.label}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{POSITION_LABEL[ad.position]}</span>
                        </div>
                        {ad.listingId && <p className="text-xs text-gray-400 font-mono mb-1">listing: {ad.listingId}</p>}
                        <div className="flex gap-4 mt-1 text-xs text-gray-500">
                          <span>⏱ {ad.durationDays} วัน</span>
                          <span>💰 {ad.goldCost} พอยต์ทอง</span>
                          <span>📅 {new Date(ad.createdAt).toLocaleDateString('th-TH')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => void handleApprove(ad.id)} disabled={actionId === ad.id}
                          className="px-4 py-2 text-sm bg-admin-primary hover:bg-admin-dark disabled:opacity-40 text-white rounded-lg transition-colors">
                          {actionId === ad.id ? '...' : '✓ อนุมัติ'}
                        </button>
                        <button onClick={() => { setRejectModal(ad); setRejectReason('') }} disabled={actionId === ad.id}
                          className="px-4 py-2 text-sm bg-red-50 hover:bg-red-100 disabled:opacity-40 text-red-700 border border-red-200 rounded-lg transition-colors">
                          ✕ ปฏิเสธ
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Active */}
            {activeTab === 'active' && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {activeAds.length === 0 ? (
                  <div className="py-20 text-center text-gray-400"><div className="text-4xl mb-2">📢</div><p>ไม่มีโฆษณากำลังแสดงอยู่</p></div>
                ) : (
                  <table className="w-full text-sm">
                    <thead><tr className="text-gray-500 text-left border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3">ประเภท</th><th className="px-4 py-3">ตำแหน่ง</th>
                      <th className="px-4 py-3">พอยต์ทอง</th><th className="px-4 py-3">เริ่ม</th>
                      <th className="px-4 py-3">สิ้นสุด</th><th className="px-4 py-3">สถานะ</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeAds.map(ad => {
                        const s = STATUS_LABEL[ad.status]; const t = AD_TYPE_LABEL[ad.adType]
                        return (
                          <tr key={ad.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.color}`}>{t.label}</span></td>
                            <td className="px-4 py-3 text-gray-600">{POSITION_LABEL[ad.position]}</td>
                            <td className="px-4 py-3 font-medium text-gray-700">{ad.goldCost} pt</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{ad.startDate ? new Date(ad.startDate).toLocaleDateString('th-TH') : '—'}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{ad.endDate ? new Date(ad.endDate).toLocaleDateString('th-TH') : '—'}</td>
                            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${s.color}`}>{s.label}</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Manage (Admin CRUD) */}
            {activeTab === 'manage' && (
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">โฆษณาที่ Admin สร้างเอง (Wave 1 mock) · ซาก 1 รายการมีหลายชิ้นได้</p>
                  <button
                    onClick={() => { setAdForm({ adType: 'banner_shop', position: 'home_first_row', goldCostPerDay: 5, durationDays: 7, note: '' }); setEditAdId(null); }}
                    className="px-4 py-2 text-sm bg-admin-primary hover:bg-admin-dark text-white rounded-lg transition-colors"
                  >
                    + เพิ่มโฆษณา
                  </button>
                </div>

                {adForm !== null && (
                  <div className="bg-white rounded-xl border border-admin-primary/30 p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-admin-primary">{editAdId ? 'แก้ไขโฆษณา' : 'เพิ่มโฆษณาใหม่'}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500 block mb-1">ชื่อโฆษณา</label>
                        <input type="text" value={adForm.name ?? ''} onChange={e => setAdForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-admin-primary"
                          placeholder="ระบุชื่อโฆษณา..." />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">ประเภท</label>
                        <select value={adForm.adType ?? 'banner_shop'} onChange={e => setAdForm(f => ({ ...f, adType: e.target.value as AdType }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-admin-primary">
                          {(Object.entries(AD_TYPE_LABEL) as [AdType, {label:string}][]).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">ตำแหน่ง</label>
                        <select value={adForm.position ?? 'home_first_row'} onChange={e => setAdForm(f => ({ ...f, position: e.target.value as AdPosition }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-admin-primary">
                          {(Object.entries(POSITION_LABEL) as [AdPosition, string][]).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">อัตรา (pt/วัน)</label>
                        <input type="number" min={1} value={adForm.goldCostPerDay ?? 5} onChange={e => setAdForm(f => ({ ...f, goldCostPerDay: Number(e.target.value) }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:border-admin-primary" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">ระยะเวลา (วัน)</label>
                        <input type="number" min={1} value={adForm.durationDays ?? 7} onChange={e => setAdForm(f => ({ ...f, durationDays: Number(e.target.value) }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:border-admin-primary" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500 block mb-1">หมายเหตุ</label>
                        <input type="text" value={adForm.note ?? ''} onChange={e => setAdForm(f => ({ ...f, note: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-admin-primary"
                          placeholder="หมายเหตุ (ไม่บังคับ)" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        const name = (adForm.name ?? '').trim();
                        if (!name) { showToast('กรุณาระบุชื่อโฆษณา', 'err'); return; }
                        if (editAdId) {
                          setAdminAds(prev => prev.map(a => a.id === editAdId ? { ...a, ...adForm, name } as AdminAd : a));
                          showToast('แก้ไขโฆษณาสำเร็จ ✓');
                        } else {
                          setAdminAds(prev => [...prev, { id: `adm-${Date.now()}`, ...adForm, name } as AdminAd]);
                          showToast('เพิ่มโฆษณาสำเร็จ ✓');
                        }
                        setAdForm(null); setEditAdId(null);
                      }} className="px-4 py-2 text-sm bg-admin-primary hover:bg-admin-dark text-white rounded-lg transition-colors">
                        {editAdId ? 'บันทึก' : 'เพิ่ม'}
                      </button>
                      <button onClick={() => { setAdForm(null); setEditAdId(null); }}
                        className="px-4 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {adminAds.length === 0 ? (
                    <div className="py-12 text-center text-gray-400"><div className="text-3xl mb-2">📢</div><p>ยังไม่มีโฆษณา Admin</p></div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead><tr className="text-gray-500 text-left border-b border-gray-200 bg-gray-50 text-xs">
                        <th className="px-4 py-3">ชื่อโฆษณา</th><th className="px-4 py-3">ประเภท</th>
                        <th className="px-4 py-3">ตำแหน่ง</th><th className="px-4 py-3">ต้นทุน</th><th className="px-4 py-3"></th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {adminAds.map(ad => (
                          <tr key={ad.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">{ad.name}<br/><span className="text-xs text-gray-400 font-normal">{ad.note}</span></td>
                            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${AD_TYPE_LABEL[ad.adType].color}`}>{AD_TYPE_LABEL[ad.adType].label}</span></td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{POSITION_LABEL[ad.position]}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{ad.goldCostPerDay} pt/วัน × {ad.durationDays} วัน = {ad.goldCostPerDay * ad.durationDays} pt</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button onClick={() => { setAdForm({ ...ad }); setEditAdId(ad.id); }}
                                  className="text-xs text-admin-primary hover:text-admin-dark px-2 py-1">แก้ไข</button>
                                <button onClick={() => { setAdminAds(prev => prev.filter(a => a.id !== ad.id)); showToast('ลบโฆษณาแล้ว'); }}
                                  className="text-xs text-red-600 hover:text-red-700 px-2 py-1">ลบ</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <p className="text-xs text-gray-400">⚠️ Wave 1: ข้อมูลอยู่ใน memory — รีโหลดจะรีเซ็ต (Phase 4 = เชื่อมต่อ Backend)</p>
              </div>
            )}

            {/* Rates */}
            {activeTab === 'rates' && (
              <div className="space-y-4 max-w-xl">
                <p className="text-sm text-gray-600">
                  อัตราค่าโฆษณา (Gold Point/วัน) — บันทึกใน admin_config key{' '}
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">ad_rates</code>
                  <br /><span className="text-xs text-gray-400">การคำนวณ: goldCost = Math.round(rate × วัน)</span>
                </p>
                {(Object.entries(POSITION_LABEL) as [AdPosition, string][]).map(([pos, label]) => (
                  <div key={pos} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{label}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{pos}</p>
                    </div>
                    {editingPos === pos ? (
                      <div className="flex items-center gap-2">
                        <input type="number" min={0} step={1} value={rateInput}
                          onChange={e => setRateInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') void saveRate(pos); if (e.key === 'Escape') setEditingPos(null) }}
                          className="w-20 border rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:border-admin-primary"
                          autoFocus
                        />
                        <span className="text-xs text-gray-500">pt/วัน</span>
                        <button onClick={() => void saveRate(pos)} className="px-3 py-1.5 text-xs bg-admin-primary text-white rounded-lg hover:bg-admin-dark transition-colors">บันทึก</button>
                        <button onClick={() => setEditingPos(null)} className="px-3 py-1.5 text-xs text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิก</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-admin-primary">{rates[pos]}</span>
                        <span className="text-xs text-gray-500">pt/วัน</span>
                        <button onClick={() => { setEditingPos(pos); setRateInput(String(rates[pos])) }}
                          className="text-xs text-admin-primary hover:text-admin-dark border border-admin-primary/30 px-2.5 py-1 rounded-lg hover:bg-admin-surface transition-colors">
                          แก้ไข
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <div className="bg-admin-surface border border-admin-primary/20 rounded-xl p-4 text-xs text-gray-600">
                  <p className="font-medium text-admin-primary mb-1">💡 Ad Spec (C12)</p>
                  <ul className="space-y-1 list-disc ml-4">
                    <li>ตัด Gold Point ล่วงหน้าตอนซื้อ · Math.round · Admin อนุมัติ → active</li>
                    <li>ปฏิเสธ → คืน Gold Point เต็มจำนวน · ยกเลิก active → คืนตามสัดส่วนวัน</li>
                    <li>Banner ร้าน/บริษัท: ลูกค้าติดต่อ admin ผ่าน contact form</li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">ปฏิเสธโฆษณา</h2>
            <p className="text-sm text-gray-600">Gold Point <strong>{rejectModal.goldCost} pt</strong> จะถูกคืนให้ผู้ลงโฆษณาทันที</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">เหตุผล (ไม่บังคับ)</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                rows={3} placeholder="ระบุเหตุผลถ้ามี..."
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-admin-primary" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => void handleReject()} disabled={actionId !== null}
                className="flex-1 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg font-medium transition-colors">
                {actionId ? '...' : 'ยืนยัน ปฏิเสธ + คืน Gold'}
              </button>
              <button onClick={() => setRejectModal(null)} disabled={actionId !== null}
                className="py-2 px-4 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 text-sm px-5 py-3 rounded-xl shadow-xl border ${
          toast.type === 'ok' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>{toast.msg}</div>
      )}
    </div>
  )
}
