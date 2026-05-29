'use client'
// D84 — Bad Record Policy config panel + audit log viewer
// Scope: HUB Gen 37 (Ruling Gen 101) · spec 36e813ec-7277-8138-ae02-c260a5c2f79e
// Admin ปรับ threshold/window/cool-down + เปิด/ปิดแต่ละระดับ · บันทึกประวัติ (ใครแก้/เมื่อไหร่/เก่า→ใหม่)

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { Sidebar } from '@/components/sidebar'
import {
  getAdminConfig,
  putAdminConfig,
  getAdminConfigAudit,
} from '@/lib/api/admin-config'
import {
  BAD_RECORD_POLICY_KEY,
  DEFAULT_BAD_RECORD_POLICY,
  type AdminConfigEntry,
  type AdminConfigAuditEntry,
  type BadRecordPolicy,
  type BadRecordTier,
} from '@/lib/types/admin-config'

const TIER_LABELS = ['ระดับ 1', 'ระดับ 2', 'ระดับ 3', 'ระดับ 4']

function clampInt(v: string): number {
  const n = Math.floor(Number(v))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export default function ConfigPage() {
  const router = useRouter()

  const [entry, setEntry] = useState<AdminConfigEntry<BadRecordPolicy> | null>(null)
  const [draft, setDraft] = useState<BadRecordPolicy | null>(null)
  const [saved, setSaved] = useState<BadRecordPolicy | null>(null)
  const [audit, setAudit] = useState<AdminConfigAuditEntry[]>([])
  const [showAudit, setShowAudit] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const showToast = useCallback((msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const loadAudit = useCallback(async () => {
    try {
      const res = await getAdminConfigAudit(BAD_RECORD_POLICY_KEY)
      setAudit(res.items)
    } catch {
      // audit ไม่ critical — เงียบได้
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    getAdminConfig<BadRecordPolicy>(BAD_RECORD_POLICY_KEY)
      .then((e) => {
        setEntry(e)
        setSaved(e.value)
        setDraft(e.value)
      })
      .catch(() => {
        // ยังไม่ seed → เริ่มจาก default (ยังบันทึกสร้าง key ได้)
        setEntry(null)
        setSaved(DEFAULT_BAD_RECORD_POLICY)
        setDraft(DEFAULT_BAD_RECORD_POLICY)
      })
      .finally(() => setLoading(false))
    void loadAudit()
  }, [router, loadAudit])

  const dirty = draft !== null && saved !== null && JSON.stringify(draft) !== JSON.stringify(saved)

  function updateTier(idx: number, patch: Partial<BadRecordTier>) {
    setDraft((prev) => {
      if (!prev) return prev
      const tiers = prev.tiers.map((t, i) => (i === idx ? { ...t, ...patch } : t))
      return { ...prev, tiers }
    })
  }

  function updatePolicy(patch: Partial<BadRecordPolicy>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  async function handleSave() {
    if (!draft || !dirty) return
    setSaving(true)
    try {
      const updated = await putAdminConfig<BadRecordPolicy>(
        BAD_RECORD_POLICY_KEY,
        draft,
        'D84 Bad Record Policy — admin-tunable threshold/window/cool-down',
      )
      setEntry(updated)
      setSaved(updated.value)
      setDraft(updated.value)
      showToast('บันทึกนโยบาย Bad Record สำเร็จ ✓', 'ok')
      void loadAudit()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ', 'err')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setDraft(saved)
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />

      <main className="flex-1 p-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-1">ตั้งค่าระบบ — นโยบาย Bad Record (D84)</h1>
        <p className="text-gray-500 text-sm mb-6">
          ปรับเกณฑ์การระงับลงประกาศ · จำนวนครั้ง (threshold) · ช่วงเวลา (window) · cool-down — เปิด/ปิดได้แต่ละระดับ
        </p>

        {loading ? (
          <div className="flex items-center gap-3 text-gray-500 py-20">
            <span className="animate-spin text-xl">⟳</span> กำลังโหลด...
          </div>
        ) : draft ? (
          <div className="space-y-6">
            {/* meta */}
            <div className="text-xs text-gray-500">
              {entry ? (
                <>
                  แก้ไขล่าสุดโดย <span className="font-medium text-gray-700">{entry.updatedBy ?? '—'}</span>
                  {' · '}
                  {new Date(entry.updatedAt).toLocaleString('th-TH')}
                </>
              ) : (
                <span className="text-yellow-700">⚠️ ยังไม่มีค่าในระบบ — แสดงค่าเริ่มต้น (กดบันทึกเพื่อสร้าง)</span>
              )}
            </div>

            {/* suspend tiers */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {draft.tiers.map((tier, idx) => {
                const enabled = tier.enabled ?? true
                return (
                  <div
                    key={idx}
                    className={`px-5 py-4 ${idx !== 0 ? 'border-t border-gray-200' : ''} ${
                      enabled ? '' : 'opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{TIER_LABELS[idx] ?? `ระดับ ${idx + 1}`}</span>
                        <span className="text-xs text-gray-500">
                          ≥ {tier.count} ครั้ง / {tier.windowDays} วัน → ระงับ {tier.durationDays} วัน
                        </span>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => updateTier(idx, { enabled: e.target.checked })}
                          className="accent-admin-primary w-4 h-4"
                        />
                        {enabled ? 'เปิด' : 'ปิด'}
                      </label>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <NumField
                        label="threshold (ครั้ง)"
                        value={tier.count}
                        disabled={!enabled}
                        onChange={(v) => updateTier(idx, { count: clampInt(v) })}
                      />
                      <NumField
                        label="window (วัน)"
                        value={tier.windowDays}
                        disabled={!enabled}
                        onChange={(v) => updateTier(idx, { windowDays: clampInt(v) })}
                      />
                      <NumField
                        label="ระงับ (วัน)"
                        value={tier.durationDays}
                        disabled={!enabled}
                        onChange={(v) => updateTier(idx, { durationDays: clampInt(v) })}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* lifetime escalate */}
            <div className={`bg-white rounded-xl border border-gray-200 px-5 py-4 ${
              (draft.lifetimeEscalateEnabled ?? true) ? '' : 'opacity-50'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">ระดับสูงสุด — Escalate</span>
                  <span className="text-xs text-gray-500">
                    ≥ {draft.lifetimeEscalateAt} ครั้ง (lifetime) → ส่ง Super Admin
                  </span>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.lifetimeEscalateEnabled ?? true}
                    onChange={(e) => updatePolicy({ lifetimeEscalateEnabled: e.target.checked })}
                    className="accent-admin-primary w-4 h-4"
                  />
                  {(draft.lifetimeEscalateEnabled ?? true) ? 'เปิด' : 'ปิด'}
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <NumField
                  label="lifetime (ครั้ง)"
                  value={draft.lifetimeEscalateAt}
                  disabled={!(draft.lifetimeEscalateEnabled ?? true)}
                  onChange={(v) => updatePolicy({ lifetimeEscalateAt: clampInt(v) })}
                />
              </div>
            </div>

            {/* cool-down */}
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
              <div className="grid grid-cols-3 gap-3">
                <NumField
                  label="cool-down (วัน)"
                  value={draft.coolDownDays}
                  onChange={(v) => updatePolicy({ coolDownDays: clampInt(v) })}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">ช่วงวันรีเซ็ตการประเมินระดับ (window สำหรับนับ bad_record ใหม่)</p>
            </div>

            {/* actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={!dirty || saving}
                className="px-5 py-2 text-sm bg-admin-primary hover:bg-admin-dark disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึกนโยบาย'}
              </button>
              {dirty && (
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-500 rounded-lg transition-colors"
                >
                  ยกเลิกการเปลี่ยน
                </button>
              )}
              {dirty && <span className="text-xs text-yellow-700">● มีการเปลี่ยนที่ยังไม่บันทึก</span>}
            </div>

            {/* audit log viewer */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowAudit((s) => !s)}
                className="text-sm font-medium text-admin-primary hover:text-admin-dark"
              >
                {showAudit ? '▾' : '▸'} ประวัติการแก้ไข ({audit.length})
              </button>
              {showAudit && (
                <div className="mt-3 space-y-2">
                  {audit.length === 0 && (
                    <p className="text-sm text-gray-500">ยังไม่มีประวัติการแก้ไข</p>
                  )}
                  {audit.map((a) => (
                    <div key={a.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-700">{a.changedBy ?? '—'}</span>
                        <span className="text-gray-500">{new Date(a.changedAt).toLocaleString('th-TH')}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                        <div>
                          <div className="text-gray-400 mb-0.5">ค่าเก่า</div>
                          <pre className="bg-gray-50 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all text-gray-600">
{a.oldValue === null ? '(ไม่มี)' : JSON.stringify(a.oldValue, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <div className="text-gray-400 mb-0.5">ค่าใหม่</div>
                          <pre className="bg-green-50 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all text-green-800">
{JSON.stringify(a.newValue, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-red-600 text-sm">โหลดนโยบายไม่สำเร็จ</p>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium transition-all ${
            toast.type === 'ok'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ─── reusable number field ──────────────────────────────────────────────────────

function NumField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string
  value: number
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <input
        type="number"
        min={0}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-gray-300 text-gray-900 text-sm text-right rounded-lg px-3 py-2 focus:outline-none focus:border-admin-primary disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
      />
    </label>
  )
}
