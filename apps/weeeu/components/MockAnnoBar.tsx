"use client";
/**
 * MockAnnoBar — annotation bar สำหรับ WeeeU mockup pages (Phase 3 dev tool)
 *
 * แสดงข้อมูล annotation §5/§6/§8 ในแถบล่างหน้าจอ mockup
 * ปิดอัตโนมัติเมื่อ NEXT_PUBLIC_DEV_NAV !== "true"
 *
 * ใช้เฉพาะ WeeeU (light theme · weeeu-primary)
 * WeeeR/WeeeT/Admin → ใช้ MockAnno ของแอปตัวเอง
 */

import { useState } from "react";

export interface MockAnnoNavItem {
  label: string;    // ข้อความปุ่ม / action
  dest: string;     // screen ID หรือ route ปลายทาง
}

export interface MockAnnoCrossApp {
  app: "WeeeR" | "WeeeT" | "Admin" | "Website";
  desc: string;     // อธิบาย cross-app view ที่เห็น
}

export interface MockAnnoBarProps {
  caseId: string;          // "M3"
  screenId: string;        // "U-16/m3"
  origin?: string;         // §5: มาจากจอไหน
  nav?: MockAnnoNavItem[]; // §6: ปลายทาง navigation
  crossApp?: MockAnnoCrossApp[]; // §8: cross-app views
}

const APP_COLOR: Record<string, string> = {
  WeeeR: "bg-blue-100 text-blue-700",
  WeeeT: "bg-gray-800 text-gray-200",
  Admin: "bg-purple-100 text-purple-700",
  Website: "bg-green-100 text-green-700",
};

export function MockAnnoBar({ caseId, screenId, origin, nav, crossApp }: MockAnnoBarProps) {
  const [open, setOpen] = useState(false);

  if (process.env.NEXT_PUBLIC_DEV_NAV !== "true") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 font-mono text-[10px]">
      {/* Toggle bar */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-1.5 bg-[#0DC36C] text-white text-[10px] font-medium"
      >
        <span className="shrink-0">📐 mock-anno</span>
        <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px]">{screenId}</span>
        <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px]">เคส {caseId}</span>
        <span className="ml-auto">{open ? "▼" : "▲"}</span>
      </button>

      {/* Expanded panel */}
      {open && (
        <div className="bg-[#ECFDF5] border-t-2 border-[#0DC36C] px-3 py-2 space-y-2 max-h-48 overflow-y-auto">
          {/* §5 Origin */}
          {origin && (
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-[#0A9B55] font-bold">§5</span>
              <span className="text-gray-700">มาจาก: <span className="font-medium text-gray-900">{origin}</span></span>
            </div>
          )}

          {/* §6 Nav */}
          {nav && nav.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-[#0A9B55] font-bold">§6</span>
              <div className="flex flex-wrap gap-1">
                {nav.map((item, i) => (
                  <span key={i} className="bg-white border border-[#0DC36C]/40 rounded px-1.5 py-0.5 text-gray-700">
                    {item.label} → <span className="font-medium text-[#0A9B55]">{item.dest}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* §8 Cross-App */}
          {crossApp && crossApp.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-[#0A9B55] font-bold">§8</span>
              <div className="flex flex-wrap gap-1">
                {crossApp.map((item, i) => (
                  <span key={i} className={`rounded px-1.5 py-0.5 ${APP_COLOR[item.app] ?? "bg-gray-100 text-gray-700"}`}>
                    <span className="font-bold">{item.app}</span>: {item.desc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
