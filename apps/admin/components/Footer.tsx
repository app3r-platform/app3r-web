'use client'

// Admin app Footer — Sub-4 D78
// Fetches public GET /api/contact-info (single source — Master CMD GAP-2/R2)
// Per-app copy (no shared packages/ui Footer — W4 Watch decision)

import { useEffect, useState } from 'react'
import { getPublicContactInfo } from '@/lib/api/contact'
import type { ContactInfoDto } from '@/lib/types/contact'

export default function Footer() {
  const [info, setInfo] = useState<ContactInfoDto | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    getPublicContactInfo()
      .then((d) => {
        if (active) setInfo(d)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [])

  // pre-T+2 (endpoint not live) or fetch error → minimal fallback footer
  if (failed || !info) {
    return (
      <footer className="border-t border-gray-800 bg-gray-900 text-gray-500 text-xs px-6 py-4">
        <p>App3R Admin — ระบบจัดการแพลตฟอร์ม</p>
      </footer>
    )
  }

  const phones = Array.isArray(info.phones) ? info.phones : []
  const emails = Array.isArray(info.emails) ? info.emails : []
  const socials = Array.isArray(info.socials) ? info.socials : []

  return (
    <footer className="border-t border-gray-800 bg-gray-900 text-gray-400 text-xs px-6 py-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <p className="text-white font-semibold mb-1">{info.companyName}</p>
          {info.address && (
            <p className="leading-relaxed">
              {info.address.street} {info.address.district}{' '}
              {info.address.province} {info.address.postalCode}{' '}
              {info.address.country}
            </p>
          )}
        </div>

        <div>
          <p className="text-gray-300 font-medium mb-1">โทรศัพท์</p>
          {phones.length === 0 && <p>—</p>}
          {phones.map((p, i) => (
            <p key={i}>
              {p.label}: {p.number}
              {p.hours ? ` (${p.hours})` : ''}
            </p>
          ))}
        </div>

        <div>
          <p className="text-gray-300 font-medium mb-1">อีเมล</p>
          {emails.length === 0 && <p>—</p>}
          {emails.map((e, i) => (
            <p key={i}>
              {e.label}: {e.address}
            </p>
          ))}
        </div>

        <div>
          <p className="text-gray-300 font-medium mb-1">ติดตามเรา</p>
          {socials.length === 0 && <p>—</p>}
          {socials.map((s, i) => (
            <p key={i}>
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  {s.platform}: {s.handle}
                </a>
              ) : (
                <span>
                  {s.platform}: {s.handle}
                </span>
              )}
            </p>
          ))}
          {info.businessHours?.weekdays && (
            <p className="mt-2 text-gray-500">
              เวลาทำการ: {info.businessHours.weekdays}
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}
