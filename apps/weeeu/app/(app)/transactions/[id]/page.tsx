"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { EscrowInfoIcon } from "@/components/shared/EscrowInfo";

// Local type — Mockup เท่านั้น (ไม่แตะ shared types.ts)
type TxStatus =
  | "offer_selected"
  | "awaiting_payment"    // R4 NEW — รอเติม Gold ≤ 24ชม.
  | "buyer_confirmed"
  | "in_progress"
  | "delivered"
  | "inspection_period"
  | "completed"
  | "cancelled"
  | "disputed";

type TransactionData = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  appliance_name: string;
  buyer_name: string;
  seller_name: string;
  agreed_price: number;
  delivery_method: string;
  status: TxStatus | string;
  tracking_number?: string;
  courier?: string;
  delivered_at?: string;
  inspection_deadline?: string;
  completed_at?: string;
  is_buyer: boolean;
};

// Timeline 9 step (รวม awaiting_payment + escrow + evidence)
const STEPS: { key: string; label: string; icon: string }[] = [
  { key: "offer_selected",   label: "เลือกข้อเสนอ",          icon: "🤝" },
  { key: "awaiting_payment", label: "รอ Gold Escrow ≤ 24ชม.", icon: "💰" }, // R4
  { key: "buyer_confirmed",  label: "Gold ล็อกแล้ว",          icon: "🔒" },
  { key: "in_progress",      label: "ผู้ขายเตรียมส่ง",         icon: "📦" }, // R6 evidence
  { key: "delivered",        label: "ส่งถึงแล้ว",              icon: "🏠" },
  { key: "inspection_period",label: "ช่วงตรวจสอบ",            icon: "🔍" }, // R7/R8 evidence
  { key: "completed",        label: "เสร็จสมบูรณ์",           icon: "🎉" },
  { key: "cancelled",        label: "ยกเลิก",                 icon: "❌" },
  { key: "disputed",         label: "มีข้อพิพาท",             icon: "⚖️" },
];

const MAIN_STEPS = STEPS.slice(0, 7); // ไม่รวม cancelled/disputed ใน timeline หลัก
const STEP_ORDER = MAIN_STEPS.map(s => s.key);

const DELIVERY_LABEL: Record<string, string> = {
  on_site: "ส่งเอง / นัดรับ",
  parcel: "ส่งพัสดุ (ขนส่ง)",
};

const COURIER_LABEL: Record<string, string> = {
  kerry: "Kerry Express",
  flash: "Flash Express",
  jandt: "J&T Express",
};

// Mock TransactionData สำหรับ demo (Mockup — ถ้า API ไม่มีข้อมูล)
const MOCK_TX: TransactionData = {
  id: "mock-tx-001",
  listing_id: "mock-listing-001",
  buyer_id: "current-user",
  seller_id: "seller-01",
  appliance_name: "แอร์ Mitsubishi 12000 BTU (เกรด A)",
  buyer_name: "คุณสมหวัง",
  seller_name: "คุณสมศักดิ์",
  agreed_price: 8500,
  delivery_method: "parcel",
  status: "inspection_period",
  tracking_number: "TH123456789",
  courier: "kerry",
  inspection_deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
  is_buyer: true,
};

