'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAdminContactInfo, updateContactInfo } from '@/lib/api/contact'
import type {
  ContactInfoDto,
  ContactInfoPhone,
  ContactInfoEmail,
  ContactInfoSocial,
  SocialPlatform,
} from '@/lib/types/contact'

function getToken(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('app3r_admin_token') ?? ''
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  'line',
  'facebook',
  'instagram',
  'youtube',
  'tiktok',
  'twitter',
]

// D78-shaped empty form (placeholder/TBD until loaded from API — Master CMD GAP-5)
const EMPTY_FORM: Omit<ContactInfoDto, 'updatedAt'> = {
  companyName: '',
  address: {
    street: '',
    district: '',
    province: '',
    postalCode: '',
    country: '',
  },
  phones: [],
  emails: [],
  socials: [],
  businessHours: { weekdays: '', weekend: '', holidays: '' },
  mapEmbedUrl: null,
}

export default function ContactInfoEditor() {
  const router = useRouter()
  const [form, setForm] = useState<Omit<ContactInfoDto, 'updatedAt'>>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const info = await getAdminContactInfo(getToken())
      // defensive: coerce array fields (Carry-over #2 — avoid undefined.map/length)
      setForm({
        companyName: info.companyName ?? '',
        address: info.address ?? EMPTY_FORM.address,
        phones: Array.isArray(info.phones) ? info.phones : [],
        emails: Array.isArray(info.emails) ? info.emails : [],
        socials: Array.isArray(info.socials) ? info.socials : [],
        businessHours: info.businessHours ?? EMPTY_FORM.businessHours,
        mapEmbedUrl: info.mapEmbedUrl ?? null,
      })
    } catch (e) {
      // pre-T+2 Backend endpoint not live → keep empty form, show notice
      setError(
        e instanceof Error
          ? `โหลดข้อมูลเดิมไม่สำเร็จ (${e.message}) — แก้ไขบนฟอร์มเปล่าได้`
          : 'โหลดข้อมูลไม่สำเร็จ',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    if (!form.companyName.trim()) {
      setError('กรอกชื่อบริษัทก่อนบันทึก')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const updated = await updateContactInfo(getToken(), form)
      if (updated && typeof updated === 'object') {
        setForm({ ...form, ...updated })
      }
      setSuccess('บันทึกข้อมูลติดต่อเรียบร้อย')
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  // ── array helpers ────────────────────────────────────────────────────────
  const addPhone = () =>
    setForm((f) => ({
      ...f,
      phones: [...f.phones, { label: '', number: '', hours: '' }],
    }))
  const updatePhone = (i: number, patch: Partial<ContactInfoPhone>) =>
    setForm((f) => ({
      ...f,
      phones: f.phones.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    }))
  const removePhone = (i: number) =>
    setForm((f) => ({ ...f, phones: f.phones.filter((_, idx) => idx !== i) }))

  const addEmail = () =>
    setForm((f) => ({
      ...f,
      emails: [...f.emails, { label: '', address: '' }],
    }))
  const updateEmail = (i: number, patch: Partial<ContactInfoEmail>) =>
    setForm((f) => ({
      ...f,
      emails: f.emails.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    }))
  const removeEmail = (i: number) =>
    setForm((f) => ({ ...f, emails: f.emails.filter((_, idx) => idx !== i) }))

  const addSocial = () =>
    setForm((f) => ({
      ...f,
      socials: [...f.socials, { platform: 'line', handle: '', url: '' }],
    }))
  const updateSocial = (i: number, patch: Partial<ContactInfoSocial>) =>
    setForm((f) => ({
      ...f,
      socials: f.socials.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }))
  const removeSocial = (i: number) =>
    setForm((f) => ({ ...f, socials: f.socials.filter((_, idx) => idx !== i) }))

  if (loading) return <div className="p-6 text-gray-500">กำลังโหลด...</div>

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/contact')}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← กลับ Inbox
        </button>
        <h1 className="text-xl font-bold text-gray-900">แก้ไขข้อมูลติดต่อ (D78)</h1>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-2 rounded">
          {error}
        </div>
      )}

      {/* companyName */}
      <Field label="ชื่อบริษัท *">
        <input
          type="text"
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </Field>

      {/* address */}
      <Section title="ที่อยู่">
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ['street', 'ที่อยู่/ถนน'],
              ['district', 'อำเภอ/เขต'],
              ['province', 'จังหวัด'],
              ['postalCode', 'รหัสไปรษณีย์'],
              ['country', 'ประเทศ'],
            ] as [keyof ContactInfoDto['address'], string][]
          ).map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs text-gray-500 mb-1">{label}</label>
              <input
                type="text"
                value={form.address[key]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: { ...form.address, [key]: e.target.value },
                  })
                }
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* phones */}
      <Section title="เบอร์โทรศัพท์" onAdd={addPhone}>
        {form.phones.length === 0 && (
          <p className="text-xs text-gray-400">ยังไม่มีเบอร์โทร</p>
        )}
        {form.phones.map((p, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <input
              placeholder="ป้ายกำกับ (เช่น สายด่วน)"
              value={p.label}
              onChange={(e) => updatePhone(i, { label: e.target.value })}
              className="col-span-3 border rounded px-2 py-1.5 text-sm"
            />
            <input
              placeholder="02-xxx-xxxx"
              value={p.number}
              onChange={(e) => updatePhone(i, { number: e.target.value })}
              className="col-span-4 border rounded px-2 py-1.5 text-sm"
            />
            <input
              placeholder="เวลาทำการ (ไม่บังคับ)"
              value={p.hours ?? ''}
              onChange={(e) => updatePhone(i, { hours: e.target.value })}
              className="col-span-4 border rounded px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => removePhone(i)}
              className="col-span-1 text-red-500 text-sm hover:text-red-700"
              aria-label="ลบเบอร์โทร"
            >
              ✕
            </button>
          </div>
        ))}
      </Section>

      {/* emails */}
      <Section title="อีเมล" onAdd={addEmail}>
        {form.emails.length === 0 && (
          <p className="text-xs text-gray-400">ยังไม่มีอีเมล</p>
        )}
        {form.emails.map((em, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <input
              placeholder="ป้ายกำกับ (เช่น ทั่วไป)"
              value={em.label}
              onChange={(e) => updateEmail(i, { label: e.target.value })}
              className="col-span-4 border rounded px-2 py-1.5 text-sm"
            />
            <input
              placeholder="contact@app3r.com"
              value={em.address}
              onChange={(e) => updateEmail(i, { address: e.target.value })}
              className="col-span-7 border rounded px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => removeEmail(i)}
              className="col-span-1 text-red-500 text-sm hover:text-red-700"
              aria-label="ลบอีเมล"
            >
              ✕
            </button>
          </div>
        ))}
      </Section>

      {/* socials */}
      <Section title="โซเชียลมีเดีย" onAdd={addSocial}>
        {form.socials.length === 0 && (
          <p className="text-xs text-gray-400">ยังไม่มีโซเชียล</p>
        )}
        {form.socials.map((s, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <select
              value={s.platform}
              onChange={(e) =>
                updateSocial(i, { platform: e.target.value as SocialPlatform })
              }
              className="col-span-3 border rounded px-2 py-1.5 text-sm bg-white"
              aria-label="แพลตฟอร์ม"
            >
              {SOCIAL_PLATFORMS.map((pl) => (
                <option key={pl} value={pl}>
                  {pl}
                </option>
              ))}
            </select>
            <input
              placeholder="@app3r"
              value={s.handle}
              onChange={(e) => updateSocial(i, { handle: e.target.value })}
              className="col-span-4 border rounded px-2 py-1.5 text-sm"
            />
            <input
              placeholder="https://..."
              value={s.url}
              onChange={(e) => updateSocial(i, { url: e.target.value })}
              className="col-span-4 border rounded px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => removeSocial(i)}
              className="col-span-1 text-red-500 text-sm hover:text-red-700"
              aria-label="ลบโซเชียล"
            >
              ✕
            </button>
          </div>
        ))}
      </Section>

      {/* businessHours */}
      <Section title="เวลาทำการ">
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ['weekdays', 'จันทร์-ศุกร์'],
              ['weekend', 'เสาร์-อาทิตย์ (ไม่บังคับ)'],
              ['holidays', 'วันหยุด (ไม่บังคับ)'],
            ] as [keyof ContactInfoDto['businessHours'], string][]
          ).map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs text-gray-500 mb-1">{label}</label>
              <input
                type="text"
                value={form.businessHours[key] ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    businessHours: {
                      ...form.businessHours,
                      [key]: e.target.value,
                    },
                  })
                }
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* mapEmbedUrl */}
      <Field label="Google Maps Embed URL (ไม่บังคับ)">
        <input
          type="text"
          value={form.mapEmbedUrl ?? ''}
          onChange={(e) =>
            setForm({ ...form, mapEmbedUrl: e.target.value || null })
          }
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="https://www.google.com/maps/embed?..."
        />
      </Field>

      <div className="flex gap-3 pt-2 border-t">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลติดต่อ'}
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}

function Section({
  title,
  onAdd,
  children,
}: {
  title: string
  onAdd?: () => void
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2 border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="text-xs text-blue-600 hover:underline"
          >
            + เพิ่ม
          </button>
        )}
      </div>
      {children}
    </div>
  )
}
