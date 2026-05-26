"use client";

import { useState } from "react";

// ═══════════════════════════════════════════════════════════════
// DevNav — Developer Navigation Panel (Admin)
// HUB Gen 33 CMD C — feature/dev-nav-admin
// แสดงเฉพาะเมื่อ NEXT_PUBLIC_DEV_NAV=true (development only)
// Link map: ว่างไว้ก่อน — Advisor ส่งรอบถัดไป
// ═══════════════════════════════════════════════════════════════

interface DevNavLink {
  label: string;
  href: string;
  group?: string;
}

// Link map — Advisor จะส่งมาในรอบถัดไป
const devNavLinks: DevNavLink[] = [];

const DEV_NAV_ENABLED = process.env.NEXT_PUBLIC_DEV_NAV === "true";

export function DevNav() {
  const [open, setOpen] = useState(false);

  // ซ่อนทั้งหมดถ้า flag ไม่เปิด
  if (!DEV_NAV_ENABLED) return null;

  // จัด group
  const groups = devNavLinks.reduce<Record<string, DevNavLink[]>>((acc, link) => {
    const g = link.group ?? "General";
    if (!acc[g]) acc[g] = [];
    acc[g].push(link);
    return acc;
  }, {});

  return (
    <>
      {/* Toggle button — fixed bottom-right */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Dev Navigator"
        className="fixed bottom-4 right-4 z-[9999] w-10 h-10 rounded-full bg-admin-primary text-white shadow-lg
                   flex items-center justify-center text-lg hover:bg-admin-dark transition-colors"
      >
        {open ? "✕" : "🧭"}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-16 right-4 z-[9998] w-72 max-h-[70vh] overflow-y-auto
                        bg-white border border-gray-200 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-admin-surface rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-admin-primary">🧭 Dev Navigator</span>
              <span className="text-xs bg-admin-primary text-white px-1.5 py-0.5 rounded font-mono">Admin</span>
            </div>
            <span className="text-xs text-gray-400 font-mono">
              {devNavLinks.length} links
            </span>
          </div>

          {/* Links */}
          <div className="p-3">
            {devNavLinks.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400">ยังไม่มี link</p>
                <p className="text-xs text-gray-300 mt-1">Advisor จะส่ง link map รอบถัดไป</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(groups).map(([groupName, links]) => (
                  <div key={groupName}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 px-1">
                      {groupName}
                    </p>
                    <div className="space-y-0.5">
                      {links.map(link => (
                        <a key={link.href} href={link.href}
                          className="block px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-admin-surface
                                     hover:text-admin-primary transition-colors truncate">
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <p className="text-xs text-gray-400 text-center">
              NEXT_PUBLIC_DEV_NAV=true · dev only
            </p>
          </div>
        </div>
      )}
    </>
  );
}
