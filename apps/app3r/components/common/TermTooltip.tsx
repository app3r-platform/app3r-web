"use client";

// ============================================================
// components/common/TermTooltip.tsx — C2
// Inline term with ⓘ icon; click to reveal Thai + English explanation.
// Central copy table exported for reuse/extension.
// ============================================================
import { useId, useState } from "react";

export interface TermCopy {
  /** ป้ายที่แสดง inline (ไทย + อังกฤษในวงเล็บ) */
  label: string;
  /** คำอธิบายแบบเต็ม */
  explanation: string;
}

/**
 * Central copy table — เพิ่ม term ใหม่ได้ที่นี่ที่เดียว
 * (keyof จะ propagate ไปเป็น TermTooltipProps["term"] อัตโนมัติ)
 */
export const TERM_COPY = {
  offer: {
    label: "ข้อเสนอ (offer)",
    explanation:
      "ข้อเสนอราคา/เงื่อนไขที่ร้าน (WeeeR) ยื่นให้กับประกาศของผู้ใช้ — เจ้าของประกาศเลือกข้อเสนอที่พอใจได้",
  },
  escrow: {
    label: "ระบบพักเงินกลาง (Escrow)",
    explanation:
      "เงินพักไว้กับระบบกลางจนงานเสร็จและคุณยืนยันรับ — หากมีปัญหาได้เงินคืน",
  },
  gold: {
    label: "พอยต์โกลด์ (Gold)",
    explanation:
      "แต้มมูลค่าเทียบเท่าเงินสดในระบบ ใช้ชำระค่าบริการ/ค่าธรรมเนียม — เติม/ถอนได้ตามเงื่อนไข",
  },
  silver: {
    label: "พอยต์ซิลเวอร์ (Silver)",
    explanation:
      "แต้มสะสมจากกิจกรรม ใช้แลกสิทธิประโยชน์ ไม่สามารถถอนเป็นเงินสดได้",
  },
} as const satisfies Record<string, TermCopy>;

export type TermKey = keyof typeof TERM_COPY;

export interface TermTooltipProps {
  /** คีย์ของ term ในตาราง TERM_COPY */
  term: TermKey;
  /** override ป้ายที่แสดง inline (ค่าเริ่มต้น = TERM_COPY[term].label) */
  label?: string;
  className?: string;
}

export default function TermTooltip({ term, label, className = "" }: TermTooltipProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const copy = TERM_COPY[term];
  const display = label ?? copy.label;

  return (
    <span className={`relative inline-flex items-center gap-1 ${className}`}>
      <span className="text-website-brand-700 font-medium">{display}</span>
      <button
        type="button"
        aria-label={`อธิบายคำว่า ${copy.label}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-website-brand-400 text-[10px] font-bold text-website-brand-600 hover:bg-website-brand-50"
      >
        ⓘ
      </button>
      {open && (
        <span
          id={panelId}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700 shadow-lg"
        >
          <span className="mb-1 block font-semibold text-gray-900">{copy.label}</span>
          {copy.explanation}
        </span>
      )}
    </span>
  );
}
