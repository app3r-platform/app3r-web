"use client";

// ── OrderCard — Gen 80 (5-stage: +confirm action) ────────────────────────────

import type { PartOrder } from "../../app/(app)/parts/_lib/types";
import { ORDER_STAGE_COLOR, ORDER_STAGE_LABEL, DELIVERY_LABEL } from "../../app/(app)/parts/_lib/types";
import { OrderStageStepper } from "./OrderStageStepper";

interface OrderCardProps {
  order: PartOrder;
  role: "buyer" | "seller";
  onAction?: (action: "confirm" | "ship" | "receive" | "cancel", orderId: string) => void;
}

export function OrderCard({ order, role, onAction }: OrderCardProps) {
  // Gen 80 5-stage authority
  const canConfirm = role === "seller" && order.stage === "ordered";
  const canShip    = role === "seller" && order.stage === "confirmed";
  const canReceive = role === "buyer"  && order.stage === "shipped";
  const canCancel  = (order.stage === "ordered" || order.stage === "confirmed") &&
                     (role === "buyer" || role === "seller");

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 truncate">{order.partName}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {role === "buyer"
              ? `ซื้อจาก: ${order.sellerShopName}`
              : `ขายให้: ${order.buyerShopName}`}
          </p>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${ORDER_STAGE_COLOR[order.stage]}`}>
          {ORDER_STAGE_LABEL[order.stage]}
        </span>
      </div>

      {/* Stepper (5 ขั้น) */}
      <div className="py-1">
        <OrderStageStepper stage={order.stage} />
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-gray-400">จำนวน</p>
          <p className="font-medium text-gray-700">{order.quantity} ชิ้น</p>
        </div>
        <div>
          <p className="text-gray-400">รวม</p>
          <p className="font-bold text-green-700">{order.totalPoints.toLocaleString()} pts</p>
        </div>
        <div>
          <p className="text-gray-400">จัดส่ง</p>
          <p className="font-medium text-gray-700">{DELIVERY_LABEL[order.deliveryMethod]}</p>
        </div>
      </div>

      {order.trackingNumber && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5">
          📦 Tracking: <span className="font-mono font-medium text-gray-700">{order.trackingNumber}</span>
        </p>
      )}

      {/* Actions */}
      {onAction && (
        <div className="flex flex-col gap-2">
          {/* P5: ผู้ขายกดรับออเดอร์ ordered→confirmed */}
          {canConfirm && (
            <button
              onClick={() => onAction("confirm", order.id)}
              className="w-full bg-[#FF663A] hover:bg-[#F04E20] text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              ☑️ รับออเดอร์ (P5)
            </button>
          )}
          {/* P6: ผู้ขายกดส่ง confirmed→shipped */}
          {canShip && (
            <button
              onClick={() => onAction("ship", order.id)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              📦 บันทึกการจัดส่ง (P6)
            </button>
          )}
          {/* P7: ผู้ซื้อกดรับของ shipped→received */}
          {canReceive && (
            <button
              onClick={() => onAction("receive", order.id)}
              className="w-full bg-green-700 hover:bg-green-800 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              ✅ ยืนยันรับของ (P7)
            </button>
          )}
          {/* P8/P9: ยกเลิก (เฉพาะก่อน shipped) */}
          {canCancel && (
            <button
              onClick={() => onAction("cancel", order.id)}
              className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium py-2 rounded-xl transition-colors"
            >
              🚫 ยกเลิก
            </button>
          )}
          {/* หลัง shipped — ยกเลิกไม่ได้ */}
          {order.stage === "shipped" && role !== "buyer" && (
            <p className="text-xs text-center text-gray-400">รอผู้ซื้อยืนยันรับของ</p>
          )}
          {order.stage === "received" && (
            <p className="text-xs text-center text-gray-400">✅ งานนี้ปิดแล้ว</p>
          )}
          {/* ไม่มีปุ่ม → แจ้ง */}
          {!canConfirm && !canShip && !canReceive && !canCancel &&
           order.stage !== "received" && order.stage !== "shipped" && order.stage !== "cancelled" && (
            <p className="text-xs text-center text-gray-400">รอฝ่ายตรงข้ามดำเนินการ</p>
          )}
        </div>
      )}
    </div>
  );
}
