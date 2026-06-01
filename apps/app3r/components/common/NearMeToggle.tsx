"use client";

// ============================================================
// components/common/NearMeToggle.tsx — C4
// Stub geolocation toggle (MOCKUP — NO real GPS, no navigator.geolocation).
// New component (NearMeButton does real GPS + backend fetch — not reusable here).
// ============================================================
import { useState } from "react";

export interface NearMeToggleProps {
  /** สถานะเริ่มต้น */
  defaultOn?: boolean;
  /** เรียกเมื่อ toggle เปลี่ยน */
  onToggle?: (on: boolean) => void;
  /** ซ่อนหมายเหตุ mock (default แสดง) */
  hideMockNote?: boolean;
  className?: string;
}

export default function NearMeToggle({
  defaultOn = false,
  onToggle,
  hideMockNote = false,
  className = "",
}: NearMeToggleProps) {
  const [on, setOn] = useState(defaultOn);

  function handleClick() {
    const next = !on;
    setOn(next);
    onToggle?.(next);
  }

  return (
    <div className={className}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={handleClick}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${
          on
            ? "bg-website-brand-500 text-white"
            : "border border-website-brand-300 text-website-brand-700 hover:bg-website-brand-50"
        }`}
      >
        <span aria-hidden>📍</span>
        ใกล้ฉัน (Near me){on ? " · เปิด" : ""}
      </button>
      {!hideMockNote && (
        <p className="mt-1 text-xs text-gray-400 italic">
          * ตัวอย่าง (mock) — ยังไม่เชื่อมต่อ GPS จริง
        </p>
      )}
    </div>
  );
}
