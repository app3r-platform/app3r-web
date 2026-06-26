"use client";

/**
 * Awaiting Payment — WeeeU
 * Screen ID: U-RES-PAY  ·  Path: /resell/awaiting-payment/[id]
 * Covers: R4 — buyer พอยต์ทอง ไม่พอ / รอเติม ≤ 24ชม. · countdown bar · auto-cancel เมื่อ = 0
 *         R4 seller — แสดง state "รอการชำระเงินจากผู้ซื้อ"
 * mock-anno: ลบ class mock-anno* ก่อน production (grep mock-anno)
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { EscrowInfoIcon } from "@/components/shared/EscrowInfo";
import { MockAnnoBar } from "@/components/shared/MockAnnoBar";
import { listingsApi } from "@/lib/api/listings";

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_ORDER = {
  id: "txn-001",
  listing_title: "ตู้เย็น Samsung 2 ประตู สีเงิน",
  seller_name: "นิพนธ์ ใจดี",
  buyer_name: "สมชาย พิมพ์ใจ",
  agreed_price: 4300,
  // 18 hours from now — เปลี่ยน offset เพื่อทดสอบ (ใส่ 0 เพื่อ test expired state)
  payment_deadline: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
  gold_balance: 3000,       // ยอด พอยต์ทอง ปัจจุบันของ buyer
  required_gold: 4300,      // ยอด พอยต์ทอง ที่ต้องการ
  is_buyer: true,           // false = seller view
};

// ─── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(deadline: string) {
  const calc = () => Math.max(0, new Date(deadline).getTime() - Date.now());
  const [remaining, setRemaining] = useState(calc);

  useEffect(() => {
    const iv = setInterval(() => setRemaining(calc), 1000);
    return () => clearInterval(iv);
  }, [deadline]);

  return remaining;
}

function formatCountdown(ms: number) {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AwaitingPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const order = MOCK_ORDER;

  const remaining = useCountdown(order.payment_deadline);
  const totalMs = 24 * 60 * 60 * 1000;
  const pct = Math.min(100, (remaining / totalMs) * 100);
  const isLow = remaining > 0 && remaining < 3 * 60 * 60 * 1000;
  const expired = remaining === 0;

  // money-safe: null guard (ห้าม ??0 บน money)
  const requiredGold = order.required_gold != null ? order.required_gold : null;
  const goldBalance = order.gold_balance != null ? order.gold_balance : null;
  const shortfall = requiredGold != null && goldBalance != null
    ? Math.max(0, requiredGold - goldBalance)
    : null;

  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!id) return;
    setPaying(true);
    setPayError(null);
    try {
      // §2 thin: confirmFunding คืน {listingId,state,lockedAmount} — ห้าม setState(thin)
      // navigate ไป orders/[id] ทันที (re-fetch state จาก page นั้น)
      await listingsApi.confirmFunding(id);
      router.push(`/resell/orders/${id}`);
    } catch (err: unknown) {
      const e = err as { status?: number; code?: string };
      if (e?.status === 403) {
        setPayError("ไม่มีสิทธิ์ชำระ — ตรวจสอบสถานะผู้ซื้อ");
      } else if (e?.status === 409) {
        // FUNDING_WINDOW_EXPIRED / NO_SELECTED_OFFER / INVALID_STATE
        setPayError("หน้าต่างชำระเงินหมดเวลา — กรุณาติดต่อผู้ขาย");
      } else if (e?.status === 400) {
        // INSUFFICIENT_GOLD / CONFIRM_FUNDING_FAILED → แนะนำเติม Gold
        // INVALID_TRANSITION (อื่นๆ) → refresh
        const insufficientCodes = ["INSUFFICIENT_GOLD", "CONFIRM_FUNDING_FAILED"];
        if (e?.code && insufficientCodes.includes(e.code)) {
          setPayError("พอยต์ทองไม่เพียงพอ — กรุณาเติมก่อน");
        } else {
          setPayError("ไม่สามารถชำระได้ในสถานะนี้ — รีเฟรชหน้า");
        }
      } else {
        setPayError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
      setPaying(false);
    }
  };

  // ─── Seller View ─────────────────────────────────────────────────────────
  if (!order.is_buyer) {
    return (
      <div className="max-w-xl space-y-5">
        {/* §5 §8 annotations */}
        <div className="flex items-center gap-3">
          <Link href="/offers" className="text-gray-500 hover:text-gray-800 text-xl">
            ‹
          </Link>
          <h1 className="text-xl font-bold text-gray-900">รอการชำระเงิน</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            รายการ
          </p>
          <p className="font-semibold text-gray-900">{order.listing_title}</p>
          <p className="text-xl font-bold text-weeeu-primary">
            {order.agreed_price.toLocaleString()} พอยต์ทอง
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-semibold text-yellow-800">รอการชำระเงินจากผู้ซื้อ</p>
              <p className="text-sm text-yellow-700">
                {order.buyer_name} มีเวลา {formatCountdown(remaining)} เพื่อชำระ
              </p>
            </div>
          </div>
          <div className="h-2 bg-yellow-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
          {expired && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700 font-medium">
                ⌛ หมดเวลาแล้ว — ระบบจะปลดล็อคข้อเสนออื่นอัตโนมัติ
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center">
          คุณจะได้รับแจ้งทันทีเมื่อผู้ซื้อชำระเงินสำเร็จ
        </p>
      </div>
    );
  }

  // ─── Buyer View ──────────────────────────────────────────────────────────
  if (paid) {
    return (
      <div className="max-w-xl space-y-5">
        {/* §5 §8 annotations */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-3">
          <p className="text-5xl">✅</p>
          <p className="font-bold text-green-800 text-lg">ชำระเงินสำเร็จ!</p>
          <p className="text-sm text-green-600">
            พอยต์ทอง {order.agreed_price.toLocaleString()} ถูกล็อคในระบบพักเงินกลาง (Escrow) <EscrowInfoIcon className="inline-flex" /> แล้ว
            <br />
            รอผู้ขายจัดส่งสินค้า
          </p>
          <Link
            href={`/resell/orders/${id}`}
            className="inline-block mt-2 bg-green-600 text-white font-semibold px-6 py-2.5 rounded-2xl text-sm hover:bg-green-700 transition-colors"
          >
            ดูสถานะคำสั่งซื้อ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-5">
      <MockAnnoBar />
      {/* §5 origin + §8 cross-app */}
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/offers" className="text-gray-500 hover:text-gray-800 text-xl">
          ‹
        </Link>
        <h1 className="text-xl font-bold text-gray-900">ชำระเงิน — พักเงินกลาง (Escrow) <EscrowInfoIcon /></h1>
      </div>

      {/* Order info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          รายการที่เลือก
        </p>
        <p className="font-semibold text-gray-900">{order.listing_title}</p>
        <p className="text-sm text-gray-600">ผู้ขาย: {order.seller_name}</p>
        <p className="text-2xl font-bold text-weeeu-primary">
          {order.agreed_price.toLocaleString()} พอยต์ทอง
        </p>
        <p className="text-xs text-gray-400">
          พอยต์ทอง จะถูกล็อคในระบบพักเงินกลาง <EscrowInfoIcon className="inline-flex" /> จนกว่าคุณยืนยันรับสินค้า
        </p>
      </div>

      {/* Countdown */}
      {!expired ? (
        <div
          className={`rounded-2xl p-5 space-y-3 border ${
            isLow
              ? "bg-red-50 border-red-200"
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <p
              className={`text-sm font-semibold ${
                isLow ? "text-red-800" : "text-yellow-800"
              }`}
            >
              ⏱ เหลือเวลา
            </p>
            <p
              className={`text-2xl font-mono font-bold tabular-nums ${
                isLow ? "text-red-700" : "text-yellow-700"
              }`}
            >
              {formatCountdown(remaining)}
            </p>
          </div>
          {/* Progress bar */}
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isLow ? "bg-red-500" : "bg-yellow-400"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className={`text-xs ${isLow ? "text-red-600" : "text-yellow-700"}`}>
            {isLow
              ? "⚠️ เวลาใกล้หมด! หากไม่ชำระ ข้อเสนอจะถูกยกเลิกอัตโนมัติ"
              : "กรุณาชำระเงินภายในเวลาที่กำหนด"}
          </p>
          {/* #3 gold-lock: เตือนทุก 6 ชม. (mock UI · logic BE) */}
          <p className="text-[11px] text-gray-500 border-t border-black/5 pt-1.5">
            🔔 ระบบจะแจ้งเตือนทุก 6 ชม. ภายในกรอบ 24 ชม. — หากเกินกำหนด พอยต์ทองที่ล็อกจะถูกปลดและข้อเสนอถูกยกเลิกอัตโนมัติ
          </p>
        </div>
      ) : (
        /* ─── Expired state ─── */
        <div className="bg-gray-100 border border-gray-200 rounded-2xl p-6 text-center space-y-2">
          <p className="text-4xl">⌛</p>
          <p className="font-semibold text-gray-700">หมดเวลาชำระเงินแล้ว</p>
          <p className="text-sm text-gray-500">
            ข้อเสนอของคุณถูกยกเลิกอัตโนมัติ
            <br />
            ผู้ขายสามารถเลือกข้อเสนออื่นได้แล้ว
          </p>
          <div className="pt-2">
            <Link
              href="/offers"
              className="inline-block border border-gray-300 text-gray-600 font-medium px-5 py-2 rounded-xl text-sm hover:bg-gray-50"
            >
              ← ดูข้อเสนออื่น
            </Link>
          </div>
        </div>
      )}

      {/* พอยต์ทอง balance */}
      {!expired && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            ยอด พอยต์ทอง ของคุณ
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ยอดปัจจุบัน</span>
              <span className="font-bold text-yellow-600">
                🪙 {goldBalance != null ? goldBalance.toLocaleString() : "—"} พอยต์ทอง
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ต้องใช้ระบบพักเงินกลาง <EscrowInfoIcon className="inline-flex" /></span>
              <span className="font-bold text-weeeu-primary">
                {requiredGold != null ? requiredGold.toLocaleString() : "ราคาไม่ระบุ"} พอยต์ทอง
              </span>
            </div>
            {shortfall != null && shortfall > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between">
                <p className="text-sm text-orange-700 font-medium">
                  พอยต์ทอง ไม่พอ — ขาดอีก
                </p>
                <p className="text-sm font-bold text-orange-700">
                  {shortfall.toLocaleString()} พอยต์ทอง
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {!expired && (
        <div className="space-y-2.5">
          {payError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{payError}</p>
            </div>
          )}
          {shortfall != null && shortfall > 0 ? (
            <Link
              href="/wallet/deposit"
              className="w-full block text-center bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 rounded-2xl text-sm transition-colors"
            >
              🪙 เติม พอยต์ทอง ก่อนชำระ (ขาด {shortfall.toLocaleString()})
            </Link>
          ) : (
            <button
              onClick={handlePay}
              disabled={paying || shortfall == null}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-4 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {paying ? (
                <>
                  <span className="animate-spin inline-block">⟳</span> กำลังชำระ...
                </>
              ) : (
                <>✅ ชำระ {requiredGold != null ? requiredGold.toLocaleString() : "—"} พอยต์ทอง เข้าระบบพักเงินกลาง <EscrowInfoIcon className="inline-flex" /></>
              )}
            </button>
          )}
          <Link
            href="/offers"
            className="w-full block text-center border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            กลับไปข้อเสนออื่น
          </Link>
        </div>
      )}
    </div>
  );
}
