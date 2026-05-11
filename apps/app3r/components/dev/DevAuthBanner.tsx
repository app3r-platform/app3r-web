"use client";

// ============================================================
// components/dev/DevAuthBanner.tsx — Dev-only role switcher
// Phase C-4.1b: added weeet + admin, cookie sync
// ============================================================

import { useState, useEffect } from "react";

type MockRole = "anonymous" | "weeeu" | "weeer" | "weeet" | "weeeu-owner" | "admin";

const STORAGE_KEY = "app3r-mock-role";
const COOKIE_KEY = "app3r-mock-role";

const roles: { value: MockRole; label: string; color: string }[] = [
  { value: "anonymous",    label: "ผู้เยี่ยมชม",    color: "bg-gray-200 text-gray-800" },
  { value: "weeeu",        label: "WeeeU",           color: "bg-blue-200 text-blue-800" },
  { value: "weeer",        label: "WeeeR",           color: "bg-green-200 text-green-800" },
  { value: "weeet",        label: "WeeeT",           color: "bg-yellow-200 text-yellow-800" },
  { value: "weeeu-owner",  label: "เจ้าของประกาศ",  color: "bg-purple-200 text-purple-800" },
  { value: "admin",        label: "Admin",           color: "bg-red-200 text-red-800" },
];

export default function DevAuthBanner() {
  const [currentRole, setCurrentRole] = useState<MockRole>("anonymous");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY) as MockRole | null;
    if (saved && roles.some((r) => r.value === saved)) {
      setCurrentRole(saved);
    }
  }, []);

  if (!mounted) return null;

  function handleRoleChange(role: MockRole) {
    setCurrentRole(role);
    localStorage.setItem(STORAGE_KEY, role);
    // Sync to cookie so Server Components can read via getMockRoleFromCookie()
    document.cookie = `${COOKIE_KEY}=${role}; path=/; SameSite=Lax`;
  }

  const current = roles.find((r) => r.value === currentRole);

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-xl shadow-lg p-3 text-xs max-w-[220px]">
      <div className="font-bold text-gray-600 mb-2 flex items-center gap-1">
        <span className="text-yellow-500">⚙</span>
        DEV — Mock Role
      </div>
      <div className="flex flex-col gap-1">
        {roles.map((role) => (
          <button
            key={role.value}
            onClick={() => handleRoleChange(role.value)}
            className={`w-full text-left px-2 py-1 rounded-lg font-medium transition ${
              currentRole === role.value
                ? `${role.color} ring-2 ring-offset-1 ring-blue-400`
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {currentRole === role.value ? "✓ " : ""}
            {role.label}
          </button>
        ))}
      </div>
      <div className="mt-2 text-gray-400 border-t pt-1">
        บทบาทปัจจุบัน:{" "}
        <span className={`font-semibold px-1 rounded ${current?.color}`}>
          {current?.label}
        </span>
      </div>
      <div className="mt-1 text-gray-300 text-[10px]">
        * เปลี่ยน role แล้ว reload หน้า
      </div>
    </div>
  );
}
