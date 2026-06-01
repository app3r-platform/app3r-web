"use client";

// ============================================================
// components/listings/RoleSplitSections.tsx
// Role-aware "ของฉัน" sections for listings index pages (MOCKUP — stub data).
//  - WeeeU : "ที่ฉันประกาศ"          (รายการที่ผู้ใช้ลงประกาศ)
//  - WeeeR : "ที่ฉันยื่นข้อเสนอ"      (ประกาศที่ร้านยื่น offer)
// ใช้ useMockRole() เพื่อ react ต่อการสลับ role จาก DevAuthBanner โดยไม่ reload.
// ไม่มี DB จริง — counts/labels เป็น stub เท่านั้น.
// ============================================================
import { useMockRole } from "@/lib/auth/useMockRole";

interface StubItem {
  id: string;
  title: string;
  meta: string;
}

interface RoleSplitSectionsProps {
  /** ชื่อบริบท เช่น "ซ่อม" / "บำรุงรักษา" / "มือสอง" / "ซาก" */
  context: string;
  /** stub สำหรับ WeeeU — รายการที่ฉันประกาศ */
  myListings?: StubItem[];
  /** stub สำหรับ WeeeR — รายการที่ฉันยื่นข้อเสนอ */
  myOffers?: StubItem[];
  /** accent (on-brand เขียวเป็น default) */
  className?: string;
}

function StubList({
  heading,
  emptyText,
  items,
}: {
  heading: string;
  emptyText: string;
  items: StubItem[];
}) {
  return (
    <section className="mb-6 rounded-xl border border-website-brand-200 bg-website-brand-50/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-website-brand-800">{heading}</h3>
        <span className="rounded-full bg-website-brand-100 px-2 py-0.5 text-xs font-medium text-website-brand-700">
          {items.length} รายการ
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-gray-500">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
            >
              <span className="line-clamp-1 text-gray-800">{it.title}</span>
              <span className="ml-3 shrink-0 text-xs text-gray-500">{it.meta}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[11px] italic text-gray-400">
        * ตัวอย่าง (mock) — ยังไม่เชื่อมต่อข้อมูลจริง
      </p>
    </section>
  );
}

export default function RoleSplitSections({
  context,
  myListings = [],
  myOffers = [],
  className = "",
}: RoleSplitSectionsProps) {
  const { role, mounted } = useMockRole();

  // ก่อน mount หรือ anonymous/weeet — ไม่มี section ส่วนตัว
  if (!mounted || role === "anonymous" || role === "weeet") return null;

  return (
    <div className={className}>
      {role === "weeeu" && (
        <StubList
          heading={`ที่ฉันประกาศ (${context})`}
          emptyText={`คุณยังไม่มีประกาศ${context} — เริ่มลงประกาศได้เลย`}
          items={myListings}
        />
      )}
      {role === "weeer" && (
        <StubList
          heading={`ที่ฉันยื่นข้อเสนอ (${context})`}
          emptyText={`คุณยังไม่ได้ยื่นข้อเสนอกับประกาศ${context}ใด`}
          items={myOffers}
        />
      )}
    </div>
  );
}

// Re-export type for page-level stub construction
export type { StubItem };
