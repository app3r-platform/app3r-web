"use client";

/**
 * WeeeU — รายละเอียดซาก + Offer List
 * S6:  ปุ่ม "ปฏิเสธ offer" แต่ละข้อเสนอ → dialog กรอกเหตุผล + confirm
 * S8:  notification "ช่างรายงานของไม่ตรง" → ยินยอม (ปรับราคา) / โต้แย้ง (dispute)
 * S9:  notification "ช่างมาไม่พบคุณ" + ตัวเลือก นัดใหม่ / ยกเลิก
 * S10: ปุ่ม "ยกเลิก" ระหว่าง in_progress → dialog + เหตุผล
 * S12: badge "มาจากงานซ่อม #xxx"
 */

import { Suspense, use, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// ── Mock types ────────────────────────────────────────────────────────────────
interface ScrapOffer {
  id: string;
  weeerId: string;
  weeerName: string;
  weeerRating: number;
  offeredPrice: number;
  estimatedPickupDate: string;
  decision: "resell_parts" | "dispose" | "resell_as_scrap";
  notes: string;
  status: "pending" | "declined" | "accepted";
}

interface MismatchReport {
  reportedAt: string;
  weeeTName: string;
  originalPrice: number;
  proposedPrice: number;
  reason: string;
  photos: string[];
}

interface NoShowEvent {
  reportedAt: string;
  weeeTName: string;
  notes: string;
}

interface ScrapListingDetail {
  id: string;
  description: string;
  grade: "grade_A" | "grade_B" | "grade_C";
  listingType: "sell" | "dispose";
  price: number;
  status: "available" | "pending_offer" | "accepted" | "in_progress" | "completed" | "expired" | "cancelled";
  createdAt: string;
  sourceRepairJobId?: string;
  offers: ScrapOffer[];
  mismatchReport?: MismatchReport;
  noShowEvent?: NoShowEvent;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
function getMockListing(id: string): ScrapListingDetail {
  return {
    id,
    description: "แอร์ Mitsubishi 12000 BTU ซ่อมไม่คุ้ม",
    grade: "grade_C",
    listingType: "sell",
    price: 350,
    status: "in_progress",  // เปลี่ยนได้ตาม mock scenario
    createdAt: "2026-05-18",
    sourceRepairJobId: "REP-0042",
    offers: [
      {
        id: "OFR-001",
        weeerId: "WR-5541",
        weeerName: "ร้านซากดี จำกัด",
        weeerRating: 4.8,
        offeredPrice: 380,
        estimatedPickupDate: "2026-05-26",
        decision: "resell_parts",
        notes: "สนใจแยกอะไหล่คอมเพรสเซอร์ พาวเวอร์บอร์ด",
        status: "pending",
      },
      {
        id: "OFR-002",
        weeerId: "WR-2207",
        weeerName: "รับซากทั่วไทย",
        weeerRating: 4.2,
        offeredPrice: 310,
        estimatedPickupDate: "2026-05-27",
        decision: "dispose",
        notes: "รับทิ้ง E-Waste พร้อมออก Certificate",
        status: "pending",
      },
    ],
    // S8 — mismatch report demo (MOCK — remove before prod)
    mismatchReport: {
      reportedAt: "2026-05-25T14:30:00",
      weeeTName: "ช่างสมศักดิ์ มานะดี",
      originalPrice: 350,
      proposedPrice: 220,
      reason: "คอมเพรสเซอร์หายไป — ซากสภาพแย่กว่ารูปประกาศ ไม่ตรงกับที่ระบุไว้",
      photos: ["/mock/mismatch-weeet-1.jpg"],
    },
    // S9 — no-show event demo (MOCK — remove before prod)
    // noShowEvent: {        ← uncomment บรรทัดนี้เพื่อ demo S9 แทน S8
    //   reportedAt: "2026-05-25T16:00:00",
    //   weeeTName: "ช่างสมศักดิ์ มานะดี",
    //   notes: "โทรไม่ติด ไม่มีคนอยู่บ้าน รอ 20 นาทีแล้ว",
    // },
  };
}

const DECISION_LABEL: Record<string, string> = {
  resell_parts:    "แยกอะไหล่ขาย",
  dispose:         "ทิ้ง / E-Waste",
  resell_as_scrap: "ขายต่อซาก",
  repair_and_sell: "ซ่อมขาย",
};

const GRADE_META: Record<string, { label: string; color: string }> = {
  grade_A: { label: "Grade A", color: "bg-green-100 text-green-700" },
  grade_B: { label: "Grade B", color: "bg-yellow-100 text-yellow-700" },
  grade_C: { label: "Grade C", color: "bg-red-100 text-red-500" },
};

// ── Inner component (ใช้ useSearchParams — ต้อง wrap ด้วย Suspense) ──────────
function ScrapListingDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");

  const [listing, setListing] = useState<ScrapListingDetail>(() => getMockListing(id));
  const [submitting, setSubmitting] = useState(false);

  // S6 — Decline offer dialog state
  const [declineOfferId, setDeclineOfferId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  // S8 — Mismatch response
  const [mismatchAction, setMismatchAction] = useState<"accept" | "dispute" | null>(null);

  // S9 — No-show response
  const [noShowAction, setNoShowAction] = useState<"reschedule" | "cancel" | null>(null);

  // S10 — Cancel listing dialog
  const [showCancelDialog, setShowCancelDialog] = useState(actionParam === "cancel");
  const [cancelReason, setCancelReason] = useState("");

  const gm = GRADE_META[listing.grade];

  // S6 — ปฏิเสธ offer
  function handleDeclineConfirm() {
    if (!declineOfferId || !declineReason.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setListing(prev => ({
        ...prev,
        offers: prev.offers.map(o =>
          o.id === declineOfferId ? { ...o, status: "declined" as const } : o
        ),
      }));
      setDeclineOfferId(null);
      setDeclineReason("");
      setSubmitting(false);
      // ถ้าปฏิเสธหมดทุกข้อเสนอ → แสดง option ลงใหม่
    }, 700);
  }

  // S6 — รับ offer
  function handleAcceptOffer(offerId: string) {
    setSubmitting(true);
    setTimeout(() => {
      setListing(prev => ({
        ...prev,
        status: "accepted",
        offers: prev.offers.map(o => ({
          ...o,
          status: o.id === offerId ? "accepted" as const : "declined" as const,
        })),
      }));
      setSubmitting(false);
    }, 700);
  }

  // S8 — ยินยอมปรับราคา
  function handleMismatchAccept() {
    setSubmitting(true);
    setTimeout(() => {
      if (listing.mismatchReport) {
        setListing(prev => ({ ...prev, price: prev.mismatchReport!.proposedPrice }));
      }
      setMismatchAction(null);
      setSubmitting(false);
      alert("✅ ยืนยันราคาใหม่แล้ว — ดำเนินการต่อ");
    }, 700);
  }

  // S9 — นัดใหม่
  function handleReschedule() {
    setSubmitting(true);
    setTimeout(() => {
      setNoShowAction(null);
      setSubmitting(false);
      alert("📅 ส่งคำขอนัดใหม่แล้ว — ช่างจะติดต่อกลับ");
    }, 700);
  }

  // S10 — ยกเลิก
  function handleCancelConfirm() {
    if (!cancelReason.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setListing(prev => ({ ...prev, status: "cancelled" }));
      setShowCancelDialog(false);
      setSubmitting(false);
      router.push("/scrap");
    }, 900);
  }

  const pendingOffers = listing.offers.filter(o => o.status === "pending");
  const allDeclined = listing.offers.length > 0 && listing.offers.every(o => o.status === "declined");

  return (
    <div className="max-w-xl space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/scrap" className="text-gray-400 hover:text-gray-700 text-xl">‹</Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">รายละเอียดซาก</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full ${gm.color}`}>{gm.label}</span>
            {/* S12 — จาก Repair */}
            {listing.sourceRepairJobId && (
              <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">
                🔧 งานซ่อม #{listing.sourceRepairJobId}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">#{id}</p>
        </div>
      </div>

      {/* S12 — Repair source banner */}
      {listing.sourceRepairJobId && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-800">
                🔧 ซากจากงานซ่อม #{listing.sourceRepairJobId}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                ช่างวินิจฉัย "ซ่อมไม่คุ้ม" → ซากถูกโอนเข้าระบบซาก (B2.2 path)
              </p>
            </div>
            <Link href={`/jobs/${listing.sourceRepairJobId}`}
              className="text-xs text-orange-600 bg-white border border-orange-200 px-3 py-1.5 rounded-xl hover:bg-orange-100 whitespace-nowrap">
              ดูงานซ่อม ↗
            </Link>
          </div>
        </div>
      )}

      {/* S8 — Mismatch notification */}
      {listing.mismatchReport && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-yellow-500 text-xl">⚠️</span>
            <div>
              <p className="text-sm font-bold text-yellow-800">ช่างรายงาน: ซากไม่ตรงประกาศ</p>
              <p className="text-xs text-yellow-700 mt-0.5">
                {listing.mismatchReport.weeeTName} · {new Date(listing.mismatchReport.reportedAt).toLocaleString("th-TH")}
              </p>
            </div>
          </div>
          <p className="text-sm text-yellow-800 bg-yellow-100 rounded-xl px-3 py-2">
            {listing.mismatchReport.reason}
          </p>
          <div className="flex items-center gap-2 text-xs text-yellow-700">
            <span>ราคาเดิม:</span>
            <span className="font-mono line-through">{listing.mismatchReport.originalPrice} พอยต์ทอง (Gold Point)</span>
            <span>→ ราคาใหม่ที่เสนอ:</span>
            <span className="font-mono font-bold text-yellow-800">{listing.mismatchReport.proposedPrice} พอยต์ทอง</span>
          </div>
          {!mismatchAction && (
            <div className="flex gap-3">
              <button
                onClick={() => setMismatchAction("accept")}
                className="flex-1 py-2.5 bg-[#0DC36C] hover:bg-green-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                ✅ ยินยอมราคาใหม่
              </button>
              <button
                onClick={() => setMismatchAction("dispute")}
                className="flex-1 py-2.5 bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 text-sm font-medium rounded-xl transition-colors"
              >
                🚫 โต้แย้ง (เปิด Dispute)
              </button>
            </div>
          )}
          {mismatchAction === "accept" && (
            <div className="space-y-2">
              <p className="text-xs text-yellow-700">ยืนยันรับราคาใหม่ {listing.mismatchReport.proposedPrice} พอยต์ทอง?</p>
              <div className="flex gap-2">
                <button onClick={handleMismatchAccept} disabled={submitting}
                  className="flex-1 py-2 bg-green-500 text-white text-sm rounded-xl disabled:opacity-50">
                  {submitting ? "กำลังยืนยัน..." : "ยืนยัน"}
                </button>
                <button onClick={() => setMismatchAction(null)}
                  className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm rounded-xl">
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
          {mismatchAction === "dispute" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
              🔔 Dispute จะถูกส่งไปยัง Admin เพื่อตรวจสอบ — กด "ยืนยันโต้แย้ง" เพื่อเปิดเคส
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => alert("🔔 Dispute เปิดแล้ว — Admin จะตรวจสอบภายใน 24 ชม.")}
                  className="px-3 py-1.5 bg-red-500 text-white rounded-xl text-xs"
                >
                  ยืนยันโต้แย้ง
                </button>
                <button onClick={() => setMismatchAction(null)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs">
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* S9 — No-show notification */}
      {listing.noShowEvent && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-red-500 text-xl">🚫</span>
            <div>
              <p className="text-sm font-bold text-red-700">ช่างมาถึงแล้ว แต่ไม่พบคุณ</p>
              <p className="text-xs text-red-600 mt-0.5">
                {listing.noShowEvent.weeeTName} · {new Date(listing.noShowEvent.reportedAt).toLocaleString("th-TH")}
              </p>
              <p className="text-xs text-red-600 mt-1">{listing.noShowEvent.notes}</p>
            </div>
          </div>
          <p className="text-xs text-red-600 bg-red-100 rounded-xl px-3 py-2">
            ⚠️ ค่าเสียเที่ยวอาจถูกหักจากระบบพักเงินกลาง (Escrow) ตามเงื่อนไข offer ที่ตกลงไว้
          </p>
          {!noShowAction && (
            <div className="flex gap-3">
              <button onClick={() => setNoShowAction("reschedule")}
                className="flex-1 py-2.5 bg-[#0DC36C] text-white text-sm font-medium rounded-xl hover:bg-green-600">
                📅 นัดใหม่
              </button>
              <button onClick={() => setShowCancelDialog(true)}
                className="flex-1 py-2.5 bg-white text-red-600 border-2 border-red-200 text-sm font-medium rounded-xl hover:bg-red-50">
                ยกเลิกทั้งหมด
              </button>
            </div>
          )}
          {noShowAction === "reschedule" && (
            <div className="space-y-2">
              <p className="text-xs text-green-700">ยืนยันขอนัดใหม่?</p>
              <div className="flex gap-2">
                <button onClick={handleReschedule} disabled={submitting}
                  className="flex-1 py-2 bg-green-500 text-white text-sm rounded-xl disabled:opacity-50">
                  {submitting ? "กำลังส่ง..." : "ยืนยัน"}
                </button>
                <button onClick={() => setNoShowAction(null)}
                  className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm rounded-xl">
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Item info card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div>
          <p className="text-xs text-gray-400">รายละเอียด</p>
          <p className="font-medium text-gray-800">{listing.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400">ประเภท</p>
            <p className="font-medium">{listing.listingType === "sell" ? "💰 ขายซาก" : "🆓 ทิ้งซาก"}</p>
          </div>
          {listing.price > 0 && (
            <div>
              <p className="text-xs text-gray-400">ราคาประกาศ</p>
              <p className="font-mono font-bold text-green-600">{listing.price} พอยต์ทอง</p>
            </div>
          )}
        </div>
      </div>

      {/* S6 — Offer list */}
      {(listing.status === "pending_offer" || listing.status === "accepted") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700">
              🤝 ข้อเสนอจากร้าน ({listing.offers.length})
            </h2>
            {allDeclined && (
              <span className="text-xs text-orange-600">ปฏิเสธทุกข้อเสนอแล้ว — ลงใหม่?</span>
            )}
          </div>

          {listing.offers.map(offer => (
            <div
              key={offer.id}
              className={`bg-white rounded-2xl border-2 shadow-sm p-4 space-y-3 transition-opacity ${
                offer.status === "declined" ? "opacity-50 border-gray-200" :
                offer.status === "accepted" ? "border-green-300 bg-green-50/30" :
                "border-gray-100 hover:border-green-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">{offer.weeerName}</p>
                    <span className="text-xs text-yellow-600">⭐ {offer.weeerRating}</span>
                    {offer.status === "accepted" && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ เลือกแล้ว</span>
                    )}
                    {offer.status === "declined" && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">ปฏิเสธ</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    แผน: {DECISION_LABEL[offer.decision]} · รับ {offer.estimatedPickupDate}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-bold text-green-600 text-lg">{offer.offeredPrice}</p>
                  <p className="text-xs text-gray-400">พอยต์ทอง</p>
                </div>
              </div>

              {offer.notes && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">{offer.notes}</p>
              )}

              {/* S6 — Actions (เฉพาะ pending offer) */}
              {offer.status === "pending" && listing.status === "pending_offer" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptOffer(offer.id)}
                    disabled={submitting}
                    className="flex-1 py-2 bg-[#0DC36C] hover:bg-green-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    ✅ รับข้อเสนอนี้
                  </button>
                  <button
                    onClick={() => setDeclineOfferId(offer.id)}
                    className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-sm rounded-xl transition-colors"
                  >
                    ปฏิเสธ
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* S6 — ปฏิเสธหมดแล้ว → ลงใหม่ */}
          {allDeclined && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center space-y-2">
              <p className="text-sm text-gray-600">ปฏิเสธทุกข้อเสนอแล้ว</p>
              <p className="text-xs text-gray-400">คุณสามารถรอข้อเสนอใหม่ หรือลงประกาศใหม่ด้วยราคาที่แตกต่าง</p>
              <Link href="/scrap/new"
                className="inline-block px-4 py-2 bg-[#0DC36C] text-white text-sm font-medium rounded-xl hover:bg-green-600 transition-colors">
                🔄 ลงประกาศใหม่
              </Link>
            </div>
          )}
        </div>
      )}

      {/* S10 — In progress: ปุ่มยกเลิก */}
      {listing.status === "in_progress" && !listing.mismatchReport && !listing.noShowEvent && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-800">🚚 ช่างกำลังเดินทางมารับซาก</p>
              <p className="text-xs text-orange-600 mt-1">หากยกเลิกตอนนี้ อาจมีค่าปรับตามเงื่อนไข</p>
            </div>
            <button
              onClick={() => setShowCancelDialog(true)}
              className="ml-3 px-4 py-2 bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 text-sm font-medium rounded-xl transition-colors whitespace-nowrap"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* S10 — Cancel dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">⚠️ ยืนยันยกเลิก?</h3>
            <p className="text-sm text-gray-600">
              การยกเลิกระหว่างดำเนินการอาจมีค่าปรับตามเงื่อนไขที่ตกลงกับร้าน
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เหตุผลการยกเลิก <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                rows={3}
                placeholder="กรุณาระบุเหตุผล..."
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelConfirm}
                disabled={submitting || !cancelReason.trim()}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl text-sm disabled:opacity-50 transition-colors"
              >
                {submitting ? "กำลังยกเลิก..." : "ยืนยันยกเลิก"}
              </button>
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm"
              >
                ไม่ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* S6 — Decline offer dialog */}
      {declineOfferId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">ปฏิเสธข้อเสนอ</h3>
            <p className="text-sm text-gray-600">
              กรุณาระบุเหตุผล เพื่อให้ร้านทราบและปรับปรุงข้อเสนอในอนาคต
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เหตุผล <span className="text-red-500">*</span>
              </label>
              <textarea
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
                rows={3}
                placeholder="เช่น ราคาต่ำกว่าที่คาดไว้, ต้องการวันรับอื่น..."
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeclineConfirm}
                disabled={submitting || !declineReason.trim()}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl text-sm disabled:opacity-50"
              >
                {submitting ? "กำลังส่ง..." : "ยืนยันปฏิเสธ"}
              </button>
              <button
                onClick={() => { setDeclineOfferId(null); setDeclineReason(""); }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl text-sm"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Default export ที่ wrap ด้วย Suspense (Next.js 15 — useSearchParams requirement) ──
export default function ScrapListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="text-center py-16 text-gray-400">กำลังโหลด...</div>}>
      <ScrapListingDetailContent params={params} />
    </Suspense>
  );
}
