"use client";

/**
 * WeeeU — รายการซากของฉัน
 * S5: listing หมดอายุ — badge EXPIRED + ปุ่ม "ลงใหม่"
 * S6: WeeeU เห็น offer list → ปฏิเสธแต่ละข้อเสนอ (ไปที่ [id] page)
 * S10: ยกเลิกระหว่าง in_progress (ไปที่ [id] page)
 * S12: ซากจาก Repair C4 — badge "มาจากงานซ่อม"
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Mock types (เฟส 2 = mock state local — ไม่แตะ backend) ──────────────────
type ListingStatus =
  | "available"       // S1-S4 ปกติ
  | "pending_offer"   // รอ WeeeU เลือก offer
  | "accepted"        // เลือก offer แล้ว รอ WeeeT
  | "in_progress"     // WeeeT กำลังรับซาก (S10: ยกเลิกได้)
  | "completed"       // เสร็จแล้ว
  | "expired"         // S5: หมดอายุ ไม่มีคนสนใจ
  | "cancelled";      // ยกเลิกแล้ว

interface MyScrapListing {
  id: string;
  description: string;
  listingType: "sell" | "dispose";
  grade: "grade_A" | "grade_B" | "grade_C";
  price: number;
  status: ListingStatus;
  offerCount: number;
  expiredAt?: string;
  sourceRepairJobId?: string;   // S12 — จาก Repair C4
  createdAt: string;
}

// ── Mock data (ครอบทุกเคส S5/S6/S10/S12) ────────────────────────────────────
const MOCK_LISTINGS: MyScrapListing[] = [
  {
    id: "SCR-001",
    description: "ตู้เย็น Samsung 2 ประตู พัง มอเตอร์เสีย",
    listingType: "sell",
    grade: "grade_B",
    price: 800,
    status: "pending_offer",
    offerCount: 3,
    createdAt: "2026-05-20",
  },
  {
    id: "SCR-002",
    description: "แอร์ Mitsubishi 12000 BTU ซ่อมไม่คุ้ม → ทิ้งซาก",
    listingType: "sell",
    grade: "grade_C",
    price: 350,
    status: "in_progress",    // S10: มีปุ่มยกเลิก
    offerCount: 1,
    sourceRepairJobId: "REP-0042",   // S12: จาก Repair
    createdAt: "2026-05-18",
  },
  {
    id: "SCR-003",
    description: "เครื่องซักผ้า LG ฝาบน มอเตอร์เสีย",
    listingType: "dispose",
    grade: "grade_C",
    price: 0,
    status: "expired",        // S5: หมดอายุ ไม่มีร้านสนใจ
    offerCount: 0,
    expiredAt: "2026-05-15",
    createdAt: "2026-05-08",
  },
  {
    id: "SCR-004",
    description: "ทีวี Sony 40\" ภาพดับ บอร์ดพัง",
    listingType: "sell",
    grade: "grade_B",
    price: 500,
    status: "completed",
    offerCount: 2,
    createdAt: "2026-05-01",
  },
];

const STATUS_META: Record<ListingStatus, { label: string; color: string }> = {
  available:     { label: "รอข้อเสนอ",      color: "bg-gray-100 text-gray-500" },
  pending_offer: { label: "มีข้อเสนอ",      color: "bg-blue-100 text-blue-700" },
  accepted:      { label: "เลือกแล้ว",      color: "bg-weeeu-surface text-weeeu-dark" },
  in_progress:   { label: "กำลังดำเนินการ", color: "bg-orange-100 text-orange-700" },
  completed:     { label: "เสร็จสิ้น",      color: "bg-green-100 text-green-700" },
  expired:       { label: "หมดอายุ",        color: "bg-gray-200 text-gray-500" },
  cancelled:     { label: "ยกเลิกแล้ว",    color: "bg-red-100 text-red-500" },
};

const GRADE_META: Record<string, { label: string; color: string }> = {
  grade_A: { label: "A", color: "bg-green-100 text-green-700" },
  grade_B: { label: "B", color: "bg-yellow-100 text-yellow-700" },
  grade_C: { label: "C", color: "bg-red-100 text-red-500" },
};

export default function MyScrapListingsPage() {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<ListingStatus | "">("");
  const [renewing, setRenewing] = useState<string | null>(null);

  const filtered = filterStatus
    ? MOCK_LISTINGS.filter(l => l.status === filterStatus)
    : MOCK_LISTINGS;

  // S5 — "ลงใหม่" (renew expired listing)
  function handleRenew(id: string) {
    setRenewing(id);
    setTimeout(() => {
      alert(`✅ ลงประกาศใหม่ ${id} แล้ว — ระบบจะแจ้งเตือนเมื่อมีข้อเสนอ`);
      setRenewing(null);
    }, 800);
  }

  const expiredCount = MOCK_LISTINGS.filter(l => l.status === "expired").length;
  const offerCount   = MOCK_LISTINGS.filter(l => l.status === "pending_offer").length;

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">♻️ ซากของฉัน</h1>
          <p className="text-sm text-gray-500 mt-1">รายการประกาศซาก — ขาย/ทิ้ง</p>
        </div>
        <Link
          href="/scrap/new"
          className="flex items-center gap-2 bg-[#0DC36C] hover:bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          ➕ ประกาศซากใหม่
        </Link>
      </div>

      {/* Summary banners */}
      <div className="flex gap-3 flex-wrap">
        {offerCount > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
            <span className="text-blue-600 font-bold text-lg">{offerCount}</span>
            <span className="text-blue-700 text-sm">รายการรอเลือกข้อเสนอ</span>
          </div>
        )}
        {/* S5 — expired alert */}
        {expiredCount > 0 && (
          <div className="flex items-center gap-2 bg-gray-100 border border-gray-300 rounded-xl px-4 py-2">
            <span className="text-gray-500">⚪</span>
            <span className="text-gray-600 text-sm">{expiredCount} รายการหมดอายุ — กด "ลงใหม่" เพื่อประกาศอีกครั้ง</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit flex-wrap">
        {(["", "pending_offer", "in_progress", "expired", "completed"] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              filterStatus === s
                ? s === "expired"
                  ? "bg-gray-200 text-gray-600"
                  : "bg-[#0DC36C] text-white"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {s === "" ? "ทั้งหมด"
             : s === "pending_offer" ? "มีข้อเสนอ"
             : s === "in_progress"   ? "กำลังดำเนิน"
             : s === "expired"       ? "⚪ หมดอายุ"
             : "เสร็จสิ้น"}
          </button>
        ))}
      </div>

      {/* Listings */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">ยังไม่มีรายการในหมวดนี้</div>
        )}
        {filtered.map(item => {
          const sm = STATUS_META[item.status];
          const gm = GRADE_META[item.grade];
          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border shadow-sm p-4 space-y-3 ${
                item.status === "expired"
                  ? "border-gray-300 opacity-80"
                  : "border-gray-100"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Grade badge */}
                <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${gm.color}`}>
                  {gm.label}
                </span>

                {/* Description + source badge */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.description}</p>
                    {/* S12 — จาก Repair */}
                    {item.sourceRepairJobId && (
                      <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                        🔧 งานซ่อม #{item.sourceRepairJobId}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{item.listingType === "sell" ? "💰 ขาย" : "🆓 ทิ้ง"}</span>
                    {item.price > 0 && (
                      <span className="text-green-600 font-mono font-semibold">
                        {item.price.toLocaleString()} Gold
                      </span>
                    )}
                    <span>#{item.id}</span>
                  </div>
                </div>

                {/* Status */}
                <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${sm.color}`}>
                  {sm.label}
                </span>
              </div>

              {/* Offer count */}
              {item.offerCount > 0 && item.status === "pending_offer" && (
                <div className="flex items-center gap-2 text-xs bg-blue-50 rounded-xl px-3 py-2">
                  <span className="text-blue-500">🤝</span>
                  <span className="text-blue-700">{item.offerCount} ข้อเสนอรอการพิจารณา</span>
                  <Link href={`/scrap/${item.id}`}
                    className="ml-auto text-xs text-blue-600 font-medium hover:underline">
                    ดูและเลือก →
                  </Link>
                </div>
              )}

              {/* S5 — EXPIRED: ปุ่มลงใหม่ */}
              {item.status === "expired" && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-600">⚪ ประกาศหมดอายุ</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        หมดอายุเมื่อ {item.expiredAt ?? "—"} · ไม่มีร้านรับซากในเวลาที่กำหนด
                      </p>
                    </div>
                    <button
                      onClick={() => handleRenew(item.id)}
                      disabled={renewing === item.id}
                      className="ml-3 px-3 py-1.5 bg-[#0DC36C] hover:bg-green-600 text-white text-xs font-medium rounded-xl disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {renewing === item.id ? "กำลังลงใหม่..." : "🔄 ลงใหม่"}
                    </button>
                  </div>
                </div>
              )}

              {/* S10 — IN_PROGRESS: ปุ่มยกเลิก */}
              {item.status === "in_progress" && (
                <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                  <div className="text-xs text-orange-700">
                    🚚 ช่างกำลังเดินทางมารับซาก
                    {item.sourceRepairJobId && (
                      <span className="ml-2 text-orange-500">(จากงานซ่อม #{item.sourceRepairJobId})</span>
                    )}
                  </div>
                  <Link
                    href={`/scrap/${item.id}?action=cancel`}
                    className="ml-3 px-3 py-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs rounded-xl transition-colors whitespace-nowrap"
                  >
                    ยกเลิก
                  </Link>
                </div>
              )}

              {/* Default: ดูรายละเอียด */}
              {!["expired", "in_progress", "pending_offer"].includes(item.status) && (
                <div className="flex justify-end">
                  <Link href={`/scrap/${item.id}`}
                    className="text-xs text-[#0DC36C] hover:underline">
                    ดูรายละเอียด →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
