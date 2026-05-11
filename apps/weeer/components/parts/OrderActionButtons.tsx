"use client";

// ── OrderActionButtons — Phase C-6 ───────────────────────────────────────────
// ปุ่ม action ตาม stage + per-stage owner check
// canTransition() helper ตรวจสิทธิ์ก่อนแสดงปุ่ม

import type { OrderStage } from "../../app/(app)/parts/_lib/types";

type Role = "buyer" | "seller";

/** ตรวจสิทธิ์การเปลี่ยน stage — strict per-stage owner (D81) */
export function canTransition(role: Role, from: OrderStage, to: OrderStage): boolean {
  if (from === "ordered"  && to === "shipped"   && role === "seller") return true;
  if (from === "shipped"  && to === "received"  && role === "buyer")  return true;
  if (from === "ordered"  && to === "cancelled" && (role === "buyer" || role === "seller")) return true;
  return false;
}

interface OrderActionButtonsProps {
  stage: OrderStage;
  role: Role;
  onShip?: () => void;
  onReceive?: () => void;
  onCancel?: () => void;
}

export function OrderActionButtons({
  stage, role, onShip, onReceive, onCancel,
}: OrderActionButtonsProps) {
  const showShip    = canTransition(role, stage, "shipped");
  const showReceive = canTransition(role, stage, "received");
  const showCancel  = canTransition(role, stage, "cancelled");

  const cantCancelNote =
    stage === "shipped"  ? "ยกเลิกไม่ได้ — อยู่ระหว่างจัดส่งแล้ว" :
    stage === "received" ? "ปิดงานแล้ว" : null;

  return (
    <div className="space-y-2">
      {showShip && (
        <button onClick={onShip} className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
          📦 บันทึกการจัดส่ง
        </button>
      )}
      {showReceive && (
        <button onClick={onReceive} className="w-full bg-green-700 hover:bg-green-800 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
          ✅ ยืนยันรับของ & ปลด escrow
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
