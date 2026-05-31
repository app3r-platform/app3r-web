'use client'
// A2 Products Curate — ban/pin/curate รายการสินค้า (C10 override/C13 · W-17)
// WP-A · Advisor Gen 104 · CMD WP-A

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'

// ── Types ────────────────────────────────────────────────────────────────────

type ProductStatus = 'active' | 'pinned' | 'banned' | 'hidden'
type ProductType = 'resell' | 'scrap' | 'parts' | 'repair' | 'maintain'

interface Product {
  id: string
  title: string
  type: ProductType
  seller: string
  price: number
  status: ProductStatus
  views: number
  createdAt: string
  flagCount: number
  isPinned: boolean
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PRODUCTS: Product[] = [
  { id: 'p-001', title: 'ตู้เย็น Samsung 2 ประตู สีเงิน 14 คิว', type: 'resell', seller: 'นิพนธ์ ใจดี', price: 4300, status: 'active', views: 312, createdAt: '2026-05-20', flagCount: 0, isPinned: false },
  { id: 'p-002', title: 'เครื่องซักผ้า LG Front-load 10kg', type: 'resell', seller: 'สมชาย พิมพ์ใจ', price: 8500, status: 'pinned', views: 891, createdAt: '2026-05-18', flagCount: 0, isPinned: true },
  { id: 'p-003', title: 'แอร์ Mitsubishi 12000 BTU แยกส่วน', type: 'resell', seller: 'พรทิพย์ อุดม', price: 6200, status: 'active', views: 214, createdAt: '2026-05-22', flagCount: 2, isPinned: false },
  { id: 'p-004', title: 'ซากเครื่องซักผ้า Samsung — อะไหล่ดี', type: 'scrap', seller: 'วิทยา สิงห์', price: 800, status: 'active', views: 45, createdAt: '2026-05-25', flagCount: 0, isPinned: false },
  { id: 'p-005', title: 'บอร์ดควบคุมตู้เย็น Hitachi', type: 'parts', seller: 'ช่างมานะ', price: 1200, status: 'active', views: 88, createdAt: '2026-05-21', flagCount: 0, isPinned: false },
  { id: 'p-006', title: 'เครื่องปั่น Philips — ชำรุดบางส่วน ขายซาก', type: 'scrap', seller: 'อนงค์ มีโชค', price: 250, status: 'banned', views: 23, createdAt: '2026-05-15', flagCount: 5, isPinned: false },
  { id: 'p-007', title: 'ทีวี Sony 55" OLED มือสอง', type: 'resell', seller: 'กิตติ ศรีวงศ์', price: 22000, status: 'pinned', views: 1203, createdAt: '2026-05-10', flagCount: 0, isPinned: true },
  { id: 'p-008', title: 'อะไหล่คอมเพรสเซอร์แอร์ (ทุกยี่ห้อ)', type: 'parts', seller: 'ช่างอนันต์', price: 3500, status: 'active', views: 167, createdAt: '2026-05-23', flagCount: 1, isPinned: false },
]

const TYPE_LABEL: Record<ProductType, string> = {
  resell: 'ขายมือสอง', scrap: 'ซากเครื่อง', parts: 'อะไหล่', repair: 'ซ่อม', maintain: 'บำรุง',
}
const TYPE_COLOR: Record<ProductType, string> = {
  resell: 'bg-blue-50 text-blue-700',
  scrap: 'bg-orange-50 text-orange-700',
  parts: 'bg-teal-50 text-teal-700',
  repair: 'bg-yellow-50 text-yellow-700',
  maintain: 'bg-green-50 text-green-700',
}
const STATUS_LABEL: Record<ProductStatus, string> = {
  active: 'เปิดใช้งาน', pinned: 'ปักหมุด', banned: 'บล็อก', hidden: 'ซ่อน',
}
const STATUS_COLOR: Record<ProductStatus, string> = {
  active: 'bg-green-50 text-green-700',
  pinned: 'bg-admin-surface text-admin-primary',
  banned: 'bg-red-50 text-red-700',
  hidden: 'bg-gray-100 text-gray-500',
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsCuratePage() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS)
  const [filterType, setFilterType] = useState<ProductType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<ProductStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function setStatus(id: string, status: ProductStatus) {
    setProducts(ps => ps.map(p => p.id === id ? { ...p, status, isPinned: status === 'pinned' } : p))
    const labels: Record<ProductStatus, string> = { active: 'เปิดใช้งาน', pinned: 'ปักหมุดแล้ว', banned: 'บล็อกแล้ว', hidden: 'ซ่อนแล้ว' }
    showToast(`✅ ${labels[status]}`)
  }

