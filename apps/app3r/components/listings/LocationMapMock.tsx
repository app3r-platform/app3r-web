// ============================================================
// components/listings/LocationMapMock.tsx
// MOCKUP map embed — a placeholder map box with a pin marker.
// ⚠️ ไม่เรียก Google Maps / API / key ใดๆ — เป็นภาพจำลองล้วน (mock)
// Server-friendly (no "use client").
// ============================================================

interface LocationMapMockProps {
  /** ชื่อพื้นที่/จังหวัด แสดงใต้หมุด (เช่น 'กรุงเทพมหานคร') */
  area: string;
  /** ที่ตั้งแบบละเอียด (เขต/ตำบล/ที่อยู่) — optional */
  detail?: string;
  className?: string;
}

export default function LocationMapMock({ area, detail, className = "" }: LocationMapMockProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">ตำแหน่งที่ตั้ง</h2>
        <span className="text-[11px] text-gray-400">ตัวอย่างแผนที่ (mock)</span>
      </div>

      {/* Mock map canvas — grid + roads + pin marker (ไม่ใช่แผนที่จริง) */}
      <div
        role="img"
        aria-label={`แผนที่ตัวอย่างแสดงตำแหน่งโดยประมาณ: ${area}${detail ? ` (${detail})` : ""}`}
        className="relative h-56 w-full bg-website-brand-50"
        style={{
          backgroundImage:
            "linear-gradient(#d1d5db 1px, transparent 1px), linear-gradient(90deg, #d1d5db 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        {/* mock roads */}
        <div className="absolute left-0 right-0 top-1/2 h-3 -translate-y-1/2 bg-white/70" />
        <div className="absolute top-0 bottom-0 left-1/3 w-3 bg-white/70" />

        {/* center pin marker */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center">
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="drop-shadow"
          >
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              fill="#1E9E5A"
            />
            <circle cx="12" cy="9" r="2.5" fill="#ffffff" />
          </svg>
          <span className="mt-0.5 rounded bg-white/90 px-2 py-0.5 text-[11px] font-medium text-gray-800 shadow-sm">
            {area}
          </span>
        </div>
      </div>

      <div className="px-4 py-3 text-xs text-gray-500 leading-relaxed">
        {detail ? <span className="text-gray-700">{detail} · </span> : null}
        {/* PHASE-4: real map/nav (Phase D) */}
        ตำแหน่งโดยประมาณเพื่อความเป็นส่วนตัว — แผนที่จริงและการนำทางเปิดใช้งานเร็วๆ นี้
      </div>
    </div>
  );
}
