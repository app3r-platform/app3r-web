"use client";

// ============================================================
// components/listings/ServiceTypeHelp.tsx — "?" popover อธิบายประเภทบริการ
// W-07: ปุ่ม ? ข้างหัวข้อ "ประเภทบริการ" อธิบาย 4 รูปแบบ (on-site/pickup/counter/shipping).
// ============================================================
import { useId, useState } from "react";
import { SERVICE_TYPES } from "../../lib/constants/service-types";

const DESCRIPTIONS: Record<number, string> = {
  1: "ช่างเดินทางมาซ่อมที่บ้าน/สถานที่ของคุณ",
  2: "ร้านมารับเครื่อง นำไปซ่อมที่ร้าน แล้วส่งคืน",
  3: "คุณนำเครื่องไปซ่อมที่หน้าร้านเอง",
  4: "ส่งเครื่องทางพัสดุ/ขนส่งไปซ่อมที่ร้าน",
};

export default function ServiceTypeHelp() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label="อธิบายประเภทบริการ"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-400 text-[10px] font-bold text-gray-600 hover:bg-gray-100"
      >
        ?
      </button>
      {open && (
        <span
          id={panelId}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1 w-72 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700 shadow-lg"
        >
          <span className="mb-2 block font-semibold text-gray-900">ประเภทบริการ (4 รูปแบบ)</span>
          <ul className="space-y-1.5">
            {Object.values(SERVICE_TYPES).map((st) => (
              <li key={st.id}>
                <span className="font-medium text-gray-900">{st.label}</span>
                {" — "}
                {DESCRIPTIONS[st.id]}
              </li>
            ))}
          </ul>
        </span>
      )}
    </span>
  );
}