  function togglePin(id: string) {
    const p = products.find(p => p.id === id)
    if (!p) return
    const next: ProductStatus = p.status === 'pinned' ? 'active' : 'pinned'
    setStatus(id, next)
  }

  const filtered = products.filter(p => {
    if (filterType !== 'all' && p.type !== filterType) return false
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.seller.includes(search)) return false
    return true
  })

  const counts = {
    total: products.length,
    pinned: products.filter(p => p.status === 'pinned').length,
    banned: products.filter(p => p.status === 'banned').length,
    flagged: products.filter(p => p.flagCount > 0).length,
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">📦 จัดการสินค้า (Curate)</h1>
          <p className="text-sm text-gray-500">C10 override · C13 CMS · W-17 — ban/pin/curate รายการสินค้าในแพลตฟอร์ม</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'รายการทั้งหมด', value: counts.total, color: 'text-gray-700' },
            { label: 'ปักหมุด', value: counts.pinned, color: 'text-admin-primary' },
            { label: 'บล็อก', value: counts.banned, color: 'text-red-600' },
            { label: 'ถูกรายงาน', value: counts.flagged, color: 'text-orange-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า / ผู้ขาย"
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:border-admin-primary"
          />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as ProductType | 'all')}
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-admin-primary"
          >
            <option value="all">ทุกประเภท</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as ProductStatus | 'all')}
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-admin-primary"
          >
            <option value="all">ทุกสถานะ</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-left border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3">สินค้า</th>
                <th className="px-4 py-3">ประเภท</th>
                <th className="px-4 py-3">ผู้ขาย</th>
                <th className="px-4 py-3">ราคา</th>
                <th className="px-4 py-3">วิว</th>
                <th className="px-4 py-3">Flag</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-gray-400">
                    <div className="text-3xl mb-2">📭</div>
                    <p>ไม่พบสินค้า</p>
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p.status === 'banned' ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 max-w-[240px]">
                    <p className="font-medium text-gray-900 truncate">{p.title}</p>
                    <p className="text-xs text-gray-400">{p.id} · {p.createdAt}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[p.type]}`}>
                      {TYPE_LABEL[p.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.seller}</td>
                  <td className="px-4 py-3 font-medium">{p.price.toLocaleString()} ฿</td>
                  <td className="px-4 py-3 text-gray-500">{p.views.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {p.flagCount > 0 ? (
                      <span className="text-xs text-red-600 font-semibold">🚩 {p.flagCount}</span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => togglePin(p.id)}
                        title={p.isPinned ? 'ถอนหมุด' : 'ปักหมุด'}
                        className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                          p.isPinned
                            ? 'bg-admin-surface text-admin-primary hover:bg-admin-primary hover:text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-admin-surface hover:text-admin-primary'
                        }`}
                      >
                        📌
                      </button>
                      {p.status !== 'hidden' && (
                        <button
                          onClick={() => setStatus(p.id, 'hidden')}
                          title="ซ่อน"
                          className="px-2 py-1 text-xs rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                          👁
                        </button>
                      )}
                      {p.status !== 'active' && (
                        <button
                          onClick={() => setStatus(p.id, 'active')}
                          title="เปิดใช้งาน"
                          className="px-2 py-1 text-xs rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                        >
                          ✓
                        </button>
                      )}
                      {p.status !== 'banned' && (
                        <button
                          onClick={() => setStatus(p.id, 'banned')}
                          title="บล็อก"
                          className="px-2 py-1 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          🚫
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Curate rules hint */}
        <div className="mt-4 bg-admin-surface border border-admin-primary/20 rounded-xl p-4 text-sm text-admin-primary">
          <p className="font-medium mb-1">📌 กฎการจัดการสินค้า (C10/C13)</p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc ml-4">
            <li>ปักหมุด (pin): ดันสินค้าขึ้นแถวแรกของโมดูลนั้น — เหมาะสินค้าคุณภาพสูง</li>
            <li>ซ่อน (hide): ซ่อนจากหน้าแสดงผล แต่ยังค้นหาได้ภายใน Admin</li>
            <li>บล็อก (ban): หยุดแสดงผลทันที + แจ้งผู้ขาย — ใช้กรณีละเมิดกฎ</li>
            <li>Flag ≥ 3: ควรตรวจสอบ — อาจมีเนื้อหาไม่เหมาะสม</li>
          </ul>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-50 border border-green-200 text-green-700 text-sm px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
