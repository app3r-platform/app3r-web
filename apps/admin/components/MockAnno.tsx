"use client";
/**
 * MockAnno — annotation component สำหรับ Admin mockup pages (Phase 3 dev tool)
 *
 * light admin theme (white bg · purple accent)
 * ปิดอัตโนมัติเมื่อ NEXT_PUBLIC_DEV_NAV !== "true"
 *
 * ใช้เฉพาะ Admin — WeeeU ใช้ MockAnnoBar · WeeeR/WeeeT ใช้ MockAnno ของตัวเอง
 */

import { useState } from "react";

export interface MockAnnoNavItem {
  label: string;
  dest: string;
}

export interface MockAnnoCrossApp {
  app: "WeeeU" | "WeeeR" | "WeeeT" | "Website";
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
  WeeeU: "bg-green-100 text-green-700",
  WeeeR: "bg-blue-100 text-blue-700",
  WeeeT: "bg-amber-100 text-amber-700",
  Website: "bg-teal-100 text-teal-700",
};

export function MockAnno({ caseId, screenId, origin, nav, crossApp }: MockAnnoProps) {
  const [open, setOpen] = useState(false);

  if (process.env.NEXT_PUBLIC_DEV_NAV !== "true") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 font-mono text-[10px]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-1.5 bg-purple-700 text-white text-[10px] font-medium"
      >
        <span className="shrink-0">📐 mock-anno</span>
        <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px]">{screenId}</span>
        <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px]">เคส {caseId}</span>
        <span className="ml-auto">{open ? "▼" : "▲"}</span>
      </button>

      {open && (
        <div className="bg-white border-t-2 border-purple-700 px-3 py-2 space-y-2 max-h-48 overflow-y-auto shadow-lg">
          {origin && (
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-purple-700 font-bold">§5</span>
              <span className="text-gray-600">มาจาก: <span className="font-medium text-gray-900">{origin}</span></span>
            </div>
          )}
          {nav && nav.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-purple-700 font-bold">§6</span>
              <div className="flex flex-wrap gap-1">
                {nav.map((item, i) => (
                  <span key={i} className="bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5 text-gray-700">
                    {item.label} → <span className="font-medium text-purple-700">{item.dest}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {crossApp && crossApp.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-purple-700 font-bold">§8</span>
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
