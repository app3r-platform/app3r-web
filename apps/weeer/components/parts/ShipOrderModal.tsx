"use client";

import { useState } from "react";
import type { PartOrder } from "../../app/(app)/parts/_lib/types";

interface ShipOrderModalProps {
  order: PartOrder;
  onConfirm: (trackingNumber: string) => void;
  onClose: () => void;
}

export function ShipOrderModal({ order, onConfirm, onClose }: ShipOrderModalProps) {
  const [tracking, setTracking] = useState("");
  const [loading, setLoading] = useState(false);
  const isCourier = order.deliveryMethod === "courier";

  const handleConfirm = async () => {
    if (isCourier && !tracking.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    onConfirm(tracking.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">บันทึกการจัดส่ง</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">{order.partName} × {order.quantity}</p>
        {isCourier ? (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              เลขพัสดุ (Tracking Number) <span className="text-red-500">*</span>
            </label>
            <input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="เช่น TH123456789"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
            🏪 รูปแบบจัดส่ง: รับเอง — ไม่ต้องใส่เลขพัสดุ
          </div>
        )}
        <button
          onClick={handleConfirm}
          disabled={isCourier && !tracking.trim() || loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? "กำลังบันทึก…" : "📦 ยืนยันจัดส่ง"}
        </button>
      </div>
    </div>
  );
}
