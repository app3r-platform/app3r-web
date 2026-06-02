"use client";
// EscrowInfo — ℹ️ tooltip/popover ข้างคำว่า "ระบบพักเงินกลาง (Escrow)" (A1 Batch3)
// ใช้ซ้ำทุกจุดที่มี Escrow mention (~26 จุด) — กัน regression จากการแก้แต่ละจุดแยก

import { useState } from "react";

const ESCROW_DESCRIPTION =
  "ระบบพักเงินกลาง (Escrow) คือบัญชีกลางที่ App3R ล็อกพอยต์ทอง (Gold Point) ของทั้งสองฝ่ายไว้ระหว่างธุรกรรม " +
  "เพื่อป้องกันการฉ้อโกง — พอยต์จะปลดล็อกอัตโนมัติเมื่องานเสร็จสมบูรณ์ หรือคืนให้ตามผลการตัดสินของ Admin";

export function EscrowInfoIcon({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        aria-label="อธิบาย Escrow"
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="text-weeeu-primary/70 hover:text-weeeu-primary text-xs leading-none focus:outline-none"
      >
        ℹ️
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50
                     w-64 bg-gray-900 text-white text-[11px] leading-relaxed
                     rounded-xl px-3 py-2 shadow-xl"
        >
          {ESCROW_DESCRIPTION}
          {/* arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}
