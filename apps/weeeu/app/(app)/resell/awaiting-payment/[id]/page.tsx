"use client";

/**
 * Awaiting Payment — WeeeU
 * Covers: R4 — buyer Gold ไม่พอ / รอเติม ≤ 24ชม. · countdown bar · auto-cancel เมื่อ = 0
 *         R4 seller — แสดง state "รอการชำระเงินจากผู้ซื้อ"
 * Path: /resell/awaiting-payment/[id]
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EscrowInfoIcon } from "@/components/shared/EscrowInfo";

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_ORDER = {
  id: "txn-001",
  listing_title: "ตู้เย็น Samsung 2 ประตู สีเงิน",
  seller_name: "นิพนธ์ ใจดี",
  buyer_name: "สมชาย พิมพ์ใจ",
  agreed_price: 4300,
  // 18 hours from now — เปลี่ยน offset เพื่อทดสอบ (ใส่ 0 เพื่อ test expired state)
  payment_deadline: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
  gold_balance: 3000,       // ยอด Gold ปัจจุบันของ buyer
  required_gold: 4300,      // ยอด Gold ที่ต้องการ
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
  const order = MOCK_ORDER;

  const remaining = useCountdown(order.payment_deadline);
  const totalMs = 24 * 60 * 60 * 1000;
  const pct = Math.min(100, (remaining / totalMs) * 100);
  const isLow = remaining > 0 && remaining < 3 * 60 * 60 * 1000; // < 3h
  const expired = remaining === 0;

  const shortfall = Math.max(0, order.required_gold - order.gold_balance);
  const canPay = shortfall === 0 && !expired;

  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const handlePay = async () => {
    setPaying(true);
    await new Promise((r) => setTimeout(r, 900));
    setPaying(false);
    setPaid(true);
  };

  // ─── Seller View ─────────────────────────────────────────────────────────
  if (!order.is_buyer) {
    return (
      <div className="max-w-xl space-y-5">
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
            {order.agreed_price.toLocaleString()} ฿
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
                ⌛ หมดเวลาแล้ว — ระบบจะปลดล็อคข้อเสนืออื่นอัตโนมัติ
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
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-3">
          <p className="text-5xl">✅</p>
          <p className="font-bold text-green-800 text-lg">ชำระเงินสำเร็จ!</p>
          <p className="text-sm text-green-600">
            Gold {order.agreed_price.toLocaleString()} ถูกล็อคในระบบพักเงินกลาง (Escrow) <EscrowInfoIcon className="inline-flex" /> แล้ว
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
          {order.agreed_price.toLocaleString()} Gold
        </p>
        <p className="text-xs text-gray-400">
          Gold จะถูกล็อคในระบบพักเงินกลาง <EscrowInfoIcon className="inline-flex" /> จนกว่าคุณยืนยันรับสินค้า
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
            ผู้ขายสามารถเลือกข้อเสนืออื่นได้แล้ว
          </p>
          <div className="pt-2">
            <Link
              href="/offers"
              className="inline-block border border-gray-300 text-gray-600 font-medium px-5 py-2 rounded-xl text-sm hover:bg-gray-50"
            >
              ← ดูข้อเสนืออื่น
            </Link>
          </div>
        </div>
      )}

      {/* Gold balance */}
      {!expired && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            ยอด Gold ของคุณ
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ยอดปัจจุบัน</span>
              <span className="font-bold text-yellow-600">
                🪙 {order.gold_balance.toLocaleString()} Gold
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ต้องใช้ระบบพักเงินกลาง <EscrowInfoIcon className="inline-flex" /></span>
              <span className="font-bold text-weeeu-primary">
                {order.required_gold.toLocaleString()} Gold
              </span>
            </div>
            {shortfall > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between">
                <p className="text-sm text-orange-700 font-medium">
                  Gold ไม่พอ — ขาดอีก
                </p>
                <p className="text-sm font-bold text-orange-700">
                  {shortfall.toLocaleString()} Gold
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {!expired && (
        <div className="space-y-2.5">
          {shortfall > 0 ? (
            <Link
              href="/wallet/deposit"
              className="w-full block text-center bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 rounded-2xl text-sm transition-colors"
            >
              🪙 เติม Gold ก่อนชำระ (ขาด {shortfall.toLocaleString()})
            </Link>
          ) : (
            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-4 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {paying ? (
                <>
                  <span className="animate-spin inline-block">⟳</span> กำลังชำระ...
                </>
              ) : (
                <>✅ ชำระ {order.agreed_price.toLocaleString()} Gold เข้าระบบพักเงินกลาง <EscrowInfoIcon className="inline-flex" /></>
              )}
            </button>
          )}
          <Link
            href="/offers"
            className="w-full block text-center border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            กลับไปข้อเสนืออื่น
          </Link>
        </div>
      )}
    </div>
  );
}