function useCountdown(deadline: string | undefined) {
  const [remaining, setRemaining] = useState(() =>
    deadline ? Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)) : 0
  );
  useEffect(() => {
    if (!deadline) return;
    const interval = setInterval(() => setRemaining(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(interval);
  }, [deadline]);
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  return { hours, minutes, seconds, expired: remaining === 0, remaining };
}

export default function TransactionPage() {
  const { id } = useParams<{ id: string }>();
  const [tx, setTx] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // R7/R8: Confirm received
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Mock states สำหรับ R4-R12 (Mockup — local state)
  const [mockR4Shortfall] = useState(1200); // Gold ขาด
  const [mockR4Deadline] = useState(() => new Date(Date.now() + 3600000 * 18).toISOString());
  const r4Countdown = useCountdown(tx?.status === "awaiting_payment" ? mockR4Deadline : undefined);
  const inspectCountdown = useCountdown(tx?.inspection_deadline);

  // R8: Evidence upload mock (Mockup — FLAG-3 placeholder)
  const [evidenceUploaded, setEvidenceUploaded] = useState(false);
  const [sellerEvidenceUploaded, setSellerEvidenceUploaded] = useState(false);

  // R10: Dispute
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("not_as_described");
  const [disputeOpened, setDisputeOpened] = useState(false);

  // R11: Parcel damage
  const [showParcelDamageModal, setShowParcelDamageModal] = useState(false);
  const [parcelClaimSent, setParcelClaimSent] = useState(false);

  // R12: Mutual cancel
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);

  const load = () => {
    apiFetch(`/api/v1/transactions/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) {
          // Mockup: ถ้า API ไม่มี transaction ใช้ mock data
          setTx(MOCK_TX);
          return;
        }
        setTx(d);
        if (d.status === "completed") setConfirmed(true);
      })
      .catch(() => {
        setTx(MOCK_TX);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleConfirmReceived = async () => {
    if (!evidenceUploaded) {
      setError("กรุณา upload คลิปตอนรับสินค้าก่อนยืนยัน (Evidence บังคับ)");
      return;
    }
    setConfirming(true);
    setError("");
    try {
      const res = await apiFetch(`/api/v1/transactions/${id}/confirm-received/`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      setConfirmed(true);
      load();
    } catch {
      // Mockup: อัพเดต state เอง
      setConfirmed(true);
      setTx(prev => prev ? { ...prev, status: "completed" } : prev);
    } finally {
      setConfirming(false);
    }
  };

  // R10: เปิด dispute (Mockup)
  const handleOpenDispute = () => {
    setDisputeOpened(true);
    setShowDisputeModal(false);
    setTx(prev => prev ? { ...prev, status: "disputed" } : prev);
  };

  // R11: Parcel damage claim (Mockup)
  const handleParcelClaim = () => {
    setParcelClaimSent(true);
    setShowParcelDamageModal(false);
  };

  // R12: ขอยกเลิกร่วม (Mockup)
  const handleMutualCancel = () => {
    setCancelRequested(true);
    setShowCancelModal(false);
  };

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;
  if (error && !tx) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">📋</p>
      <p className="text-gray-600 font-medium">{error}</p>
      <Link href="/sell" className="mt-3 inline-block text-weeeu-primary text-sm font-medium hover:underline">← กลับรายการขาย</Link>
    </div>
  );
  if (!tx) return null;

  const currentStepIdx = STEP_ORDER.indexOf(tx.status);
  const isBuyer = tx.is_buyer;
  const isSeller = !tx.is_buyer;
  const isTerminal = tx.status === "completed" || tx.status === "cancelled" || tx.status === "disputed";

  // ตรวจว่า step หลังจาก buyer_confirmed (escrow locked)
  const isAfterEscrow = ["buyer_confirmed", "in_progress", "delivered", "inspection_period", "completed"].includes(tx.status);

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/sell" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">สถานะธุรกรรม</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Disputed banner */}
      {tx.status === "disputed" && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-bold text-red-800">⚖️ มีข้อพิพาท — รอ Admin ตัดสิน (R10)</p>
          <p className="text-xs text-red-600">Gold ในระบบพักเงินกลาง (Escrow) <EscrowInfoIcon /> ถูกล็อกไว้จนกว่า Admin จะตัดสิน</p>
          <p className="text-xs text-gray-500">เหตุผล: {disputeReason === "not_as_described" ? "สินค้าไม่ตรงปก" : "อื่นๆ"}</p>
        </div>
      )}

      {/* Cancelled banner */}
      {tx.status === "cancelled" && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-gray-700">❌ ธุรกรรมถูกยกเลิก</p>
          <p className="text-xs text-gray-500 mt-1">พอยต์ทองค่า offer และค่าประกาศถูกคืนให้ทุกฝ่ายแล้ว</p>
        </div>
      )}

      {/* R4: awaiting_payment banner */}
      {tx.status === "awaiting_payment" && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold text-orange-900">💰 รอยืนยัน Gold Escrow <EscrowInfoIcon /> (R4)</p>
          <p className="text-xs text-orange-700">
            {isBuyer
              ? `Gold ของคุณขาดอีก ${mockR4Shortfall.toLocaleString()} — เติมให้ครบใน 24 ชม.`
              : "รอผู้ซื้อยืนยัน Gold — ถ้าหมดเวลา ข้อเสนอจะถูกปลด"}
          </p>
          {isBuyer && (
            <>
              <div className="text-center bg-white border border-orange-200 rounded-xl p-2">
                {r4Countdown.expired ? (
                  <p className="text-sm font-bold text-red-600">หมดเวลา — ข้อเสนอถูกปลดแล้ว</p>
                ) : (
                  <p className="text-2xl font-bold font-mono text-orange-800">
                    {String(r4Countdown.hours).padStart(2, "0")}:
                    {String(r4Countdown.minutes).padStart(2, "0")}:
                    {String(r4Countdown.seconds).padStart(2, "0")}
                  </p>
                )}
              </div>
              <Link
                href="/wallet"
                className="block w-full text-center bg-weeeu-primary hover:bg-weeeu-dark text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                🥇 เติม Gold เดี๋ยวนี้
              </Link>
            </>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">สรุปธุรกรรม</p>
        <InfoRow label="สินค้า" value={tx.appliance_name} />
        <InfoRow label="ผู้ขาย" value={tx.seller_name} />
        <InfoRow label="ผู้ซื้อ" value={tx.buyer_name} />
        <InfoRow label="ราคาที่ตกลง" value={`${tx.agreed_price.toLocaleString()} Gold`} bold />
        <InfoRow label="จัดส่ง" value={DELIVERY_LABEL[tx.delivery_method] ?? tx.delivery_method} />
        {tx.courier && <InfoRow label="บริษัทขนส่ง" value={COURIER_LABEL[tx.courier] ?? tx.courier} />}
        {tx.tracking_number && (
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-gray-500 shrink-0">เลขติดตามพัสดุ (Tracking)</p>
            <p className="text-sm font-mono font-bold text-weeeu-primary text-right">{tx.tracking_number}</p>
          </div>
        )}
        {isAfterEscrow && (
          <div className="flex items-center gap-1.5 pt-1 border-t border-gray-50">
            <span className="text-sm">🔒</span>
            <p className="text-xs text-weeeu-primary font-medium">Gold {tx.agreed_price.toLocaleString()} ล็อกใน Escrow <EscrowInfoIcon /> แล้ว</p>
          </div>
        )}
      </div>

      {/* State machine timeline — 9 step */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ความคืบหน้า (9 ขั้น)</p>
        <div className="space-y-0">
          {MAIN_STEPS.map((step, i) => {
            const done = currentStepIdx >= i;
            const active = currentStepIdx === i;
            const isLast = i === MAIN_STEPS.length - 1;
            return (
              <div key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 ${
                    done ? "bg-weeeu-primary" : "bg-gray-100"
                  }`}>
                    <span className={done ? "text-white text-xs" : "text-gray-400 text-xs"}>{step.icon}</span>
                  </div>
                  {!isLast && <div className={`w-0.5 h-6 ${done && currentStepIdx > i ? "bg-weeeu-primary/30" : "bg-gray-100"}`} />}
                </div>
                <div className={`pb-4 pt-1`}>
                  <p className={`text-sm font-medium ${active ? "text-weeeu-primary" : done ? "text-gray-700" : "text-gray-400"}`}>
                    {step.label}
                    {active && <span className="ml-2 text-xs text-weeeu-primary">(ปัจจุบัน)</span>}
                  </p>
                  {/* Sub-labels สำหรับ step พิเศษ */}
                  {step.key === "awaiting_payment" && active && (
                    <p className="text-xs text-orange-500 mt-0.5">รอผู้ซื้อยืนยัน Gold ≤ 24ชม.</p>
                  )}
                  {step.key === "in_progress" && active && (
                    <p className="text-xs text-gray-400 mt-0.5">ผู้ขายต้องถ่ายรูป+คลิปก่อนส่ง</p>
                  )}
                  {step.key === "inspection_period" && active && (
                    <p className="text-xs text-gray-400 mt-0.5">ผู้ซื้อต้องถ่ายคลิปตอนรับ + ยืนยัน</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* R6: Seller evidence upload (in_progress) — Mockup FLAG-3 placeholder */}
      {tx.status === "in_progress" && isSeller && (
        <div className="bg-white rounded-2xl border border-yellow-200 shadow-sm p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-800">📸 หลักฐานก่อนส่ง (บังคับ R6)</p>
          <p className="text-xs text-gray-500">ถ่ายรูป + คลิปสินค้าก่อนส่ง — ใช้เป็นหลักฐานกรณีข้อพิพาท</p>
          {sellerEvidenceUploaded ? (
            <div className="bg-green-50 rounded-xl p-3 flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <p className="text-xs text-green-700 font-medium">Upload หลักฐานเรียบร้อย — พร้อมส่งสินค้า</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Mock upload button */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                <p className="text-2xl mb-1">📹</p>
                <p className="text-xs text-gray-500">คลิก/แตะเพื่อ upload รูป+คลิป</p>
                <p className="text-xs text-gray-400">(Mockup — placeholder เท่านั้น)</p>
              </div>
              <button
                onClick={() => setSellerEvidenceUploaded(true)}
                className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                📸 Mock: ยืนยัน Upload หลักฐาน
              </button>
            </div>
          )}
        </div>
      )}

      {/* R7/R8: Inspection period — buyer side */}
      {tx.status === "inspection_period" && !confirmed && !disputeOpened && (
        <div className="space-y-3">
          {/* Inspection deadline */}
          {tx.inspection_deadline && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="text-sm font-semibold text-yellow-800">⏰ ช่วงตรวจสอบ (R7/R8)</p>
              <p className="text-xs text-yellow-700 mt-1">
                กรุณายืนยันหรือปฏิเสธก่อน {new Date(tx.inspection_deadline).toLocaleDateString("th-TH")}
              </p>
              {inspectCountdown.remaining > 0 && (
                <p className="text-xs text-yellow-600 font-mono mt-1">
                  เหลือ {inspectCountdown.hours}:{String(inspectCountdown.minutes).padStart(2,"0")}:{String(inspectCountdown.seconds).padStart(2,"0")} ชม.
                </p>
              )}
              <p className="text-xs text-yellow-500 mt-1">R7: ถ้าไม่กดภายในเวลา ระบบยืนยันให้อัตโนมัติ</p>
            </div>
          )}

          {/* R8: Buyer evidence upload — บังคับก่อนยืนยัน (Mockup FLAG-3 placeholder) */}
          {isBuyer && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <p className="text-sm font-semibold text-gray-800">📹 หลักฐานตอนรับสินค้า (บังคับ R8)</p>
              <p className="text-xs text-gray-500">ถ่ายคลิปตอนแกะกล่อง/รับสินค้า — ใช้เป็นหลักฐานถ้าไม่ตรงปก</p>
              {evidenceUploaded ? (
                <div className="bg-green-50 rounded-xl p-3 flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <p className="text-xs text-green-700 font-medium">Upload คลิปหลักฐานแล้ว</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-2xl mb-1">📹</p>
                    <p className="text-xs text-gray-500">Upload คลิปตอนรับสินค้า</p>
                    <p className="text-xs text-gray-400">(Mockup — placeholder เท่านั้น)</p>
                  </div>
                  <button
                    onClick={() => setEvidenceUploaded(true)}
                    className="w-full border border-weeeu-primary text-weeeu-primary text-sm font-semibold py-2.5 rounded-xl hover:bg-weeeu-surface transition-colors"
                  >
                    📸 Mock: ยืนยัน Upload คลิป
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action buttons: ยืนยัน / ปฏิเสธ */}
          {isBuyer && (
            <div className="flex gap-2">
              <button
                onClick={handleConfirmReceived}
                disabled={confirming || !evidenceUploaded}
                className="flex-1 bg-weeeu-primary hover:bg-weeeu-dark disabled:bg-weeeu-primary/40 text-white font-semibold py-3 rounded-2xl transition-colors text-sm flex items-center justify-center gap-1.5"
              >
                {confirming ? <><span className="animate-spin">⟳</span> กำลังยืนยัน...</> : "✅ ยืนยันรับสินค้าแล้ว"}
              </button>
              <button
                onClick={() => setShowDisputeModal(true)}
                disabled={!evidenceUploaded}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-200 text-white font-semibold py-3 rounded-2xl transition-colors text-sm"
              >
                ⚠️ ปฏิเสธ → Dispute (R8)
              </button>
            </div>
          )}
          {!evidenceUploaded && isBuyer && (
            <p className="text-xs text-orange-600 text-center">* Upload คลิปหลักฐานก่อนจึงจะกดยืนยัน/ปฏิเสธได้</p>
          )}
        </div>
      )}

      {/* Completed state */}
      {(confirmed || tx.status === "completed") && (
        <div className="bg-weeeu-surface border border-weeeu-primary/30 rounded-2xl p-5 text-center space-y-2">
          <p className="text-4xl">🎉</p>
          <p className="text-sm font-semibold text-weeeu-text">ธุรกรรมเสร็จสมบูรณ์!</p>
          <p className="text-xs text-weeeu-primary">Gold โอนให้ผู้ขายแล้ว — ขอบคุณที่ใช้งาน WeeeU</p>
        </div>
      )}

      {/* R11: Parcel damage — แสดงเมื่อ delivery method = parcel และ delivered */}
      {tx.delivery_method === "parcel" && tx.status === "delivered" && !parcelClaimSent && !disputeOpened && (
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-800">📦 ตรวจสอบสภาพพัสดุ</p>
          <p className="text-xs text-gray-500 mt-1">หากพัสดุเสียหายระหว่างขนส่ง แจ้งทันที</p>
          <button
            onClick={() => setShowParcelDamageModal(true)}
            className="mt-2 w-full border border-orange-300 text-orange-600 text-xs font-semibold py-2 rounded-xl hover:bg-orange-50 transition-colors"
          >
            🚨 แจ้งพัสดุเสียหาย (R11)
          </button>
        </div>
      )}
      {parcelClaimSent && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-orange-800">📬 แจ้งเรื่องพัสดุเสียหายแล้ว (R11)</p>
          <p className="text-xs text-orange-700 mt-1">Admin กำลังตรวจสอบ — Gold ใน Escrow <EscrowInfoIcon /> ถูกล็อกไว้</p>
        </div>
      )}

      {/* R10: เปิด dispute (หลัง escrow lock — ทุก step) */}
      {isAfterEscrow && !isTerminal && !disputeOpened && tx.status !== "inspection_period" && (
        <button
          onClick={() => setShowDisputeModal(true)}
          className="w-full border border-red-200 text-red-500 text-sm font-semibold py-2.5 rounded-xl hover:bg-red-50 transition-colors"
        >
          ⚖️ เปิดข้อพิพาท (R10)
        </button>
      )}

      {/* R12: ขอยกเลิกร่วม (ก่อน in_progress) */}
      {["offer_selected", "awaiting_payment", "buyer_confirmed"].includes(tx.status) && !cancelRequested && (
        <button
          onClick={() => setShowCancelModal(true)}
          className="w-full border border-gray-200 text-gray-500 text-xs font-medium py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          🤝 ขอยกเลิกร่วมกัน (R12)
        </button>
      )}
      {cancelRequested && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-gray-700">📨 ส่งคำขอยกเลิกร่วมแล้ว (R12)</p>
          <p className="text-xs text-gray-500 mt-1">รออีกฝ่ายยืนยัน — ถ้าตกลงกัน พอยต์ทองจะคืนทุกฝ่าย</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2">
        <Link
          href={`/listings/${tx.listing_id}`}
          className="flex-1 text-center border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
        >
          ดูประกาศ
        </Link>
        <Link
          href="/sell"
          className="flex-1 text-center border border-weeeu-primary/30 text-weeeu-primary font-medium py-2.5 rounded-xl text-sm hover:bg-weeeu-surface transition-colors"
        >
          รายการขายของฉัน
        </Link>
      </div>

      {/* Modal: Dispute (R8/R10) */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <p className="text-base font-bold text-gray-900">⚖️ เปิดข้อพิพาท</p>
            <p className="text-xs text-gray-500">Admin จะตรวจสอบหลักฐานและตัดสิน — Gold ใน Escrow <EscrowInfoIcon /> ถูกล็อกระหว่างรอ</p>

            <div className="space-y-1.5">
              {[
                { value: "not_as_described", label: "สินค้าไม่ตรงปก / ไม่ตรงรูปถ่าย" },
                { value: "defective", label: "สินค้าชำรุด / ใช้งานไม่ได้" },
                { value: "not_received", label: "ไม่ได้รับสินค้า" },
                { value: "other", label: "อื่นๆ" },
              ].map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setDisputeReason(r.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                    disputeReason === r.value
                      ? "bg-red-50 border-red-400 text-red-800 font-medium"
                      : "border-gray-200 text-gray-600 hover:border-red-200"
                  }`}
                >
                  {disputeReason === r.value && "✅ "}{r.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleOpenDispute}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                เปิดข้อพิพาท
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Parcel Damage (R11) */}
      {showParcelDamageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <p className="text-base font-bold text-gray-900">🚨 แจ้งพัสดุเสียหาย (R11)</p>
            <p className="text-xs text-gray-500">ถ่ายรูปกล่องพัสดุที่เสียหายแล้วแจ้ง — Admin จะประสานกับบริษัทขนส่ง</p>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xl mb-1">📸</p>
              <p className="text-xs text-gray-400">Upload รูปกล่องที่เสียหาย (Mockup)</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowParcelDamageModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleParcelClaim}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                แจ้งเรื่อง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mutual Cancel (R12) */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <p className="text-base font-bold text-gray-900">🤝 ขอยกเลิกร่วมกัน (R12)</p>
            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              <p className="text-xs text-gray-700 font-medium">เมื่อยกเลิกร่วม:</p>
              <p className="text-xs text-gray-500">• พอยต์ทองค่า offer คืนผู้ซื้อ</p>
              <p className="text-xs text-gray-500">• พอยต์ทองค่าประกาศคืนผู้ขาย</p>
              <p className="text-xs text-gray-500">• ต้องรออีกฝ่ายยืนยันด้วย</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                ยังไม่ยกเลิก
              </button>
              <button
                onClick={handleMutualCancel}
                className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                ส่งคำขอยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-gray-500 shrink-0">{label}</p>
      <p className={`text-sm text-right ${bold ? "font-bold text-weeeu-primary" : "font-medium text-gray-800"}`}>{value}</p>
    </div>
  );
}
