"use client";
// JunctionPopup — [↔] dev overlay แสดง screen junction data 3 ส่วน
// เปิดจาก DevNav · render เฉพาะ NEXT_PUBLIC_DEV_NAV=true

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ALL_JUNCTIONS, type JunctionEntry } from "@/lib/junction-data";

function matchJunction(pathname: string): JunctionEntry | undefined {
  // ลอง exact match ก่อน ถ้าไม่ได้ลอง pattern match (replace dynamic segments)
  const normalized = pathname.replace(/\/[a-z0-9_-]+(?=\/|$)/gi, (seg, offset, str) => {
    // ถ้า segment ดูเหมือน ID (มีตัวเลข/dash แต่ไม่ใช่ keyword หน้าจอ)
    const keywords = ["jobs", "maintain", "parts", "scrap", "mockup", "catalog", "orders", "requests", "cart", "checkout", "pickup", "repair", "parcel", "delivery", "inspect", "arrive", "depart", "checklist", "complete", "diagnose", "schedule", "issue", "mismatch", "post-repair", "progress", "photo", "in-progress", "tested", "en-route", "arrived", "at-shop", "receipt", "success", "dashboard", "today", "wallet", "notifications", "profile", "reports", "settings", "listings", "login", "signup", "scrap-offer"];
    const bare = seg.replace(/^\//, "");
    return keywords.includes(bare) ? seg : "/[id]";
  });

  return ALL_JUNCTIONS.find(
    (j) => j.route === pathname || j.route === normalized
  );
}

export function JunctionPopup() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  if (process.env.NEXT_PUBLIC_DEV_NAV !== "true") return null;

  const entry = matchJunction(pathname);

  return (
    <>
      {/* [↔] trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Junction Map [↔]"
        className="fixed bottom-[52px] left-0 z-50 bg-gray-900/90 border-r border-t border-gray-700 text-[10px] font-mono text-weeet-primary px-2 py-1 rounded-tr-lg hover:bg-gray-800 transition-colors"
        aria-label="เปิด Junction Map"
      >
        ↔
      </button>

      {/* Popup */}
      {open && (
        <div
          className="fixed bottom-[68px] left-0 z-50 w-72 bg-gray-950 border border-gray-700 rounded-tr-2xl rounded-br-2xl shadow-2xl p-4 space-y-3 text-xs"
          role="dialog"
          aria-label="Junction Map"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-weeet-primary uppercase tracking-wider">
              ↔ Junction Map
            </p>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-white text-sm leading-none"
              aria-label="ปิด"
            >
              ✕
            </button>
          </div>

          {entry ? (
            <div className="space-y-3">
              {/* Screen ID */}
              <div className="flex items-center gap-2">
                <span className="bg-weeet-primary/20 text-weeet-primary px-2 py-0.5 rounded font-mono text-[10px]">
                  {entry.screenId}
                </span>
                <span className="text-gray-300 font-medium">{entry.label}</span>
              </div>

              {/* Section 1: Role */}
              <div className="space-y-1">
                <p className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">
                  📋 หน้าที่
                </p>
                <p className="text-gray-300 leading-relaxed">{entry.role}</p>
              </div>

              {/* Section 2: From */}
              <div className="space-y-1">
                <p className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">
                  ◀ มาจาก
                </p>
                <ul className="space-y-0.5">
                  {entry.from.map((f, i) => (
                    <li key={i} className="text-gray-400 flex gap-1">
                      <span className="text-gray-600 shrink-0">·</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 3: To */}
              <div className="space-y-1">
                <p className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">
                  ▶ ไปต่อ
                </p>
                <ul className="space-y-0.5">
                  {entry.to.map((t, i) => (
                    <li key={i} className="text-gray-400 flex gap-1">
                      <span className="text-gray-600 shrink-0">·</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cross-app (optional) */}
              {entry.xapp && entry.xapp.length > 0 && (
                <div className="space-y-1 border-t border-gray-800 pt-2">
                  <p className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">
                    🔗 Cross-App
                  </p>
                  <ul className="space-y-0.5">
                    {entry.xapp.map((x, i) => (
                      <li key={i} className="text-gray-500 flex gap-1">
                        <span className="text-gray-600 shrink-0">·</span>
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-500">ไม่พบ Junction data สำหรับ</p>
              <p className="font-mono text-gray-400 bg-gray-900 px-2 py-1 rounded text-[10px]">
                {pathname}
              </p>
              <p className="text-gray-600 text-[10px]">
                เพิ่มใน lib/junction-data.ts
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
