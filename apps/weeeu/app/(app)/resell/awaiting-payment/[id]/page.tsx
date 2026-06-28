"use client";

/**
 * Awaiting Payment — WeeeU
 * Screen ID: U-RES-PAY  ·  Path: /resell/awaiting-payment/[id]
 * Covers: R4 — buyer ชำระเงิน LOCK escrow · countdown 24ชม.
 *
 * Option A: ไม่ gate ปุ่มด้วย gold-balance (ไม่มี read endpoint)
 * → แสดงปุ่มจ่ายเสมอ · backend enforce INSUFFICIENT_GOLD → 400 → error display
 * F2 hydration: useCountdown start at 0, update via useEffect
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { EscrowInfoIcon } from "@/components/shared/EscrowInfo";
import { listingsApi } from "@/lib/api/listings";
import { offersApi } from "@/lib/api/offers";

type MyOffer = {
  listingId: string;
  offerPrice: number;
  status: string;
  fundingDeadline?: string;
  expiresAt?: string;
};

type OrderData = {
  listing_title: string;
  seller_name: string;
  buyer_name: string;
  agreed_price: number | null;
  payment_deadline: string;
  is_buyer: boolean;
};

// F2 fix: init remaining = 0 (SSR safe) · update via useEffect หลัง mount
function useCountdown(deadline: string) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!deadline) return;
    const calc = () => Math.max(0, new Date(deadline).getTime() - Date.now());
    setRemaining(calc());
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

export default function AwaitingPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      listingsApi.get(id),
      offersApi.mine() as Promise<MyOffer[]>,
    ])
      .then(([listing, myOffers]) => {
        const myOffer = myOffers.find(
          (o) => o.listingId === id && o.status === "selected"
        );
        // money-safe: ห้าม ??0 / price||0 · null = แสดง "ราคาไม่ระบุ"
        const agreedPrice =
          myOffer?.offerPrice != null
            ? myOffer.offerPrice
            : typeof listing.price === "number"
            ? listing.price
            : null;
        const deadline =
          myOffer?.fundingDeadline ??
          myOffer?.expiresAt ??
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        setOrder({
          listing_title: listing.appliance_name ?? "สินค้ามือสอง",
          seller_name: listing.seller_name ?? "ผู้ขาย",
          buyer_name: "คุณ",
          agreed_price: agreedPrice,
          payment_deadline: deadline,
          is_buyer: true,
        });
      })
      .catch(() =>
        setFetchError("โหลดข้อมูลไม่สำเร็จ — กรุณารีเฟรชหน้า")
      );
  }, [id]);

  const remaining = useCountdown(order?.payment_deadline ?? "");
  const totalMs = 24 * 60 * 60 * 1000;
  const pct = order ? Math.min(100, (remaining / totalMs) * 100) : 100;
  const isLow = remaining > 0 && remaining < 3 * 60 * 60 * 1000;
  // expired = true เฉพาะหลัง mount + fetch เสร็จ (ป้องกัน false expired ตอน load)
  const expired = mounted && !!order && remaining === 0;

  const [paying, setPaying] = useState(false);
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
        setPayError("หน้าต่างชำระเงินหมดเวลา — กรุณาติดต่อผู้ขาย");
      } else if (e?.status === 400) {
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

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (!order && !fetchError) {
    return (
      <div className="max-w-xl py-16 text-center text-gray-400 text-sm">
        ⟳ กำลังโหลด...
      </div>
    );
  }

  if (fetchError || !order) {
    return (
      <div className="max-w-xl py-8 text-center">
        <p className="text-red-500 text-sm">{fetchError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-weeeu-primary underline"
        >
          รีเฟรชหน้า
        </button>
      </div>
    );
  }

  // ─── Seller View ─────────────────────────────────────────────────────────────
  if (!order.is_buyer) {
    return (
      <div className="max-w-xl space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/offers" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
          <h1 className="text-xl font-bold text-gray-900">รอการชำระเงิน</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">รายการ</p>
          <p className="font-semibold text-gray-900">{order.listing_title}</p>
          <p className="text-xl font-bold text-weeeu-primary">
            {order.agreed_price != null ? order.agreed_price.toLocaleString() : "ราคาไม่ระบุ"} พอยต์ทอง
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-semibold text-yellow-800">รอการชำระเงินจากผู้ซื้อ</p>
              <p className="text-sm text-yellow-700">
                {order.buyer_name} มีเวลา{" "}
                {mounted ? formatCountdown(remaining) : "--:--:--"} เพื่อชำระ
              </p>
            </div>
          </div>
          <div className="h-2 bg-yellow-100 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          {expired && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700 font-medium">⌛ หมดเวลาแล้ว — ระบบจะปลดล็อคข้อเสนออื่นอัตโนมัติ</p>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 text-center">คุณจะได้รับแจ้งทันทีเมื่อผู้ซื้อชำระเงินสำเร็จ</p>
      </div>
    );
  }

  // ─── Buyer View ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/offers" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">ชำระเงิน — พักเงินกลาง (Escrow) <EscrowInfoIcon /></h1>
      </div>

      {/* Order info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">รายการที่เลือก</p>
        <p className="font-semibold text-gray-900">{order.listing_title}</p>
        <p className="text-sm text-gray-600">ผู้ขาย: {order.seller_name}</p>
        <p className="text-2xl font-bold text-weeeu-primary">
          {order.agreed_price != null ? order.agreed_price.toLocaleString() : "ราคาไม่ระบุ"} พอยต์ทอง
        </p>
        <p className="text-xs text-gray-400">
          พอยต์ทอง จะถูกล็อคในระบบพักเงินกลาง <EscrowInfoIcon className="inline-flex" /> จนกว่าคุณยืนยันรับสินค้า
        </p>
      </div>

      {/* Countdown */}
      {!expired ? (
        <div className={`rounded-2xl p-5 space-y-3 border ${isLow ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}`}>
          <div className="flex items-center justify-between">
            <p className={`text-sm font-semibold ${isLow ? "text-red-800" : "text-yellow-800"}`}>⏱ เหลือเวลา</p>
            <p className={`text-2xl font-mono font-bold tabular-nums ${isLow ? "text-red-700" : "text-yellow-700"}`}>
              {mounted ? formatCountdown(remaining) : "--:--:--"}
            </p>
          </div>
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${isLow ? "bg-red-500" : "bg-yellow-400"}`} style={{ width: `${pct}%` }} />
          </div>
          <p className={`text-xs ${isLow ? "text-red-600" : "text-yellow-700"}`}>
            {isLow ? "⚠️ เวลาใกล้หมด! หากไม่ชำระ ข้อเสนอจะถูกยกเลิกอัตโนมัติ" : "กรุณาชำระเงินภายในเวลาที่กำหนด"}
          </p>
          <p className="text-[11px] text-gray-500 border-t border-black/5 pt-1.5">
            🔔 ระบบจะแจ้งเตือนทุก 6 ชม. ภายในกรอบ 24 ชม. — หากเกินกำหนด ข้อเสนอถูกยกเลิกอัตโนมัติ
          </p>
        </div>
      ) : (
        <div className="bg-gray-100 border border-gray-200 rounded-2xl p-6 text-center space-y-2">
          <p className="text-4xl">⌛</p>
          <p className="font-semibold text-gray-700">หมดเวลาชำระเงินแล้ว</p>
          <p className="text-sm text-gray-500">ข้อเสนอของคุณถูกยกเลิกอัตโนมัติ<br />ผู้ขายสามารถเลือกข้อเสนออื่นได้แล้ว</p>
          <div className="pt-2">
            <Link href="/offers" className="inline-block border border-gray-300 text-gray-600 font-medium px-5 py-2 rounded-xl text-sm hover:bg-gray-50">
              ← ดูข้อเสนออื่น
            </Link>
          </div>
        </div>
      )}

      {/* Actions — Option A: แสดงปุ่มจ่ายเสมอ · backend enforce balance · 400 INSUFFICIENT_GOLD → catch แสดง error */}
      {!expired && (
        <div className="space-y-2.5">
          {payError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
              <p className="text-sm text-red-700">{payError}</p>
              {payError.includes("ไม่เพียงพอ") && (
                <Link href="/wallet/deposit" className="text-sm text-yellow-600 font-medium underline">
                  🪙 เติม พอยต์ทอง
                </Link>
              )}
            </div>
          )}
          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-4 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {paying ? (
              <><span className="animate-spin inline-block">⟳</span> กำลังชำระ...</>
            ) : (
              <>✅ ชำระ {order.agreed_price != null ? order.agreed_price.toLocaleString() : "—"} พอยต์ทอง เข้าระบบพักเงินกลาง <EscrowInfoIcon className="inline-flex" /></>
            )}
          </button>
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
