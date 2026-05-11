"use client";

import { useState } from "react";
import type { PartOrder } from "../../app/(app)/parts/_lib/types";

interface CancelOrderConfirmProps {
  order: PartOrder;
  onConfirm: () => void;
  onClose: () => void;
}

export function CancelOrderConfirm({ order, onConfirm, onClose }: CancelOrderConfirmProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-red-600">ยืนยันยกเลิกคำสั่งซื้อ</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">{order.partName} × {order.quantity}</p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2 text-sm">
          <p className="text-xs font-semibold text-red-700">เมื่อยกเลิก ระบบจะ:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>💸 คืน escrow <strong>{order.totalPoints.toLocaleString()} pts</strong> ให้คุณ</li>
            <li>📦 คืนสต็อกให้ผู้ขาย +{order.quantity} ชิ้น</li>
          </ul>
          <p className="text-xs text-red-600 mt-1">⚠️ ยกเลิกได้เฉพาะขั้น &quot;สั่งซื้อแล้ว&quot; เท่านั้น</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl transition-colors text-sm">
            ไม่ยกเลิก
          </button>
          <button onClick={handleConfirm} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
            {loading ? "กำลังยกเลิก…" : "🚫 ยืนยันยกเลิก"}
          </button>
        </div>
      </div>
    </div>
  );
}
