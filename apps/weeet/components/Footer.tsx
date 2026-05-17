/**
 * apps/weeet/components/Footer.tsx
 * Sub-4 D78 — WeeeT Footer (Chat 4)
 *
 * แสดงข้อมูลติดต่อ (contact info) ของแพลตฟอร์มใน footer
 * Fetch: GET /api/contact-info (public endpoint — Sub-4 Backend, cache max-age=300)
 *
 * T+0.5: stub phase — Backend endpoint ยังไม่ merge; graceful fallback เมื่อ API ไม่พร้อม
 * T+2:   real API — Backend merge endpoint แล้ว; โค้ดเดิมทำงานได้ทันที (ไม่ต้องแก้)
 *
 * Type stub: mirror ContactInfoDto จาก Schema Plan Section 3
 * (D78 spec — packages/shared/dal/contact.types.ts — Backend ownership)
 * กฎ Lesson #34: ห้ามสร้าง type นอก Schema Plan / Lesson #33: แตะแค่ไฟล์นี้
 */
"use client";

import { useEffect, useState } from "react";

// ── Type stub — mirror ContactInfoDto (Schema Plan Sub-4 Section 3) ─────────
// อ้างอิง: packages/shared/dal/contact.types.ts (Backend ownership)
// ห้ามแก้ structure — ต้องตรง D78 spec เป๊ะ (Lesson #34)

interface ContactInfoAddress {
  street: string;
  district: string;
  province: string;
  postalCode: string;
  country: string;
}

interface ContactInfoPhone {
  label: string;
  number: string;
  hours?: string;
}

interface ContactInfoEmail {
  label: string;
  address: string;
}

type SocialPlatform =
  | "line"
  | "facebook"
  | "instagram"
  | "youtube"
  | "tiktok"
  | "twitter";

interface ContactInfoSocial {
  platform: SocialPlatform;
  handle: string;
  url: string;
}

interface ContactInfoBusinessHours {
  weekdays: string;
  weekend?: string;
  holidays?: string;
}

interface ContactInfoDto {
  companyName: string;
  address: ContactInfoAddress;
  phones: ContactInfoPhone[];
  emails: ContactInfoEmail[];
  socials: ContactInfoSocial[];
  businessHours: ContactInfoBusinessHours;
  mapEmbedUrl: string | null;
  updatedAt: string; // ISO-8601
}

// ── Social icons (emoji fallback — ไม่ต้องการ external lib) ─────────────────

const SOCIAL_ICONS: Record<SocialPlatform, string> = {
  line: "💬",
  facebook: "📘",
  instagram: "📸",
  youtube: "▶️",
  tiktok: "🎵",
  twitter: "🐦",
};

// ── API fetch ──────────────────────────────────────────────────────────────────

async function fetchContactInfo(): Promise<ContactInfoDto | null> {
  try {
    // T+2: Backend sets Cache-Control: max-age=300 — browser ใช้ cache เอง
    const res = await fetch("/api/contact-info");
    if (!res.ok) return null;
    return res.json() as Promise<ContactInfoDto>;
  } catch {
    return null;
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function FooterSkeleton() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 px-4 py-6 space-y-3">
      <div className="h-4 bg-gray-800 rounded w-1/3 animate-pulse" />
      <div className="h-3 bg-gray-800 rounded w-1/2 animate-pulse" />
      <div className="h-3 bg-gray-800 rounded w-2/5 animate-pulse" />
    </footer>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Footer() {
  const [info, setInfo] = useState<ContactInfoDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContactInfo().then((data) => {
      setInfo(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <FooterSkeleton />;

  // API ไม่พร้อม (T+0.5 stub phase หรือ network error) → แสดง minimal footer
  if (!info) {
    return (
      <footer className="bg-gray-900 border-t border-gray-800 px-4 py-4 text-center">
        <p className="text-xs text-gray-600">App3R Platform</p>
      </footer>
    );
  }

  return (
    <footer className="bg-gray-900 border-t border-gray-800 px-4 pt-6 pb-4 space-y-4">
      {/* Company name */}
      <p className="text-sm font-semibold text-gray-300">{info.companyName}</p>

      {/* Phones */}
      {info.phones.length > 0 && (
        <div className="space-y-1">
          {info.phones.map((phone, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
              <span>📞</span>
              <a
                href={`tel:${phone.number.replace(/[^0-9+]/g, "")}`}
                className="hover:text-orange-400 transition-colors"
              >
                {phone.number}
              </a>
              {phone.label && (
                <span className="text-gray-600">({phone.label})</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Emails */}
      {info.emails.length > 0 && (
        <div className="space-y-1">
          {info.emails.map((email, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
              <span>✉️</span>
              <a
                href={`mailto:${email.address}`}
                className="hover:text-orange-400 transition-colors truncate"
              >
                {email.address}
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Business hours */}
      <div className="text-xs text-gray-500 space-y-0.5">
        <p>🕐 {info.businessHours.weekdays}</p>
        {info.businessHours.weekend && (
          <p className="pl-5">{info.businessHours.weekend}</p>
        )}
        {info.businessHours.holidays && (
          <p className="pl-5">{info.businessHours.holidays}</p>
        )}
      </div>

      {/* Socials */}
      {info.socials.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {info.socials.map((social, i) => (
            <a
              key={i}
              href={social.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-400 transition-colors"
              aria-label={`${social.platform}: ${social.handle}`}
            >
              <span>{SOCIAL_ICONS[social.platform]}</span>
              <span>{social.handle}</span>
            </a>
          ))}
        </div>
      )}

      {/* Address (compact) */}
      <p className="text-xs text-gray-600">
        {info.address.district}, {info.address.province} {info.address.postalCode}
      </p>

      {/* Copyright */}
      <p className="text-xs text-gray-700 pt-1 border-t border-gray-800">
        © {new Date().getFullYear()} {info.companyName} — WeeeT
      </p>
    </footer>
  );
}
