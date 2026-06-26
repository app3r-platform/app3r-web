"use client";

// ── WeeeR Resell Transaction Detail — 2.2 Mockup ──────────────────────────────
// 9-step timeline + R6 (evidence) + R7 (auto-complete wait)
// R8 (reject→dispute) + R10 (dispute) + R11 (claim) + R12 (mutual cancel)

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { resellApi } from "../../_lib/api";
import type { ResellTransaction, ListingStatus } from "../../_lib/types";
import { LISTING_STATUS_LABEL, LISTING_STATUS_COLOR } from "../../_lib/types";

// ── 9-Step timeline definition ────────────────────────────────────────────────
type TxStep = {
  status: ListingStatus;
  label: string;
  icon: string;
  note?: string;
};
const TX_STEPS: TxStep[] = [
  { status: "announced",         label: "ประกาศขาย",      icon: "📢" },
  { status: "receiving_offers",  label: "รับข้อเสนอ",     icon: "🤝" },
  { status: "offer_selected",    label: "เลือกข้อเสนอ",   icon: "⭐", note: "ล็อกพักเงินกลาง (Escrow) 24ชม." },
  { status: "buyer_confirmed",   label: "ผู้ซื้อยืนยัน",  icon: "✅" },
  { status: "in_progress",       label: "กำลังส่ง",        icon: "📦", note: "ต้องส่งหลักฐานก่อนส่ง (R6)" },
  { status: "delivered",         label: "ส่งมอบแล้ว",     icon: "🚚", note: "ผู้ซื้อตรวจรับ (R7/R8)" },
  { status: "inspection_period", label: "ช่วงตรวจสอบ",    icon: "🔍", note: "R8: ยืนยัน/ปฏิเสธ" },
  { status: "completed",         label: "เสร็จสิ้น",       icon: "🎉" },
];
const TERMINAL_BRANCHES: TxStep[] = [
  { status: "disputed",  label: "พิพาท",   icon: "⚠️", note: "R10: รอ Admin ตัดสิน" },
  { status: "cancelled", label: "ยกเลิก",  icon: "❌", note: "R12: ยกเลิกร่วมกัน" },
];
const STEP_ORDER: Record<ListingStatus, number> = {
  announced: 0, receiving_offers: 1, offer_selected: 2, buyer_confirmed: 3,
  in_progress: 4, delivered: 5, inspection_period: 6, completed: 7,
  disputed: 8, cancelled: 8, suspended: -1,
};

// Mock transaction data
const MOCK_TRANSACTIONS: Record<string, ResellTransaction> = {
  TX001: {
    id: "TX001", listingId: "L004", applianceName: "MacBook Air M2",
    sellerName: "ร้านของฉัน", buyerName: "วิชัย สุขใจ",
    price: 32000, status: "in_progress", deliveryMethod: "ส่ง Kerry",
    createdAt: "2026-05-10", updatedAt: "2026-05-23", role: "seller",
  },
  TX002: {
    id: "TX002", listingId: "LMKT1", applianceName: "Sony Bravia XR 55\"",
    sellerName: "ร้าน ElecWorld", buyerName: "ร้านของฉัน",
    price: 16500, status: "delivered", deliveryMethod: "ส่ง Kerry",
    createdAt: "2026-05-15", updatedAt: "2026-05-22", role: "buyer",
  },
  TX003: {
    id: "TX003", listingId: "L_OLD1", applianceName: "iPad Pro 11\" M2",
    sellerName: "ร้านของฉัน", buyerName: "นภา พรมดี",
    price: 18000, status: "completed", deliveryMethod: "รับเอง",
    createdAt: "2026-05-01", updatedAt: "2026-05-18", role: "seller",
  },
  TX004: {
    id: "TX004", listingId: "L_OLD2", applianceName: "DJI Mini 3 Pro",
    sellerName: "ร้าน FlyHigh", buyerName: "ร้านของฉัน",
    price: 12000, status: "disputed", deliveryMethod: "ส่ง Kerry",
    createdAt: "2026-05-05", updatedAt: "2026-05-21", role: "buyer",
    disputeReason: "สินค้าไม่ตรงปกที่โฆษณา",
  },
};

