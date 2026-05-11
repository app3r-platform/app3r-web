"use client";

import { useState } from "react";
import type { PartOrder } from "../../app/(app)/parts/_lib/types";
import { calcFee } from "../../lib/utils/parts-escrow";

interface ConfirmReceiveModalProps {
  order: PartOrder;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmReceiveModal({ order, onConfirm, onClose }: ConfirmReceiveModalProps) {
  const [loading, setLoading] = useState(false);
  const { roundedFee, netToSeller } = calcFee(order.totalPoints);

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">ยืนยันรับของ</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">{order.partName} × {order.quantity}</p>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2 text-sm">
          <p className="text-xs font-semibold text-green-700">เมื่อยืนยันรับของ ระบบจะ:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✅ โอน <strong>{netToSeller.toLocaleString()} pts</strong> ให้ผู้ขาย</li>
            <li>💰 หักค่าธรรมเนียม <strong>{roundedFee.toLocaleString()} pts</strong> (3% ปัด D75)</li>
            <li>🔓 ปลด escrow (คะแนนพักระหว่างกลาง) ทั้งหมด</li>
          </ul>
        </div>

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? "กำลังยืนยัน…" : "✅ ยืนยันรับของ & ปลด escrow"}
        </button>
      </div>
    </div>
  );
}
