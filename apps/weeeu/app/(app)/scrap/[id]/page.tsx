"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Local types — Mockup only (ไม่ import type ข้าม view)
type ScrapType = "for_sale" | "free";
type ScrapGrade = "A" | "B" | "C";
type ScrapStatus =
  | "announced"
  | "receiving_offers"
  | "offer_selected"
  | "in_progress"
  | "awaiting_renegotiation"
  | "completed"
  | "cancelled"
  | "disputed"
  | "expired";

type ScrapDecision = "recycle" | "parts" | "repair_parts" | "dispose";

type ScrapItem = {
  id: string;
  scrapType: ScrapType;
  applianceType: string;
  grade: ScrapGrade;
  description: string;
  askingPrice?: number;
  status: ScrapStatus;
  createdAt: string;
  fromRepairJobId?: string; // S12
};

type ScrapOffer = {
  id: string;
  shopId: string;
  shopName: string;
  offerPrice?: number; // undefined = free pickup
  offerType: ScrapType;
  decision: ScrapDecision;
  status: "pending" | "selected" | "rejected" | "withdrawn";
  note?: string;
  createdAt: string;
};

// ---- Constants ----

const DECISION_LABEL: Record<ScrapDecision, string> = {
  recycle: "♻️ รีไซเคิล",
  parts: "🔩 ถอดชิ้นส่วน",
  repair_parts: "🔧 ซ่อมเพื่อขายต่อ",
  dispose: "🗑 ทิ้งอย่างถูกวิธี",
};

// 5 main steps for timeline (terminal states handled separately)
const TIMELINE_STEPS: ScrapStatus[] = [
  "announced",
  "receiving_offers",
  "offer_selected",
  "in_progress",
  "completed",
];

const STEP_LABEL: Partial<Record<ScrapStatus, string>> = {
  announced: "ประกาศซาก",
  receiving_offers: "รับข้อเสนอ",
  offer_selected: "เลือกร้านแล้ว",
  in_progress: "ช่างกำลังมา",
  completed: "เสร็จสิ้น",
};

// ---- Mock data (demo: receiving_offers with 2 offers) ----

const MOCK_SCRAP: ScrapItem = {
  id: "scrap-001",
  scrapType: "for_sale",
  applianceType: "ตู้เย็น Samsung",
  grade: "B",
  description: "ตู้เย็น 2 ประตู ขนาด 16 คิว มอเตอร์พังแต่ตัวถังดี ถาดน้ำแข็งครบ ใช้งานมา 8 ปี",
  askingPrice: 500,
  status: "receiving_offers",
  createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  // S12 demo: fromRepairJobId: "repair-999",
};