export default function ResellTransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tx, setTx] = useState<ResellTransaction | null>(() =>
    process.env.NEXT_PUBLIC_DEV_NAV === "true" ? (MOCK_TRANSACTIONS[id] ?? null) : null
  );
  const [loading, setLoading] = useState(() => process.env.NEXT_PUBLIC_DEV_NAV !== "true");

  // Mock local state (Mockup)
  const [mockStatus, setMockStatus] = useState<ListingStatus | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceSubmitted, setEvidenceSubmitted] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeNote, setDisputeNote] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimNote, setClaimNote] = useState("");
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [role, setRole] = useState<"seller" | "buyer">(() => {
    if (process.env.NEXT_PUBLIC_DEV_NAV === "true") {
      return (MOCK_TRANSACTIONS[id]?.role ?? "seller");
    }
    return "seller";
  });

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_NAV === "true") return;
    const mock = MOCK_TRANSACTIONS[id];
    resellApi.transactionsGet(id)
      .then(t => { setTx(t); setRole(t.role ?? "seller"); })
      .catch(() => {
        if (mock) { setTx(mock); setRole(mock.role ?? "seller"); }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const effectiveStatus = mockStatus ?? tx?.status ?? "in_progress";
  const isTerminal = ["completed", "cancelled", "disputed"].includes(effectiveStatus);
  const currentStep = STEP_ORDER[effectiveStatus] ?? 0;

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (!tx) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ ไม่พบธุรกรรม</div>;

  return (
    <div className="space-y-5 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/resell/transactions" className="text-gray-400 hover:text-gray-600">←</Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{tx.applianceName}</h1>
          <p className="text-xs text-gray-400">{tx.id}</p>
        </div>
        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${LISTING_STATUS_COLOR[effectiveStatus]}`}>
          {LISTING_STATUS_LABEL[effectiveStatus]}
        </span>
      </div>

      {/* Role toggle (Mockup demo) */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-gray-400">มุมมอง (mockup):</span>
        {(["seller", "buyer"] as const).map(r => (
          <button key={r} onClick={() => setRole(r)}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors
              ${role === r ? "bg-[#FF663A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {r === "seller" ? "🏪 ผู้ขาย" : "🛒 ผู้ซื้อ"}
          </button>
        ))}
      </div>

      {/* Detail card */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div><p className="text-xs text-gray-400">ผู้ขาย</p><p className="font-medium">{tx.sellerName}</p></div>
          <div><p className="text-xs text-gray-400">ผู้ซื้อ</p><p className="font-medium">{tx.buyerName}</p></div>
          <div><p className="text-xs text-gray-400">ราคา</p><p className="text-xl font-bold text-[#FF663A]">{tx.price.toLocaleString()} พอยต์</p></div>
          <div><p className="text-xs text-gray-400">จัดส่ง</p><p className="font-medium">{tx.deliveryMethod}</p></div>
          {tx.trackingNumber && <div className="col-span-2"><p className="text-xs text-gray-400">การติดตามพัสดุ (Tracking)</p><p className="font-medium font-mono">{tx.trackingNumber}</p></div>}
          {tx.disputeReason && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400">สาเหตุพิพาท</p>
              <p className="font-medium text-red-700">{tx.disputeReason}</p>
            </div>
          )}
        </div>

        {/* Evidence submitted */}
        {(evidenceSubmitted || tx.evidenceUrls?.length) && (
          <div className="border-t border-gray-50 pt-3">
            <p className="text-xs font-semibold text-gray-500 mb-1">📸 หลักฐานก่อนส่ง (R6)</p>
            <p className="text-xs text-green-700">✅ แนบหลักฐานแล้ว {evidenceUrl ? `· ${evidenceUrl.substring(0,40)}…` : ""}</p>
          </div>
        )}
      </div>

      {/* ── 9-Step Timeline ────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ขั้นตอน (9 step)</p>
        <div className="space-y-2">
          {TX_STEPS.map((step, i) => {
            const stepOrder = STEP_ORDER[step.status];
            const isDone = currentStep > stepOrder && !["disputed","cancelled"].includes(effectiveStatus);
            const isCurrent = currentStep === stepOrder && !["disputed","cancelled"].includes(effectiveStatus);
            const isFuture = currentStep < stepOrder;
            return (
              <div key={step.status} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5
                  ${isDone ? "bg-green-100 text-green-700" : isCurrent ? "bg-[#FF663A] text-white" : "bg-gray-100 text-gray-400"}`}>
                  {isDone ? "✓" : step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isCurrent ? "text-[#FF663A]" : isDone ? "text-gray-700" : "text-gray-400"}`}>
                    {step.label}
                    {isCurrent && <span className="ml-1.5 text-xs bg-[#FCEAE3] text-[#FF663A] px-1.5 py-0.5 rounded-full">ปัจจุบัน</span>}
                  </p>
                  {step.note && isCurrent && <p className="text-xs text-gray-400 mt-0.5">{step.note}</p>}
                </div>
                {i < TX_STEPS.length - 1 && (
                  <div className={`w-0.5 h-4 ml-3 mt-7 rounded ${isDone ? "bg-green-200" : "bg-gray-100"}`} />
                )}
              </div>
            );
          })}
          {/* Terminal branches */}
          {["disputed","cancelled"].includes(effectiveStatus) && (
            TERMINAL_BRANCHES.map(b => effectiveStatus === b.status && (
              <div key={b.status} className="flex items-start gap-3 ml-4 border-l-2 border-red-200 pl-4">
                <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-sm shrink-0">
                  {b.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-red-700">{b.label}</p>
                  {b.note && <p className="text-xs text-red-500 mt-0.5">{b.note}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── R6: Evidence upload (seller, in_progress) ─────────────────────── */}
      {role === "seller" && effectiveStatus === "in_progress" && !evidenceSubmitted && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm font-bold text-orange-800">📸 R6: แนบหลักฐานก่อนส่ง (บังคับ)</p>
          <p className="text-xs text-orange-600 mt-0.5">ถ่ายรูป+คลิปสินค้าก่อนแพ็ค — ป้องกันข้อพิพาท</p>
          <div className="flex gap-2 mt-3">
            <input type="url" value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)}
              placeholder="URL รูป/คลิปหลักฐาน (mock)…"
              className="flex-1 border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            <button onClick={() => { if (evidenceUrl) { setEvidenceSubmitted(true); setMockStatus("delivered"); }}}
              disabled={!evidenceUrl}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
              ส่งหลักฐาน
            </button>
          </div>
        </div>
      )}
      {role === "seller" && effectiveStatus === "in_progress" && evidenceSubmitted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
          <span>✅</span>
          <p className="text-sm text-green-700 font-medium">ส่งหลักฐานแล้ว (สถานะ mock → delivered)</p>
        </div>
      )}

      {/* ── R7: Seller waiting for auto-complete (delivered) ──────────────── */}
      {role === "seller" && effectiveStatus === "delivered" && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
          <p className="text-sm font-bold text-teal-800">⏳ R7: รอผู้ซื้อตรวจรับ</p>
          <p className="text-xs text-teal-600 mt-0.5">ถ้าผู้ซื้อไม่ตอบภายใน 3 วัน ระบบ auto-complete ให้อัตโนมัติ</p>
        </div>
      )}

      {/* ── R8: Buyer verify on delivery ──────────────────────────────────── */}
      {role === "buyer" && (effectiveStatus === "delivered" || effectiveStatus === "inspection_period") && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">R8: ตรวจรับสินค้า</p>
          <button onClick={() => setMockStatus("completed")}
            className="w-full bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-3 rounded-xl transition-colors">
            ✅ ยืนยันรับสินค้า — เสร็จสิ้น
          </button>
          <button onClick={() => setShowDisputeModal(true)}
            className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-3 rounded-xl transition-colors border border-red-200">
            ⚠️ R8: ปฏิเสธ — เปิดข้อพิพาท (Dispute)
          </button>
        </div>
      )}

      {/* ── R10: Open dispute (any active step) ───────────────────────────── */}
      {!isTerminal && STEP_ORDER[effectiveStatus] >= 4 && (
        <button onClick={() => setShowDisputeModal(true)}
          className="w-full border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium py-2.5 rounded-xl transition-colors">
          🚨 R10: เปิดข้อพิพาท (Dispute)
        </button>
      )}

      {/* ── R11: Claim (parcel damage) ─────────────────────────────────────── */}
      {!isTerminal && (effectiveStatus === "in_progress" || effectiveStatus === "delivered") && (
        <>
          {!showClaimForm ? (
            <button onClick={() => setShowClaimForm(true)}
              className="w-full border border-orange-200 text-orange-700 hover:bg-orange-50 text-sm font-medium py-2.5 rounded-xl transition-colors">
              📮 R11: แจ้งพัสดุเสียหาย / Claim
            </button>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-orange-800">📮 R11: แจ้งพัสดุเสียหาย</p>
              {!claimSubmitted ? (
                <>
                  <textarea value={claimNote} onChange={e => setClaimNote(e.target.value)} rows={3}
                    placeholder="อธิบายความเสียหาย + แนบ URL รูปหลักฐาน…"
                    className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => { if (claimNote) setClaimSubmitted(true); }}
                      disabled={!claimNote}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-50">
                      ส่ง Claim
                    </button>
                    <button onClick={() => setShowClaimForm(false)}
                      className="text-xs text-gray-500 hover:underline px-2">ยกเลิก</button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-orange-700 font-medium">✅ ส่งเคลม (Claim) แล้ว — Admin กำลังตรวจสอบ</p>
              )}
            </div>
          )}
        </>
      )}

      {/* ── R12: Mutual cancel ────────────────────────────────────────────── */}
      {!isTerminal && STEP_ORDER[effectiveStatus] < 7 && (
        <button onClick={() => setShowCancelModal(true)}
          className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-xl transition-colors">
          🤝 R12: ขอยกเลิกร่วมกัน
        </button>
      )}

      {/* ── R10 Dispute Modal ─────────────────────────────────────────────── */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 px-4 pb-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4">
            {/* §7 เคส R8/R10 */}
            <h2 className="text-base font-bold text-gray-900">เปิด ข้อพิพาท (Dispute)</h2>
            <textarea value={disputeNote} onChange={e => setDisputeNote(e.target.value)} rows={3}
              placeholder="อธิบายปัญหา + แนบ URL หลักฐาน (คลิปตอนรับ/รูปสินค้า)…"
              className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none" />
            <p className="text-xs text-gray-500">Admin จะรับเรื่องและตัดสินภายใน 3 วันทำการ</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowDisputeModal(false); setDisputeNote(""); }}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50">
                กลับ
              </button>
              <button onClick={() => { setMockStatus("disputed"); setShowDisputeModal(false); }}
                disabled={!disputeNote}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-60">
                ยืนยันเปิดข้อพิพาท (Dispute)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── R12 Mutual Cancel Modal ────────────────────────────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 px-4 pb-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4">
            {/* §7 เคส R12 */}
            <h2 className="text-base font-bold text-gray-900">ขอยกเลิกร่วม</h2>
            <p className="text-sm text-gray-600">ส่งคำขอให้อีกฝ่ายยืนยัน — ถ้ายืนยันทั้งคู่ ธุรกรรมยกเลิก · คืนพักเงินกลาง (Escrow) ตามข้อตกลง</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50">
                กลับ
              </button>
              <button onClick={() => { setMockStatus("cancelled"); setShowCancelModal(false); }}
                className="flex-1 bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold py-2.5 rounded-xl text-sm">
                ส่งคำขอยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
