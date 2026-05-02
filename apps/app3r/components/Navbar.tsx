"use client";
import { useState } from "react";
import Link from "next/link";

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

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="font-extrabold text-xl text-purple-700">App3R</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label} className="relative">
                  <button
                    onMouseEnter={() => setDropdownOpen(true)}
                    onMouseLeave={() => setDropdownOpen(false)}
                    className="text-gray-700 hover:text-purple-700 font-medium flex items-center gap-1 py-2"
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
                          className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700 text-sm"
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
                  className="text-gray-700 hover:text-purple-700 font-medium"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="http://localhost:3002/login"
              className="text-purple-700 border border-purple-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-50 transition"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/register/weeer"
              className="bg-purple-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-800 transition"
            >
              สมัคร WeeeR
            </Link>
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
                      className="block px-4 py-2 text-gray-700 hover:text-purple-700"
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
                  className="block px-2 py-2 text-gray-700 hover:text-purple-700 font-medium"
                >
                  {link.label}
                </Link>
              )
            )}
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              <Link
                href="http://localhost:3002/login"
                onClick={() => setMobileOpen(false)}
                className="text-center text-purple-700 border border-purple-700 px-4 py-2 rounded-lg text-sm font-medium"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register/weeer"
                onClick={() => setMobileOpen(false)}
                className="text-center bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                สมัคร WeeeR
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
