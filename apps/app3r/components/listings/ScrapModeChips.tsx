"use client";

// ============================================================
// components/listings/ScrapModeChips.tsx — ซาก: ขาย / ทิ้ง split (MOCKUP)
// W-06 + W-13: filter chip แบ่ง "ขายซาก" vs "ทิ้งซาก".
// หมายเหตุ: mock data (ScrapListing) ยังไม่มี field แยกขาย/ทิ้ง → chips ตั้งค่า
// ?scrapMode= ใน URL เพื่อแสดง intent เท่านั้น (UI-only, ไม่กรองจริง).
// "ทิ้ง" = ฟรี · WeeeR เสียพอยต์เพื่อยื่นข้อเสนอ (ข้อความ UI เท่านั้น).
// ============================================================
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export type ScrapMode = "all" | "sell" | "free";

const MODES: { value: ScrapMode; label: string; hint: string }[] = [
  { value: "all", label: "ทั้งหมด", hint: "" },
  { value: "sell", label: "ขายซาก", hint: "ผู้ขายตั้งราคา/กก." },
  { value: "free", label: "ทิ้งซาก (ฟรี)", hint: "ทิ้งฟรี · WeeeR เสียพอยต์เพื่อยื่นข้อเสนอ" },
];

interface ScrapModeChipsProps {
  className?: string;
}

export default function ScrapModeChips({ className = "" }: ScrapModeChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("scrapMode") as ScrapMode) ?? "all";

  function handleSelect(mode: ScrapMode) {
    const params = new URLSearchParams(searchParams.toString());
    if (mode === "all") {
      params.delete("scrapMode");
    } else {
      params.set("scrapMode", mode);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  const activeClass = "bg-website-brand-700 text-white border-website-brand-700";
  const inactiveClass =
    "bg-white text-gray-700 border-gray-300 hover:border-website-brand-500";

  const activeHint = MODES.find((m) => m.value === current)?.hint;

  return (
    <div className={className}>
      <div className="flex gap-2 flex-wrap">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => handleSelect(m.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
              current === m.value ? activeClass : inactiveClass
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      {activeHint ? (
        <p className="mt-2 text-xs text-gray-500">{activeHint}</p>
      ) : null}
    </div>
  );
}
