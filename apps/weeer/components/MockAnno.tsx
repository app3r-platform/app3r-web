"use client";
/**
 * MockAnno — annotation component สำหรับ WeeeR mockup pages (Phase 3 dev tool)
 *
 * dark theme (bg-gray-950) ตาม WeeeR app theme
 * ปิดอัตโนมัติเมื่อ NEXT_PUBLIC_DEV_NAV !== "true"
 *
 * ใช้เฉพาะ WeeeR — WeeeU ใช้ MockAnnoBar · WeeeT/Admin ใช้ MockAnno ของตัวเอง
 */

import { useState } from "react";

export interface MockAnnoNavItem {
  label: string;
  dest: string;
}

export interface MockAnnoCrossApp {
  app: "WeeeU" | "WeeeT" | "Admin" | "Website";
  desc: string;
}

export interface MockAnnoProps {
  caseId: string;
  screenId: string;
  origin?: string;
  nav?: MockAnnoNavItem[];
  crossApp?: MockAnnoCrossApp[];
}

const APP_COLOR: Record<string, string> = {
  WeeeU: "bg-green-900/50 text-green-300",
  WeeeT: "bg-gray-700 text-gray-300",
  Admin: "bg-purple-900/50 text-purple-300",
  Website: "bg-blue-900/50 text-blue-300",
};

export function MockAnno({ caseId, screenId, origin, nav, crossApp }: MockAnnoProps) {
  const [open, setOpen] = useState(false);

  if (process.env.NEXT_PUBLIC_DEV_NAV !== "true") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 font-mono text-[10px]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-1.5 bg-[#1696F9] text-white text-[10px] font-medium"
      >
        <span className="shrink-0">📐 mock-anno</span>
        <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px]">{screenId}</span>
        <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px]">เคส {caseId}</span>
        <span className="ml-auto">{open ? "▼" : "▲"}</span>
      </button>

      {open && (
        <div className="bg-gray-900 border-t-2 border-[#1696F9] px-3 py-2 space-y-2 max-h-48 overflow-y-auto">
          {origin && (
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-[#1696F9] font-bold">§5</span>
              <span className="text-gray-400">มาจาก: <span className="font-medium text-gray-200">{origin}</span></span>
            </div>
          )}
          {nav && nav.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-[#1696F9] font-bold">§6</span>
              <div className="flex flex-wrap gap-1">
                {nav.map((item, i) => (
                  <span key={i} className="bg-gray-800 border border-[#1696F9]/30 rounded px-1.5 py-0.5 text-gray-300">
                    {item.label} → <span className="font-medium text-[#1696F9]">{item.dest}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {crossApp && crossApp.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-[#1696F9] font-bold">§8</span>
              <div className="flex flex-wrap gap-1">
                {crossApp.map((item, i) => (
                  <span key={i} className={`rounded px-1.5 py-0.5 ${APP_COLOR[item.app] ?? "bg-gray-700 text-gray-300"}`}>
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
