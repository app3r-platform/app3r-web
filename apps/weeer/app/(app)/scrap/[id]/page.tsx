"use client";

// ── WeeeR Scrap Detail + Offer — 2.3 Mockup (S1-S4, S8, S12) ─────────────

import { use, useState } from "react";
import Link from "next/link";
import type { ScrapItem, ConditionGrade } from "../_lib/types";
import { CONDITION_GRADE_LABEL, CONDITION_GRADE_COLOR } from "../_lib/types";

// ── Mock ScrapItems (same dataset as feed, keyed by id) ───────────────────
const MOCK_ITEMS: Record<string, ScrapItem> = {
  SC001: {
    id: "SC001", sellerId: "U101", sellerType: "WeeeU",
    applianceName: "Samsung เครื่องซักผ้า WW12T", applianceBrand: "Samsung", applianceType: "washing_machine",
    conditionGrade: "grade_A", workingParts: ["มอเตอร์", "แผงควบคุม", "ฝาปิด", "ถังซัก"],
    description: "ซากเครื่องซักผ้า Samsung สภาพดี มอเตอร์ยังใช้ได้ อะไหล่ครบ ไม่มีรอยสนิม",
    photos: [], price: 1200, isFree: false, status: "available",
    createdAt: "2026-05-20", updatedAt: "2026-05-22",
  },
  SC002: {
    id: "SC002", sellerId: "U102", sellerType: "WeeeU",
    applianceName: "Daikin แอร์ FTKF25XV2S", applianceBrand: "Daikin", applianceType: "ac",
    conditionGrade: "grade_B", workingParts: ["คอมเพรสเซอร์", "พัดลม"],
    description: "แอร์เก่าถอดออกจากห้องพัก คอมเพรสเซอร์ยังดี เหมาะซ่อมขายต่อ",
    photos: [], price: 800, isFree: false, status: "available",
    createdAt: "2026-05-19", updatedAt: "2026-05-21",
  },
  SC003: {
    id: "SC003", sellerId: "U103", sellerType: "WeeeU",
    applianceName: "ตู้เย็น LG GN-B202SQBB", applianceBrand: "LG", applianceType: "refrigerator",
    conditionGrade: "grade_C", workingParts: ["ชั้นวาง", "ลิ้นชัก"],
    description: "ตู้เย็นเสีย ถอดชิ้นส่วนได้ ไม่รวมคอมเพรสเซอร์ ทิ้งฟรี",
    photos: [], price: 0, isFree: true, status: "available",
    createdAt: "2026-05-18", updatedAt: "2026-05-22",
  },
  SC004: {
    id: "SC004", sellerId: "U104", sellerType: "WeeeU",
    applianceName: "HP Notebook 15s-fq5xxx", applianceBrand: "HP", applianceType: "notebook",
    conditionGrade: "grade_B", workingParts: ["RAM 8GB", "SSD 512GB", "จอ 15.6\""],
    description: "โน้ตบุ๊กซากจากงานซ่อม — มาจากงาน Repair #R-2024-089 อะไหล่ยังดีหลายชิ้น",
    photos: [], price: 1500, isFree: false, status: "available",
    fromRepairJobId: "R-2024-089",
    createdAt: "2026-05-17", updatedAt: "2026-05-22",
  },
  SC005: {
    id: "SC005", sellerId: "U105", sellerType: "WeeeU",
    applianceName: "Panasonic เครื่องซักผ้า NA-F70LG1", applianceBrand: "Panasonic", applianceType: "washing_machine",
    conditionGrade: "grade_A", workingParts: ["มอเตอร์", "ปั๊มน้ำ", "ฝาบน"],
    description: "ซากเครื่องซักผ้าฝาบน อะไหล่ครบ สภาพดีมาก",
    photos: [], price: 950, isFree: false, status: "available",
    createdAt: "2026-05-16", updatedAt: "2026-05-21",
  },
  SC006: {
    id: "SC006", sellerId: "U106", sellerType: "WeeeU",
    applianceName: "Mitsubishi แอร์ MS-GK13VF", applianceBrand: "Mitsubishi", applianceType: "ac",
    conditionGrade: "grade_C", workingParts: ["พัดลม", "แผงวงจร"],
    description: "แอร์เก่ามาก ทิ้งฟรี รับเองที่บ้าน",
    photos: [], price: 0, isFree: true, status: "available",
    createdAt: "2026-05-15", updatedAt: "2026-05-20",
  },
};

// ── Mock job ID generator ─────────────────────────────────────────────────
function makeMockJobId(scrapItemId: string) {
  return `SJ-${scrapItemId}-${Date.now().toString(36).toUpperCase()}`;
}

