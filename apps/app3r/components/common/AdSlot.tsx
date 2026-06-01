// ============================================================
// components/common/AdSlot.tsx — C5
// Placeholder ad box (MOCKUP). Server-friendly — no "use client".
// ============================================================

export type AdSlotSize = "banner" | "sidebar" | "inline";

export interface AdSlotProps {
  /** ขนาดของช่องโฆษณา */
  size?: AdSlotSize;
  /** ป้ายกำกับเพิ่มเติม (เช่น ตำแหน่ง) */
  label?: string;
  className?: string;
}

const sizeClass: Record<AdSlotSize, string> = {
  banner: "h-24 w-full",
  sidebar: "h-64 w-full",
  inline: "h-32 w-full",
};

export default function AdSlot({ size = "banner", label, className = "" }: AdSlotProps) {
  return (
    <div
      role="complementary"
      aria-label="พื้นที่โฆษณา"
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-website-brand-300 bg-website-brand-50 text-center text-website-brand-700 ${sizeClass[size]} ${className}`}
    >
      <span className="text-sm font-medium">พื้นที่โฆษณา (ตัวอย่าง)</span>
      {label && <span className="mt-0.5 text-xs text-website-brand-600">{label}</span>}
    </div>
  );
}