const MOCK_OFFERS: ScrapOffer[] = [
  {
    id: "offer-s-001",
    shopId: "shop-01",
    shopName: "ร้านซากทอง WeeeR",
    offerPrice: 450,
    offerType: "for_sale",
    decision: "parts",
    status: "pending",
    note: "จะถอดคอมเพรสเซอร์ + แผ่นระบายความร้อน",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "offer-s-002",
    shopId: "shop-02",
    shopName: "WeeeR รีไซเคิลดี",
    offerPrice: 380,
    offerType: "for_sale",
    decision: "recycle",
    status: "pending",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

// ---- Component ----

export default function ScrapDetailPage() {
  const params = useParams();
  const _id = params?.id as string; // eslint-disable-line @typescript-eslint/no-unused-vars

  // scrap item state
  const [scrap] = useState<ScrapItem>(MOCK_SCRAP);
  const [offers, setOffers] = useState<ScrapOffer[]>(MOCK_OFFERS);
  const [currentStatus, setCurrentStatus] = useState<ScrapStatus>(MOCK_SCRAP.status);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  // S6: rejected offer ids (local)
  const [rejectedOfferIds, setRejectedOfferIds] = useState<Set<string>>(new Set());

  // S8: renegotiation
  const [showRenegotiation, setShowRenegotiation] = useState(false);
  const [renegotiationPrice] = useState(320);

  // S9: no-show
  const [showNoShow, setShowNoShow] = useState(false);

  // S10: cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState<"user" | "all_rejected" | null>(null);

  // S11: dispute modal
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeOpened, setDisputeOpened] = useState(false);

  // Gold escrow lock (after offer_selected, for_sale)
  const [goldLocked, setGoldLocked] = useState(false);

  // ---- Derived ----
  const activeOffers = offers.filter(o => !rejectedOfferIds.has(o.id) && o.status === "pending");
  const selectedOffer = offers.find(o => o.id === selectedOfferId);
  const allOffersPending = offers.filter(o => o.status === "pending");

  // Timeline step index (map awaiting_renegotiation → in_progress for display)
  const displayStatus: ScrapStatus =
    currentStatus === "awaiting_renegotiation" ? "in_progress" : currentStatus;
  const currentStepIdx = TIMELINE_STEPS.indexOf(displayStatus);
  const isTerminal = ["expired", "cancelled", "disputed"].includes(currentStatus);

  // ---- Handlers ----

  const handleSelectOffer = (offerId: string) => {
    if (!confirm("เลือกข้อเสนอนี้?")) return;
    setSelectedOfferId(offerId);
    setCurrentStatus("offer_selected");
    if (scrap.scrapType === "for_sale") setGoldLocked(true);
    setOffers(prev =>
      prev.map(o => ({
        ...o,
        status: o.id === offerId ? "selected" : o.status === "pending" ? "rejected" : o.status,
      }))
    );
  };

  const handleRejectOffer = (offerId: string) => {
    const newRejected = new Set([...rejectedOfferIds, offerId]);
    setRejectedOfferIds(newRejected);
    const remaining = allOffersPending.filter(o => o.id !== offerId && !newRejected.has(o.id));
    if (remaining.length === 0) {
      // S6: ปฏิเสธหมด → ปิด
      setCancelReason("all_rejected");
      setCurrentStatus("cancelled");
    }
  };

  const handleAcceptRenegotiation = () => {
    setShowRenegotiation(false);
    setCurrentStatus("in_progress");
  };

  const handleRejectRenegotiation = () => {
    setShowRenegotiation(false);
    setCancelReason("user");
    setCurrentStatus("cancelled");
  };

  const handleCancelConfirm = () => {
    setCancelReason("user");
    setCurrentStatus("cancelled");
    setShowCancelModal(false);
  };

  const handleOpenDispute = () => {
    setDisputeOpened(true);
    setCurrentStatus("disputed");
    setShowDisputeModal(false);
  };

  const handleMockInProgress = () => {
    setCurrentStatus("in_progress");
  };

  return (
    <div className="max-w-xl space-y-5">
      {/* Back */}
      <Link href="/scrap" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        ← กลับ
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-gray-900">♻️ {scrap.applianceType}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
              scrap.grade === "A" ? "bg-green-100 text-green-700" :
              scrap.grade === "B" ? "bg-yellow-100 text-yellow-700" :
              "bg-red-100 text-red-600"
            }`}>
              เกรด {scrap.grade}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
              scrap.scrapType === "for_sale" ? "bg-weeeu-surface text-weeeu-primary" : "bg-gray-100 text-gray-500"
            }`}>
              {scrap.scrapType === "for_sale" ? "💰 ขายซาก" : "🎁 ทิ้งฟรี"}
            </span>
          </div>
        </div>
        {scrap.scrapType === "for_sale" && scrap.askingPrice && (
          <p className="text-2xl font-bold text-weeeu-primary shrink-0">{scrap.askingPrice.toLocaleString()} Gold</p>
        )}
      </div>

      {/* S12: จากงานซ่อม badge */}
      {scrap.fromRepairJobId && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 flex items-center gap-2">
          <span>🔧</span>
          <div>
            <p className="text-xs font-semibold text-orange-800">ซากนี้มาจากงานซ่อม (S12)</p>
            <Link href={`/jobs/${scrap.fromRepairJobId}`} className="text-xs text-orange-700 underline">
              ดูงานซ่อม #{scrap.fromRepairJobId} →
            </Link>
          </div>
        </div>
      )}

      {/* Escrow direction (for_sale only) */}
      {scrap.scrapType === "for_sale" && (
        <div className={`border rounded-2xl p-3 ${goldLocked ? "bg-weeeu-surface border-weeeu-primary/30" : "bg-yellow-50 border-yellow-200"}`}>
          {goldLocked ? (
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <div>
                <p className="text-xs font-semibold text-weeeu-text">
                  {selectedOffer?.shopName ?? "WeeeR"} ล็อก {selectedOffer?.offerPrice?.toLocaleString() ?? "–"} Gold ใน Escrow ให้คุณ
                </p>
                <p className="text-xs text-weeeu-primary">Gold ปลดล็อกเมื่องานเสร็จสิ้น (mock)</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-yellow-800">
              🥇 <span className="font-semibold">escrow กลับทิศ:</span>{" "}
              WeeeR จ่าย Gold → คุณ (ตรงข้าม Repair/Resell ที่คุณจ่าย)
            </p>
          )}
        </div>
      )}

      {/* Description card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-1.5">
        <h2 className="text-sm font-semibold text-gray-700">รายละเอียด</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{scrap.description}</p>
        <p className="text-xs text-gray-400">ประกาศเมื่อ {new Date(scrap.createdAt).toLocaleDateString("th-TH")}</p>
      </div>

      {/* ---- Timeline ---- */}
      {!isTerminal && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">ขั้นตอน</h2>
          <div className="flex items-start gap-0">
            {TIMELINE_STEPS.map((step, idx) => (
              <div key={step} className="flex items-start flex-1 min-w-0">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    idx < currentStepIdx
                      ? "bg-weeeu-primary text-white"
                      : idx === currentStepIdx
                      ? "bg-weeeu-primary text-white ring-4 ring-weeeu-primary/20"
                      : "bg-gray-100 text-gray-400"
                  }`}>
                    {idx < currentStepIdx ? "✓" : idx + 1}
                  </div>
                  <p className="text-[9px] text-center text-gray-500 mt-1 leading-tight px-0.5">
                    {STEP_LABEL[step]}
                  </p>
                </div>
                {idx < TIMELINE_STEPS.length - 1 && (
                  <div className={`h-0.5 w-5 flex-shrink-0 mt-3.5 ${
                    idx < currentStepIdx ? "bg-weeeu-primary" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
          {currentStatus === "awaiting_renegotiation" && (
            <p className="text-xs text-orange-600 font-medium mt-3 text-center">
              ⏸ รอการยืนยันราคาใหม่ (S8)
            </p>
          )}
        </div>
      )}

      {/* ---- Terminal Banners ---- */}

      {/* S5: expired */}
      {currentStatus === "expired" && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-semibold text-gray-600">⏰ หมดอายุ — ไม่มีข้อเสนอ (S5)</p>
          <p className="text-xs text-gray-500">ประกาศปิดอัตโนมัติเพราะไม่มีร้านยื่นข้อเสนอ</p>
          <Link href="/scrap/new" className="inline-block text-xs text-weeeu-primary font-medium hover:underline">
            ประกาศซากใหม่ →
          </Link>
        </div>
      )}

      {/* S6/S10: cancelled */}
      {currentStatus === "cancelled" && !disputeOpened && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-1.5">
          <p className="text-sm font-semibold text-red-700">❌ ยกเลิก</p>
          <p className="text-xs text-red-600">
            {cancelReason === "all_rejected"
              ? "ปิดเพราะปฏิเสธข้อเสนอทั้งหมด (S6) — ประกาศใหม่ได้"
              : "คุณยกเลิกระหว่างดำเนินการ (S10) — Fee Settle ตาม offer (mock)"}
          </p>
          <Link href="/scrap/new" className="inline-block text-xs text-weeeu-primary font-medium hover:underline">
            ประกาศซากใหม่ →
          </Link>
        </div>
      )}

      {/* S11: disputed */}
      {currentStatus === "disputed" && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 space-y-1.5">
          <p className="text-sm font-bold text-red-700">⚠️ มีข้อพิพาท (S11)</p>
          <p className="text-xs text-red-600">Admin กำลังตรวจสอบ · ติดต่อ Support ได้ทันที</p>
        </div>
      )}

      {/* S8: Renegotiation banner */}
      {showRenegotiation && currentStatus !== "cancelled" && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold text-orange-900">🔄 T แจ้งซากไม่ตรงประกาศ (S8)</p>
          <p className="text-xs text-orange-700">
            ช่างตรวจหน้างาน — ซากสภาพต่างจากที่ประกาศ · ร้านเสนอราคาใหม่
          </p>
          <div className="bg-white rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">ราคาใหม่ที่เสนอ</span>
            <span className="text-xl font-bold text-orange-800">{renegotiationPrice.toLocaleString()} Gold</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAcceptRenegotiation}
              className="flex-1 bg-weeeu-primary hover:bg-weeeu-dark text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              ✅ ยินยอมราคาใหม่
            </button>
            <button
              onClick={handleRejectRenegotiation}
              className="flex-1 border border-red-200 text-red-500 text-sm font-semibold py-2.5 rounded-xl hover:bg-red-50 transition-colors"
            >
              ❌ ปฏิเสธ → ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* S9: No-show banner */}
      {showNoShow && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold text-yellow-900">⚠️ ช่างมาไม่พบคุณ (S9)</p>
          <p className="text-xs text-yellow-700">
            ช่างมาถึงที่นัดแต่ติดต่อคุณไม่ได้ · อาจถูกคิดค่าเสียเที่ยวตาม offer
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowNoShow(false); alert("Mockup: นัดใหม่ — ช่างจะติดต่อกลับ"); }}
              className="flex-1 bg-weeeu-primary hover:bg-weeeu-dark text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              📅 นัดใหม่
            </button>
            <button
              onClick={() => { setShowNoShow(false); alert("Mockup: ยอมรับค่าเสียเที่ยว"); }}
              className="flex-1 border border-yellow-300 text-yellow-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-yellow-50 transition-colors"
            >
              💳 ยอมรับค่าเสียเที่ยว
            </button>
          </div>
        </div>
      )}

      {/* ---- Offers section (receiving_offers) ---- */}
      {(currentStatus === "receiving_offers" || currentStatus === "announced") && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">ข้อเสนอจากร้านรับซาก</h2>
            <span className="text-xs text-gray-400">{activeOffers.length} ข้อเสนอ</span>
          </div>

          {activeOffers.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-3">ยังไม่มีข้อเสนอ หรือปฏิเสธทั้งหมดแล้ว</p>
          )}

          {activeOffers.map(offer => (
            <div key={offer.id} className="border border-gray-100 rounded-2xl p-3 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{offer.shopName}</p>
                  <p className="text-xs text-gray-400">{DECISION_LABEL[offer.decision]}</p>
                  {offer.note && <p className="text-xs text-gray-400 italic mt-0.5">"{offer.note}"</p>}
                </div>
                <div className="text-right shrink-0">
                  {offer.offerPrice ? (
                    <p className="text-sm font-bold text-weeeu-primary">{offer.offerPrice.toLocaleString()} Gold</p>
                  ) : (
                    <p className="text-sm font-medium text-gray-500">รับฟรี</p>
                  )}
                  <p className="text-xs text-gray-400">{new Date(offer.createdAt).toLocaleDateString("th-TH")}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectOffer(offer.id)}
                  className="flex-1 bg-weeeu-primary hover:bg-weeeu-dark text-white text-xs font-semibold py-2 rounded-xl transition-colors"
                >
                  ✅ เลือกข้อเสนอนี้
                </button>
                <button
                  onClick={() => handleRejectOffer(offer.id)}
                  className="flex-1 border border-red-100 text-red-500 text-xs font-semibold py-2 rounded-xl hover:bg-red-50 transition-colors"
                >
                  ❌ ปฏิเสธ (S6)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- offer_selected: waiting for T ---- */}
      {currentStatus === "offer_selected" && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-purple-800">⏳ รอ WeeeT รับงาน (S3)</p>
          {selectedOffer && (
            <div className="bg-white rounded-xl p-3 flex items-center justify-between">
              <p className="text-sm text-gray-700">{selectedOffer.shopName}</p>
              {selectedOffer.offerPrice ? (
                <p className="text-sm font-bold text-weeeu-primary">{selectedOffer.offerPrice.toLocaleString()} Gold</p>
              ) : (
                <p className="text-sm text-gray-500">ฟรี</p>
              )}
            </div>
          )}
          <p className="text-xs text-purple-700">ร้านกำลัง assign ช่างเดินทางมารับซาก</p>
          <button
            onClick={handleMockInProgress}
            className="w-full text-xs bg-purple-100 text-purple-700 py-2 rounded-xl hover:bg-purple-200 transition-colors"
          >
            🧪 Mock: ช่างรับงานแล้ว → in_progress (S4)
          </button>
        </div>
      )}

      {/* ---- Selected offer info (post-selection, non-terminal) ---- */}
      {selectedOffer && !["announced", "receiving_offers", "expired", "cancelled", "disputed"].includes(currentStatus) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">ร้านที่เลือก</h2>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-800">{selectedOffer.shopName}</p>
            {selectedOffer.offerPrice ? (
              <p className="text-sm font-bold text-weeeu-primary">{selectedOffer.offerPrice.toLocaleString()} Gold</p>
            ) : (
              <p className="text-sm text-gray-500">รับฟรี</p>
            )}
          </div>
          <p className="text-xs text-gray-400">{DECISION_LABEL[selectedOffer.decision]}</p>
        </div>
      )}

      {/* ---- in_progress ---- */}
      {(currentStatus === "in_progress" || currentStatus === "awaiting_renegotiation") && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-yellow-800">🚗 ช่างกำลังเดินทางมารับซาก (S4)</p>
          <p className="text-xs text-yellow-700">WeeeT กำลัง GPS check-in · คุณจะได้รับแจ้งเมื่อถึง</p>

          {/* S10 + S11 buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowDisputeModal(true)}
              className="flex-1 border border-red-200 text-red-500 text-xs font-semibold py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              ⚠️ แจ้งปัญหา (S11)
            </button>
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex-1 border border-gray-200 text-gray-500 text-xs font-semibold py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              ❌ ยกเลิก (S10)
            </button>
          </div>

          {/* Mock demo buttons for S8/S9 */}
          <div className="border-t border-yellow-200 pt-3 space-y-2">
            <p className="text-xs text-yellow-600 font-semibold">🧪 Mock Demo Cases:</p>
            <button
              onClick={() => { setCurrentStatus("awaiting_renegotiation"); setShowRenegotiation(true); }}
              className="w-full text-xs bg-orange-100 text-orange-700 py-2 rounded-xl hover:bg-orange-200 transition-colors"
            >
              S8: จำลอง &quot;T แจ้งซากไม่ตรง&quot; → รอยืนยันราคาใหม่
            </button>
            <button
              onClick={() => setShowNoShow(true)}
              className="w-full text-xs bg-yellow-100 text-yellow-700 py-2 rounded-xl hover:bg-yellow-200 transition-colors"
            >
              S9: จำลอง &quot;ช่างมาไม่พบ&quot; → No-show
            </button>
            <button
              onClick={() => setCurrentStatus("completed")}
              className="w-full text-xs bg-green-100 text-green-700 py-2 rounded-xl hover:bg-green-200 transition-colors"
            >
              S1-S4: จำลอง ยืนยันรับซาก → สำเร็จ
            </button>
          </div>
        </div>
      )}

      {/* ---- completed ---- */}
      {currentStatus === "completed" && (
        <div className="bg-weeeu-surface border border-weeeu-primary/30 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-bold text-weeeu-text">✅ เสร็จสิ้น (S4)</p>
          {scrap.scrapType === "for_sale" ? (
            <>
              <p className="text-xs text-weeeu-primary">
                Gold ปลดล็อกจาก Escrow เข้า Wallet แล้ว (mock)
              </p>
              <Link href="/wallet" className="inline-block text-xs text-weeeu-primary font-semibold hover:underline">
                ดู Wallet →
              </Link>
            </>
          ) : (
            <p className="text-xs text-gray-500">ซากถูกรับไปเรียบร้อย (ทิ้งฟรี — ไม่มี Gold)</p>
          )}
        </div>
      )}

      {/* ---- S10: Cancel Modal ---- */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
            <h3 className="text-base font-bold text-gray-900">❌ ยกเลิกงาน (S10)</h3>
            <p className="text-sm text-gray-600">
              ยกเลิกระหว่างดำเนินการ — Fee Settle คำนวณตาม offer นโยบาย
            </p>
            <div className="bg-yellow-50 rounded-xl p-3">
              <p className="text-xs text-yellow-800">⚠️ อาจถูกหักค่า Cancellation Fee ตามนโยบาย (mock)</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium"
              >
                ยังไม่ยกเลิก
              </button>
              <button
                onClick={handleCancelConfirm}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                ยืนยันยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- S11: Dispute Modal ---- */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
            <h3 className="text-base font-bold text-gray-900">⚠️ แจ้งปัญหา (S11)</h3>
            <p className="text-sm text-gray-600">ระบุปัญหาที่พบ — Admin จะเข้ามาตรวจสอบ</p>
            <div className="space-y-2">
              {[
                "ซากไม่ตรงที่แจ้ง (เสียหายมากกว่า)",
                "ช่างปฏิบัติตัวไม่เหมาะสม",
                "ไม่ได้รับ Gold ตามที่ตกลง",
                "อื่นๆ",
              ].map(reason => (
                <button
                  key={reason}
                  className="w-full text-left border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:border-red-300 hover:bg-red-50 transition-colors"
                  onClick={handleOpenDispute}
                >
                  {reason}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowDisputeModal(false)}
              className="w-full border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm font-medium"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-center text-gray-300 pb-4">* Mockup — ไม่โอน/ไม่บันทึกข้อมูลจริง</p>
    </div>
  );
}
