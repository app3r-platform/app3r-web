"use client";

// ── OrderActionButtons — Gen 80 (5-stage + confirmed) ────────────────────────
// ปุ่ม action ตาม stage + per-stage owner check
// canTransition() helper ตรวจสิทธิ์ก่อนแสดงปุ่ม

import type { OrderStage } from "../../app/(app)/parts/_lib/types";

type Role = "buyer" | "seller";

/**
 * canTransition — strict per-stage owner check (Gen 80 5-stage D81)
 *
 * listed → ordered     : ร้านผู้ซื้อ (handled at PlaceOrderModal)
 * ordered → confirmed  : ร้านผู้ขาย  (P5)
 * confirmed → shipped  : ร้านผู้ขาย  (P6)
 * shipped → received   : ร้านผู้ซื้อ  (P7)
 * ordered/confirmed → cancelled : ทั้งคู่ (P8/P9) — ห้ามหลัง shipped
 */
export function canTransition(role: Role, from: OrderStage, to: OrderStage): boolean {
  if (from === "ordered"   && to === "confirmed" && role === "seller") return true;
  if (from === "confirmed" && to === "shipped"   && role === "seller") return true;
  if (from === "shipped"   && to === "received"  && role === "buyer")  return true;
  if ((from === "ordered" || from === "confirmed") && to === "cancelled") return true; // P8/P9
  return false;
}

interface OrderActionButtonsProps {
  stage: OrderStage;
  role: Role;
  onConfirm?:  () => void;
  onShip?:     () => void;
  onReceive?:  () => void;
  onCancel?:   () => void;
}

export function OrderActionButtons({
  stage, role, onConfirm, onShip, onReceive, onCancel,
}: OrderActionButtonsProps) {
  const showConfirm = canTransition(role, stage, "confirmed");
  const showShip    = canTransition(role, stage, "shipped");
  const showReceive = canTransition(role, stage, "received");
  const showCancel  = canTransition(role, stage, "cancelled");

  const cantCancelNote =
    stage === "shipped"  ? "ยกเลิกไม่ได้ — อยู่ระหว่างจัดส่งแล้ว" :
    stage === "received" ? "ปิดงานแล้ว" : null;

  return (
    <div className="space-y-2">
      {showConfirm && (
        <button onClick={onConfirm} className="w-full bg-[#FF663A] hover:bg-[#F04E20] text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
          ☑️ รับออเดอร์ (P5)
        </button>
      )}
      {showShip && (
        <button onClick={onShip} className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
          📦 บันทึกการจัดส่ง (P6)
        </button>
      )}
      {showReceive && (
        <button onClick={onReceive} className="w-full bg-[#FF663A] hover:bg-[#F04E20] text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
          ✅ ยืนยันรับของ & ปลดพักเงินกลาง (Escrow) (P7)
        </button>
      )}
      {showCancel && (
        <button onClick={onCancel} className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium py-2 rounded-xl transition-colors">
          🚫 ยกเลิกคำสั่งซื้อ
        </button>
      )}
      {cantCancelNote && (
        <p className="text-xs text-center text-gray-400">{cantCancelNote}</p>
      )}
    </div>
  );
}
