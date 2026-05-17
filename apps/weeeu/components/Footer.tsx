/**
 * components/Footer.tsx
 * Sub-CMD-4 D78 — WeeeU Footer
 * Remediation v2: branch phase-d-4/weeeu-sub4-contact base 8be4344
 *
 * Server Component — fetches GET /api/contact-info (Public, cache 300s)
 * Stub fallback: ถ้า Backend ยังไม่ merge หรือ fetch error → ใช้ CONTACT_INFO_STUB
 *
 * ★ Type source: lib/types/contact-info.ts
 *   (mirror of packages/shared/dal/contact.types.ts — Backend Sub-4 T+2)
 */

import type {
  ContactInfoDto,
  ContactInfoPhone,
  ContactInfoEmail,
  ContactInfoSocial,
  ContactInfoBusinessHours,
} from '@/lib/types/contact-info';

// ── Stub data (D78 placeholder — ใช้จนกว่า Backend seed จะมีข้อมูลจริง) ─────────

export const CONTACT_INFO_STUB: ContactInfoDto = {
  companyName: 'App3R Co., Ltd.',
  address: {
    street: '123 ถนนตัวอย่าง',
    district: 'เขตตัวอย่าง',
    province: 'กรุงเทพมหานคร',
    postalCode: '10000',
    country: 'Thailand',
  },
  phones: [
    { label: 'สายด่วน', number: '02-xxx-xxxx', hours: 'จ-ศ 9:00-18:00' },
  ],
  emails: [
    { label: 'ทั่วไป', address: 'contact@app3r.co.th' },
    { label: 'ฝ่ายสนับสนุน', address: 'support@app3r.co.th' },
  ],
  socials: [
    { platform: 'line', handle: '@app3r', url: 'https://line.me/ti/p/@app3r' },
    { platform: 'facebook', handle: 'App3R Thailand', url: 'https://facebook.com/app3r' },
  ],
  businessHours: {
    weekdays: 'จ-ศ 9:00-18:00',
    weekend: 'ส-อา 10:00-17:00',
    holidays: 'ปิดวันหยุดนักขัตฤกษ์',
  },
  mapEmbedUrl: null,
  updatedAt: '',
};

// ── Social platform icons ──────────────────────────────────────────────────────

const SOCIAL_ICON: Record<string, string> = {
  line: '💬',
  facebook: '📘',
  instagram: '📸',
  youtube: '▶️',
  tiktok: '🎵',
  twitter: '🐦',
};

// ── Data fetching ─────────────────────────────────────────────────────────────

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'production'
    ? 'https://api.app3r.co.th'
    : 'http://localhost:8787');

/**
 * fetchContactInfo — GET /api/contact-info
 * revalidate 300s (ตรงกับ Backend cache max-age=300)
 * Returns CONTACT_INFO_STUB ถ้า fetch ล้มเหลว
 */
export async function fetchContactInfo(): Promise<ContactInfoDto> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/contact-info`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return CONTACT_INFO_STUB;
    return (await res.json()) as ContactInfoDto;
  } catch {
    return CONTACT_INFO_STUB;
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PhoneList({ phones }: { phones: ContactInfoPhone[] }) {
  if (phones.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        โทรศัพท์
      </h3>
      <ul className="space-y-1">
        {phones.map((p, i) => (
          <li key={i} className="text-sm">
            <span className="text-gray-500">{p.label}: </span>
            <a
              href={`tel:${p.number.replace(/[^0-9+]/g, '')}`}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {p.number}
            </a>
            {p.hours && (
              <span className="text-gray-500 text-xs ml-1">({p.hours})</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmailList({ emails }: { emails: ContactInfoEmail[] }) {
  if (emails.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        อีเมล
      </h3>
      <ul className="space-y-1">
        {emails.map((e, i) => (
          <li key={i} className="text-sm">
            <span className="text-gray-500">{e.label}: </span>
            <a
              href={`mailto:${e.address}`}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {e.address}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialList({ socials }: { socials: ContactInfoSocial[] }) {
  if (socials.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        โซเชียลมีเดีย
      </h3>
      <div className="flex flex-wrap gap-3">
        {socials.map((s, i) => (
          <a
            key={i}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors"
            aria-label={`${s.platform} ${s.handle}`}
          >
            <span>{SOCIAL_ICON[s.platform] ?? '🔗'}</span>
            <span>{s.handle}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function BusinessHoursSection({ hours }: { hours: ContactInfoBusinessHours }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        เวลาทำการ
      </h3>
      <ul className="space-y-0.5 text-sm text-gray-300">
        <li>{hours.weekdays}</li>
        {hours.weekend && <li>{hours.weekend}</li>}
        {hours.holidays && <li className="text-gray-500">{hours.holidays}</li>}
      </ul>
    </div>
  );
}

// ── FooterDisplay — presentational (testable) ──────────────────────────────────

export function FooterDisplay({ info }: { info: ContactInfoDto }) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto" data-testid="footer">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company + Address */}
          <div className="lg:col-span-1">
            <h2 className="text-white font-bold text-lg mb-2">{info.companyName}</h2>
            <address className="not-italic text-sm text-gray-400 space-y-0.5">
              <p>{info.address.street}</p>
              <p>
                {info.address.district} {info.address.province}{' '}
                {info.address.postalCode}
              </p>
              <p>{info.address.country}</p>
            </address>
          </div>
          <div><PhoneList phones={info.phones} /></div>
          <div><EmailList emails={info.emails} /></div>
          <div><BusinessHoursSection hours={info.businessHours} /></div>
        </div>

        {info.socials.length > 0 && (
          <div className="border-t border-gray-800 pt-6 mb-6">
            <SocialList socials={info.socials} />
          </div>
        )}

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>© {year} {info.companyName}. สงวนลิขสิทธิ์</p>
          <p>WeeeU — แพลตฟอร์มจัดการเครื่องใช้ไฟฟ้าครบวงจร</p>
        </div>
      </div>
    </footer>
  );
}

// ── Footer — Server Component (default export) ────────────────────────────────

export default async function Footer() {
  const info = await fetchContactInfo();
  return <FooterDisplay info={info} />;
}
