"use client";
// ── components/Footer.tsx — WeeeR Footer (Sub-4 D78 Chat 3) ──────────────────
// ดึงข้อมูลติดต่อจาก GET /api/contact-info (Sub-4 public endpoint)
// Stub types mirror Schema Plan 363813ec-7277-81c2-b7b4-d9111d0b3427 Section 3
// TODO: import จาก packages/shared/dal/contact.types เมื่อ Backend merge Sub-4

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";

// ── Stub types — mirror Backend Schema Plan Section 3 (ห้ามแก้จนกว่า Backend merge) ──

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

type SocialPlatform = "line" | "facebook" | "instagram" | "youtube" | "tiktok" | "twitter";

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

// ── Social platform icon map ──────────────────────────────────────────────────

const SOCIAL_ICON: Record<SocialPlatform, string> = {
  line: "💬",
  facebook: "📘",
  instagram: "📷",
  youtube: "▶️",
  tiktok: "🎵",
  twitter: "🐦",
};

// ── Footer Component ──────────────────────────────────────────────────────────

export default function Footer() {
  const [info, setInfo] = useState<ContactInfoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch("/api/contact-info")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ContactInfoDto>;
      })
      .then((data) => {
        setInfo(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-auto px-6 py-6 text-xs text-gray-500">
      {loading ? (
        <div className="text-center text-gray-300 py-2 animate-pulse">
          กำลังโหลดข้อมูลติดต่อ…
        </div>
      ) : error || !info ? (
        /* API down — minimal fallback (hide sensitive info) */
        <div className="text-center text-gray-400 py-2">
          ℹ️ ไม่สามารถโหลดข้อมูลติดต่อได้ — กรุณาติดต่อ admin
        </div>
      ) : (
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Col 1 — Company + Address + Hours */}
          <div className="space-y-2">
            <p className="font-semibold text-gray-700 text-sm">{info.companyName}</p>
            <address className="not-italic leading-relaxed space-y-0.5">
              <p>{info.address.street}</p>
              <p>
                {info.address.district}, {info.address.province}{" "}
                {info.address.postalCode}
              </p>
              <p>{info.address.country}</p>
            </address>
            <div className="space-y-0.5 text-gray-400">
              <p>🕐 {info.businessHours.weekdays}</p>
              {info.businessHours.weekend && (
                <p>🕐 {info.businessHours.weekend}</p>
              )}
              {info.businessHours.holidays && (
                <p>{info.businessHours.holidays}</p>
              )}
            </div>
          </div>

          {/* Col 2 — Phones + Emails */}
          <div className="space-y-3">
            {info.phones.length > 0 && (
              <div>
                <p className="font-medium text-gray-600 mb-1">📞 โทรศัพท์</p>
                <ul className="space-y-0.5">
                  {info.phones.map((phone, i) => (
                    <li key={i}>
                      <span className="text-gray-400">{phone.label}: </span>
                      <a
                        href={`tel:${phone.number.replace(/[^+\d]/g, "")}`}
                        className="hover:text-green-700 transition-colors"
                      >
                        {phone.number}
                      </a>
                      {phone.hours && (
                        <span className="text-gray-400 ml-1">({phone.hours})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {info.emails.length > 0 && (
              <div>
                <p className="font-medium text-gray-600 mb-1">✉️ อีเมล</p>
                <ul className="space-y-0.5">
                  {info.emails.map((email, i) => (
                    <li key={i}>
                      <span className="text-gray-400">{email.label}: </span>
                      <a
                        href={`mailto:${email.address}`}
                        className="hover:text-green-700 transition-colors"
                      >
                        {email.address}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Col 3 — Socials + Map */}
          <div className="space-y-3">
            {info.socials.length > 0 && (
              <div>
                <p className="font-medium text-gray-600 mb-1">🌐 โซเชียล</p>
                <ul className="space-y-0.5">
                  {info.socials.map((social, i) => (
                    <li key={i}>
                      <a
                        href={social.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-green-700 transition-colors"
                      >
                        <span>{SOCIAL_ICON[social.platform]}</span>
                        <span>{social.handle}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {info.mapEmbedUrl && (
              <a
                href={info.mapEmbedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 transition-colors"
              >
                📍 ดูแผนที่
              </a>
            )}
          </div>
        </div>
      )}

      {/* Copyright bar */}
      <div className="max-w-5xl mx-auto mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <p>© {new Date().getFullYear()} App3R — WeeeR Portal</p>
        <p className="text-gray-300">v0.1</p>
      </div>
    </footer>
  );
}
