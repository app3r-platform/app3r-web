"use client";
// ─── (app) layout — A2 redesign: desktop sidebar → mobile-first bottom-tab 5 แท็บ ─
// อ้างอิง: A2 spec (36a813ec-7277-8152-aed5-cb90594db76b) · Advisor Gen 83 · 2026-05-25
//
// SCOPE: เฉพาะ navigation structure — ห้ามแตะ content pages

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ScreenBadge } from "@/components/ScreenBadge";
import { MockAnnoBar } from "@/components/shared/MockAnnoBar";
import { walletApi } from "@/lib/api/wallet";

// ── 5 Bottom tabs (A2 spec — icon + label + active prefix matching) ────────────
const BOTTOM_TABS = [
  {
    href: "/dashboard",
    icon: "🏠",
    label: "บัญชีของฉัน",
    // Tab 1 = hub สำหรับ dashboard + wallet + เครื่อง + ประวัติ + โปรไฟล์
    matchPrefixes: [
      "/dashboard", "/wallet", "/appliances",
      "/history", "/profile", "/notifications",
      "/settings", "/transactions",
    ],
  },
  {
    href: "/repair",
    icon: "🔧",
    label: "ซ่อม",
    // repair flow + jobs (งานซ่อมของฉัน)
    matchPrefixes: ["/repair", "/jobs"],
  },
  {
    href: "/maintain/book",
    icon: "✨",
    label: "บำรุงรักษา",
    matchPrefixes: ["/maintain"],
  },
  {
    href: "/sell",
    icon: "🛍️",
    label: "ซื้อ-ขาย",
    // sell + listings + offers + resell sub-flows
    matchPrefixes: ["/sell", "/listings", "/offers", "/resell"],
  },
  {
    href: "/scrap",
    icon: "♻️",
    label: "ซากเครื่อง",
    matchPrefixes: ["/scrap"],
  },
] as const;

type Tab = (typeof BOTTOM_TABS)[number];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [goldBalance, setGoldBalance] = useState<number | null>(null);

  useEffect(() => {
    walletApi.goldBalance()
      .then(d => setGoldBalance(d.balance))
      .catch(() => {});
  }, []);

  // ── Suspended: ซ่อน nav bar เพื่อป้องกัน bypass (U-65) ──────────────────────
  const isSuspended = pathname.startsWith("/suspended");

  function isActive(tab: Tab): boolean {
    return tab.matchPrefixes.some(prefix => pathname.startsWith(prefix));
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto h-14 flex items-center px-4 gap-3">

          {/* Logo + brand name — เมนูกลับหน้าหลัก (dashboard) ทุกหน้า (A1) */}
          <Link
            href="/dashboard"
            aria-label="กลับหน้าหลัก (Home)"
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo/WeeeU.png"
              alt="WeeeU"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="text-base font-bold text-weeeu-primary">WeeeU</span>
            <span className="text-base leading-none" aria-hidden="true">🏠</span>
          </Link>

          <div className="flex-1" />

          {/* 💎🥇 Point summary chips — top-bar (U-01 · Gold: real balance via GET /wallet/gold-balance · Silver: wallet link) */}
          <Link
            href="/wallet?tab=silver"
            aria-label="พอยต์เงิน (Silver Point)"
            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg transition-colors"
          >
            <span className="text-sm">💎</span>
            <span className="text-xs text-gray-500">ดูพอยต์</span>
          </Link>
          <Link
            href="/wallet?tab=gold"
            aria-label="พอยต์ทอง (Gold Point)"
            className="flex items-center gap-1 bg-weeeu-surface hover:bg-green-100 px-2 py-1 rounded-lg transition-colors"
          >
            <span className="text-sm">🥇</span>
            <span className="text-xs text-gray-500">
              {goldBalance != null ? goldBalance.toLocaleString() : "ดูพอยต์"}
            </span>
          </Link>

          {/* 🔔 Notification bell — ไอคอนมุมขวาบน (A2 ข้อ 4) */}
          <Link
            href="/notifications"
            className="relative p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <span className="text-xl">🔔</span>
            {/* Red dot badge — mock unread */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Link>

          {/* 👤 Username → โปรไฟล์ (U-35หัว · ลิงก์ไป profile) */}
          <Link
            href="/profile"
            aria-label="โปรไฟล์ของฉัน"
            className="flex items-center gap-1 hover:bg-gray-100 px-1.5 py-1 rounded-xl transition-colors"
          >
            <span className="text-lg">👤</span>
            <span className="text-xs font-medium text-gray-700 max-w-[64px] truncate hidden sm:inline">สมชาย</span>
          </Link>

        </div>
      </header>

      {/* ── P2 mock-anno bar (§5 origin · §6 nav · §8 xapp) — dev only ──────── */}
      {/* ลบด้วย: grep -r "mock-anno" apps/weeeu --include="*.tsx" -l */}
      <MockAnnoBar />

      {/* ── Page content ───────────────────────────────────────────────────── */}
      {/* pb-20 = 80px — เผื่อ bottom nav ความสูง ~60px */}
      <main className="max-w-lg mx-auto px-4 py-5 pb-20">
        {children}
      </main>

      {/* ── Bottom navigation bar (5 แท็บ) — ซ่อนเมื่อ suspended ─────────────── */}
      {!isSuspended && <nav
        className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-100"
        style={{ boxShadow: "0 -1px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="max-w-lg mx-auto flex">
          {BOTTOM_TABS.map(tab => {
            const active = isActive(tab);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center justify-center pt-1 pb-2 gap-0.5 transition-colors select-none ${
                  active
                    ? "text-weeeu-primary"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {/* Active indicator bar */}
                <div
                  className={`h-0.5 w-5 rounded-full transition-all duration-200 ${
                    active ? "bg-weeeu-primary" : "bg-transparent"
                  }`}
                />
                {/* Icon */}
                <span className="text-[22px] leading-none">{tab.icon}</span>
                {/* Label */}
                <span
                  className={`text-[10px] leading-tight text-center ${
                    active ? "font-semibold" : "font-normal"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>}

      {/* ── Screen ID Badge (dev only) ─────────────────────────────────────── */}
      <ScreenBadge />

    </div>
  );
}
