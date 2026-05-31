'use client'
// A2 Download-notify — แจ้งเตือนดาวน์โหลด (WP-A · CMD WP-A)

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'

// ── Types ─────────────────────────────────────────────────────────────────────

type NotifStatus = 'pending' | 'sent' | 'failed'
type NotifTarget = 'all' | 'weeer' | 'weeeu' | 'weeet'

interface DownloadNotif {
  id: string
  title: string
  message: string
  target: NotifTarget
  status: NotifStatus
  sentAt: string | null
  recipientCount: number
  appVersion?: string
  downloadUrl?: string
}

// ── Mock ──────────────────────────────────────────────────────────────────────

const MOCK_NOTIFS: DownloadNotif[] = [
  { id: 'dn-001', title: 'App3R v2.1 พร้อมให้ดาวน์โหลด', message: 'อัปเดตใหม่: แก้บั๊ก + ปรับ UI ให้ลื่นขึ้น · ดาวน์โหลดได้เลย', target: 'all', status: 'sent', sentAt: '2026-05-28 10:00', recipientCount: 12843, appVersion: '2.1.0', downloadUrl: 'https://app3r.com/download' },
  { id: 'dn-002', title: 'WeeeR v2.1 — ฟีเจอร์จัดการอะไหล่ใหม่', message: 'อัปเดต WeeeR: ระบบจัดการอะไหล่ B2B + หน้าใหม่ · ดาวน์โหลดได้เลย', target: 'weeer', status: 'sent', sentAt: '2026-05-28 10:05', recipientCount: 3201, appVersion: '2.1.0' },
  { id: 'dn-003', title: 'แจ้งเตือน maintenance วันที่ 1 มิ.ย.', message: 'ระบบจะหยุดชั่วคราว 02:00-04:00 น. วันที่ 1 มิ.ย. 2569', target: 'all', status: 'pending', sentAt: null, recipientCount: 0 },
  { id: 'dn-004', title: 'App3R v2.0 — เปิดตัว Scrap module', message: 'เพิ่ม Scrap module ใหม่ · ทิ้ง/รีไซเคิลเครื่องใช้ไฟฟ้าเก่าได้แล้ว', target: 'weeeu', status: 'failed', sentAt: '2026-05-20 09:00', recipientCount: 0 },
]

const TARGET_LABEL: Record<NotifTarget, string> = {
  all: 'ทุกผู้ใช้', weeer: 'WeeeR (ช่าง)', weeeu: 'WeeeU (ผู้ใช้)', weeet: 'WeeeT (ผู้ค้า)',
}
const STATUS_LABEL: Record<NotifStatus, { label: string; color: string }> = {
  pending: { label: 'รอส่ง', color: 'bg-yellow-50 text-yellow-700' },
  sent:    { label: 'ส่งแล้ว', color: 'bg-green-50 text-green-700' },
  failed:  { label: 'ส่งไม่สำเร็จ', color: 'bg-red-50 text-red-700' },
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DownloadNotifyPage() {
  const [notifs, setNotifs] = useState<DownloadNotif[]>(MOCK_NOTIFS)
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Create form state
  const [form, setForm] = useState({ title: '', message: '', target: 'all' as NotifTarget, appVersion: '', downloadUrl: '' })

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500) }

  function handleSend(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, status: 'sent', sentAt: new Date().toLocaleString('th-TH'), recipientCount: Math.floor(Math.random() * 10000) + 1000 } : n))
    showToast('✅ ส่งการแจ้งเตือนเรียบร้อย')
  }

  function handleCreate() {
    if (!form.title.trim() || !form.message.trim()) { showToast('กรุณากรอกชื่อและข้อความ'); return }
    const newNotif: DownloadNotif = {
      id: `dn-${Date.now()}`,
      title: form.title.trim(),
      message: form.message.trim(),
      target: form.target,
      status: 'pending',
      sentAt: null,
      recipientCount: 0,
      appVersion: form.appVersion.trim() || undefined,
      downloadUrl: form.downloadUrl.trim() || undefined,
    }
    setNotifs(prev => [newNotif, ...prev])
    setForm({ title: '', message: '', target: 'all', appVersion: '', downloadUrl: '' })
    setShowCreate(false)
    showToast('✅ สร้างการแจ้งเตือนแล้ว — กด "ส่ง" เพื่อส่งทันที')
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">📲 แจ้งเตือนดาวน์โหลด</h1>
            <p className="text-sm text-gray-500">ส่งการแจ้งเตือนอัปเดต / ดาวน์โหลด / maintenance ให้ผู้ใช้</p>
          </div>
          <button
            onClick={() => setShowCreate(s => !s)}
            className="px-4 py-2 text-sm bg-admin-primary hover:bg-admin-dark text-white rounded-lg transition-colors"
          >
            + สร้างการแจ้งเตือน
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 space-y-3">
            <h2 className="font-semibold text-gray-800 mb-3">สร้างการแจ้งเตือนใหม่</h2>
            <div>
              <label className="block text-xs text-gray-500 mb-1">หัวข้อ *</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="เช่น App3R v2.1 พร้อมให้ดาวน์โหลด"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-admin-primary" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ข้อความ *</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="รายละเอียดการแจ้งเตือน..."
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-admin-primary resize-none" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">กลุ่มเป้าหมาย</label>
                <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value as NotifTarget }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-admin-primary">
                  {(Object.entries(TARGET_LABEL) as [NotifTarget, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">เวอร์ชัน App</label>
                <input type="text" value={form.appVersion} onChange={e => setForm(f => ({ ...f, appVersion: e.target.value }))}
                  placeholder="เช่น 2.1.0"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-admin-primary" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Download URL</label>
                <input type="text" value={form.downloadUrl} onChange={e => setForm(f => ({ ...f, downloadUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-admin-primary" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleCreate} className="px-4 py-2 text-sm bg-admin-primary hover:bg-admin-dark text-white rounded-lg transition-colors">บันทึก</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิก</button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {notifs.map(n => {
            const s = STATUS_LABEL[n.status]
            return (
              <div key={n.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{TARGET_LABEL[n.target]}</span>
                      {n.appVersion && <span className="text-xs bg-admin-surface text-admin-primary px-2 py-0.5 rounded-full">v{n.appVersion}</span>}
                    </div>
                    <p className="font-semibold text-gray-900 mb-0.5">{n.title}</p>
                    <p className="text-sm text-gray-600">{n.message}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      {n.sentAt && <span>📅 ส่งเมื่อ {n.sentAt}</span>}
                      {n.recipientCount > 0 && <span>👥 {n.recipientCount.toLocaleString()} คน</span>}
                      {n.downloadUrl && <a href={n.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-admin-primary hover:underline">🔗 Download Link</a>}
                    </div>
                  </div>
                  {n.status === 'pending' && (
                    <button onClick={() => handleSend(n.id)} className="px-4 py-2 text-sm bg-admin-primary hover:bg-admin-dark text-white rounded-lg transition-colors shrink-0">
                      📤 ส่งเลย
                    </button>
                  )}
                  {n.status === 'failed' && (
                    <button onClick={() => handleSend(n.id)} className="px-4 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors shrink-0">
                      🔄 ลองใหม่
                    </button>
                  )}
                </div>
              </div>
            )
          })}
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