export default function ScrapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const item = MOCK_ITEMS[id] ?? null;

  // Offer form state (S1-S4)
  const [showForm, setShowForm] = useState(false);
  const [offerPrice, setOfferPrice] = useState(item?.isFree ? "0" : String(item?.price ?? ""));
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successJobId, setSuccessJobId] = useState<string | null>(null);
  const [offerError, setOfferError] = useState("");

  // Escrow mock state (S3)
  const [escrowLocked, setEscrowLocked] = useState(false);

  function handleSubmitOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    if (!item.isFree && (!offerPrice || Number(offerPrice) <= 0)) {
      setOfferError("กรุณาระบุราคาที่ถูกต้อง");
      return;
    }
    setSubmitting(true);
    setOfferError("");
    // Mock: simulate API call + escrow lock
    setTimeout(() => {
      const jobId = makeMockJobId(item.id);
      setEscrowLocked(true);
      setSuccessJobId(jobId);
      setShowForm(false);
      setSubmitting(false);
    }, 800);
  }

  if (!item) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/scrap" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-xl font-bold text-gray-900">ไม่พบซาก</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">
          ⚠️ ไม่พบซาก ID: {id}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/scrap" className="text-gray-400 hover:text-gray-600">←</Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{item.applianceName}</h1>
        </div>
        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${CONDITION_GRADE_COLOR[item.conditionGrade]}`}>
          {CONDITION_GRADE_LABEL[item.conditionGrade]}
        </span>
      </div>

      {/* S12: Repair source badge */}
      {item.fromRepairJobId && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
          <p className="text-xs font-semibold text-orange-800">
            🔧 ซากนี้มาจากงาน Repair #{item.fromRepairJobId}
          </p>
          <p className="text-xs text-orange-600 mt-0.5">ประวัติการซ่อมสามารถตรวจสอบได้ใน WeeeT</p>
        </div>
      )}

      {/* Free badge */}
      {item.isFree && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
          <p className="text-xs font-semibold text-emerald-800">🆓 ซากนี้ทิ้งฟรี — ไม่มีค่าใช้จ่าย</p>
          <p className="text-xs text-emerald-600 mt-0.5">WeeeU ต้องการกำจัดอย่างถูกต้อง คุณรับซากได้เลยโดยไม่เสีย pts</p>
        </div>
      )}

      {/* Info card */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">ราคา</p>
            <p className="text-2xl font-bold text-[#FF663A]">
              {item.isFree ? "ฟรี" : `${item.price.toLocaleString()} pts`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">เกรด</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONDITION_GRADE_COLOR[item.conditionGrade]}`}>
              {CONDITION_GRADE_LABEL[item.conditionGrade]}
            </span>
          </div>
          {item.applianceBrand && (
            <div><p className="text-xs text-gray-400">ยี่ห้อ</p><p className="font-medium">{item.applianceBrand}</p></div>
          )}
          {item.applianceType && (
            <div><p className="text-xs text-gray-400">ประเภท</p><p className="font-medium">{item.applianceType}</p></div>
          )}
        </div>

        <div className="border-t border-gray-50 pt-3">
          <p className="text-xs text-gray-400 mb-1.5">อะไหล่ที่ยังใช้ได้</p>
          <div className="flex flex-wrap gap-1.5">
            {item.workingParts.map(p => (
              <span key={p} className="text-xs bg-[#FCEAE3] text-[#4A1B0C] border border-[#FFD5C4] px-2 py-0.5 rounded">
                ✓ {p}
              </span>
            ))}
          </div>
        </div>

        {item.description && (
          <div className="border-t border-gray-50 pt-3">
            <p className="text-xs text-gray-400 mb-1">รายละเอียด</p>
            <p className="text-gray-700 text-sm">{item.description}</p>
          </div>
        )}
      </div>

      {/* Escrow locked (S3) */}
      {escrowLocked && successJobId && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center space-y-2">
          <span className="text-3xl">🔐</span>
          <p className="text-sm font-bold text-purple-800">Gold ถูก Lock แล้ว (Escrow)</p>
          <p className="text-xs text-purple-600">
            {item.isFree
              ? "รอ WeeeU ยืนยันการรับซาก"
              : `${Number(offerPrice).toLocaleString()} pts ถูก lock ไว้ รอ WeeeU ยืนยัน`}
          </p>
          <Link href={`/scrap/jobs/${successJobId}`}
            className="inline-block mt-1 text-xs bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold px-4 py-2 rounded-lg transition-colors">
            ดูงาน {successJobId} →
          </Link>
        </div>
      )}

      {/* Offer form / button (S1-S2) */}
      {!escrowLocked && item.status === "available" && (
        <>
          {!showForm ? (
            <button onClick={() => setShowForm(true)}
              className="w-full bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold py-3 rounded-xl transition-colors">
              {item.isFree ? "🆓 รับซากฟรี" : "🤝 ยื่นข้อเสนอรับซาก"}
            </button>
          ) : (
            <form onSubmit={handleSubmitOffer}
              className="bg-[#FCEAE3] border border-[#FFD5C4] rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-[#4A1B0C]">
                {item.isFree ? "ยืนยันรับซากฟรี" : "ยื่นข้อเสนอรับซาก"}
              </p>

              {/* S2b: isFree → hide price field */}
              {!item.isFree && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    ราคาที่เสนอ (pts) — ราคาตั้ง: {item.price.toLocaleString()} pts
                  </label>
                  <input
                    type="number" min={1} value={offerPrice}
                    onChange={e => setOfferPrice(e.target.value)}
                    required
                    className="w-full border border-[#FFD5C4] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]/30"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-600 mb-1">ข้อความ (ถ้ามี)</label>
                <input
                  type="text" value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="ข้อความถึง WeeeU"
                  className="w-full border border-[#FFD5C4] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]/30"
                />
              </div>

              {/* Escrow notice */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                <p className="text-xs text-purple-700 font-medium">
                  🔐 เมื่อยืนยัน — Gold {item.isFree ? "0" : `${offerPrice || "?"}`} pts จะถูก Lock (Escrow)
                </p>
                <p className="text-xs text-purple-500 mt-0.5">
                  Gold จะโอนให้ WeeeU เมื่อรับซากเสร็จ · คืนถ้าถอน (S7)
                </p>
              </div>

              {offerError && <p className="text-xs text-red-500">{offerError}</p>}

              <div className="flex gap-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
                  {submitting ? "กำลังส่ง…" : "✅ ยืนยัน + Lock Escrow"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setOfferError(""); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  ยกเลิก
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {item.status !== "available" && !escrowLocked && (
        <div className="text-center py-3 text-sm text-gray-400">ซากนี้ไม่พร้อมรับข้อเสนอในขณะนี้</div>
      )}
    </div>
  );
}
