"use client";
import { useState } from "react";
import Link from "next/link";
import { useMockRole } from "@/lib/auth/useMockRole";
import { MOCK_USERS } from "@/lib/auth/mock-role";
import { crossAppUrls } from "@/lib/config/urls";

// Round 2 W-01: role-aware identity + per-role CTA (กฎ#9 · เลนส์ #1)
const roleMeta: Record<
  Exclude<ReturnType<typeof useMockRole>["role"], "anonymous">,
  { emoji: string; label: string; appUrl: string }
> = {
  weeeu: { emoji: "🛒", label: "WeeeU", appUrl: crossAppUrls.weeeu.base },
  weeer: { emoji: "🔧", label: "WeeeR", appUrl: crossAppUrls.weeer.base },
  weeet: { emoji: "👨‍🔧", label: "WeeeT", appUrl: crossAppUrls.weeet.base },
};

const navLinks = [
  { href: "/", label: "หน้าหลัก" },
  {
    label: "ประกาศ",
    children: [
      { href: "/listings/resell", label: "ขายเครื่องใช้ไฟฟ้ามือสอง" },
      { href: "/listings/repair", label: "ซ่อมเครื่องใช้ไฟฟ้า" },
      { href: "/listings/maintain", label: "บำรุงรักษา" },
    ],
  },
  { href: "/articles", label: "บทความ" },
  { href: "/products", label: "สินค้า" },
  { href: "/contact", label: "ติดต่อ" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { role, mounted } = useMockRole();

  // ก่อน mount = anonymous view (กัน hydration mismatch)
  const effectiveRole = mounted ? role : "anonymous";
  // เช็คตรง (ไม่ผ่านตัวแปร boolean) เพื่อให้ TS narrow type ใน branch ไม่ใช่ anonymous
  const identity =
    effectiveRole === "anonymous"
      ? null
      : { ...roleMeta[effectiveRole], name: MOCK_USERS[effectiveRole].name };
  const isAnon = identity === null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="font-extrabold text-xl text-website-brand-700">App3R</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label} className="relative">
                  <button
                    onMouseEnter={() => setDropdownOpen(true)}
                    onMouseLeave={() => setDropdownOpen(false)}
                    className="text-gray-700 hover:text-website-brand-700 font-medium flex items-center gap-1 py-2"
                  >
                    {link.label}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {dropdownOpen && (
                    <div
                      onMouseEnter={() => setDropdownOpen(true)}
                      onMouseLeave={() => setDropdownOpen(false)}
                      className="absolute top-full left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48 z-50"
                    >
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2 text-gray-700 hover:bg-website-brand-50 hover:text-website-brand-700 text-sm"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href!}
                  className="text-gray-700 hover:text-website-brand-700 font-medium"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* CTA Buttons — role-aware (W-01 · กฎ#9) */}
          <div className="hidden md:flex items-center gap-3">
            {isAnon ? (
              <>
                <a
                  href={crossAppUrls.weeeu.login}
                  className="text-website-brand-700 border border-website-brand-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-website-brand-50 transition"
                >
                  เข้าสู่ระบบ WeeeU
                </a>
                <Link
                  href="/register/weeer"
                  className="bg-website-brand-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-website-brand-800 transition"
                >
                  สมัคร WeeeR
                </Link>
              </>
            ) : (
              // logged-in (mock): แสดงชื่อ user/ร้าน + ลิงก์ไปแอปของตน · ซ่อนปุ่มสมัคร/เข้าระบบ
              <a
                href={identity!.appUrl}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-website-brand-200 bg-website-brand-50 text-sm font-medium text-website-brand-800 hover:bg-website-brand-100 transition"
                title={`ไปยังแอป ${identity!.label}`}
              >
                <span>{identity!.emoji}</span>
                <span className="max-w-[160px] truncate">{identity!.name}</span>
              </a>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 space-y-2">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label}>
                  <p className="px-2 py-1 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                    {link.label}
                  </p>
                  {link.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-2 text-gray-700 hover:text-website-brand-700"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href!}
                  onClick={() => setMobileOpen(false)}
                  className="block px-2 py-2 text-gray-700 hover:text-website-brand-700 font-medium"
                >
                  {link.label}
                </Link>
              )
            )}
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              {isAnon ? (
                <>
                  <a
                    href={crossAppUrls.weeeu.login}
                    onClick={() => setMobileOpen(false)}
                    className="text-center text-website-brand-700 border border-website-brand-700 px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    เข้าสู่ระบบ WeeeU
                  </a>
                  <Link
                    href="/register/weeer"
                    onClick={() => setMobileOpen(false)}
                    className="text-center bg-website-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    สมัคร WeeeR
                  </Link>
                </>
              ) : (
                <a
                  href={identity!.appUrl}
                  onClick={() => setMobileOpen(false)}
                  className="text-center flex items-center justify-center gap-2 border border-website-brand-200 bg-website-brand-50 text-website-brand-800 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  <span>{identity!.emoji}</span>
                  <span className="truncate">{identity!.name}</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
