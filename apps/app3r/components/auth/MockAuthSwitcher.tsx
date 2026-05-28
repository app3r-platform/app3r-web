"use client";
// ============================================================
// components/auth/MockAuthSwitcher.tsx — DEV-only floating role switcher
// W-2-B (D3): mockup login switcher สำหรับทดสอบ role-based view
//
// 🚨 CRITICAL R4 MITIGATION (Risk Register HIGH):
//   - บังคับ env check: NEXT_PUBLIC_DEV_NAV !== 'true' → return null
//   - middleware reject mock_role cookie in production
//   - ห้าม build production ถ้า env นี้เปิด
// ============================================================
import { useEffect, useState } from "react";
import { MOCK_ROLES, MOCK_ROLE_STORAGE, MOCK_ROLE_COOKIE, isDevNavEnabled } from "@/lib/auth/mock-role";
import type { MockRole } from "@/lib/auth/mock-role";

export default function MockAuthSwitcher() {
  const [currentRole, setCurrentRole] = useState<MockRole>("anonymous");
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(MOCK_ROLE_STORAGE) as MockRole | null;
      if (stored && MOCK_ROLES.some((r) => r.value === stored)) {
        setCurrentRole(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  // 🚨 R4 GUARD #1 — บังคับ env check
  if (!isDevNavEnabled()) return null;
  if (!mounted) return null;

  function handleRoleChange(role: MockRole) {
    setCurrentRole(role);
    try {
      localStorage.setItem(MOCK_ROLE_STORAGE, role);
      // sync to cookie so Server Components can read
      document.cookie = `${MOCK_ROLE_COOKIE}=${role}; path=/; SameSite=Lax`;
    } catch {
      // ignore
    }
    // reload to re-render Server Components with new role
    window.location.reload();
  }

  const current = MOCK_ROLES.find((r) => r.value === currentRole);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-[9998] bg-orange-500 text-white rounded-full w-12 h-12 shadow-lg hover:bg-orange-600 transition flex items-center justify-center text-lg"
        aria-label="เปิด Mock Auth Switcher"
        title="DEV-only mock role switcher"
      >
        {current?.emoji ?? "👤"}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9998] bg-white border-2 border-orange-400 rounded-xl shadow-xl p-3 text-xs max-w-[240px]">
      <div className="font-bold text-orange-600 mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1">
          <span>🧪</span>
          <span>DEV · Mock Role</span>
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="text-gray-400 hover:text-gray-700"
          aria-label="ย่อ"
        >
          ✕
        </button>
      </div>
      <div className="flex flex-col gap-1 mb-2">
        {MOCK_ROLES.map((r) => (
          <button
            key={r.value}
            onClick={() => handleRoleChange(r.value)}
            className={`w-full text-left px-2 py-1.5 rounded-lg font-medium transition flex items-center gap-2 ${
              currentRole === r.value
                ? `${r.color} ring-2 ring-offset-1 ring-orange-400`
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>{r.emoji}</span>
            <span className="flex-1">{r.label}</span>
            {currentRole === r.value && <span>✓</span>}
          </button>
        ))}
      </div>
      <div className="border-t pt-2 text-[10px] text-orange-700 leading-snug">
        ⚠️ DEV-only — แสดงเมื่อ <code className="bg-orange-50 px-1 rounded">NEXT_PUBLIC_DEV_NAV=true</code> เท่านั้น
      </div>
    </div>
  );
}
