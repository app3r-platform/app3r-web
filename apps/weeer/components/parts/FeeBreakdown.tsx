"use client";

import { calcFee } from "../../lib/utils/parts-escrow";

interface FeeBreakdownProps {
  totalPoints: number;
  quantity?: number;
  pricePerUnit?: number;
}

export function FeeBreakdown({ totalPoints, quantity, pricePerUnit }: FeeBreakdownProps) {
  const { rawFee, roundedFee, netToSeller, direction } = calcFee(totalPoints);

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">สรุปค่าใช้จ่าย</p>
      {quantity && pricePerUnit && (
        <div className="flex justify-between text-gray-600">
          <span>{quantity} × {pricePerUnit.toLocaleString()} พอยต์</span>
          <span>{totalPoints.toLocaleString()} พอยต์</span>
        </div>
      )}
      <div className="flex justify-between text-gray-600">
        <span>ค่าธรรมเนียมแพลตฟอร์ม (3%)</span>
        <span className="flex items-center gap-1">
          {roundedFee.toLocaleString()} พอยต์
          {direction !== "exact" && (
            <span className="text-xs text-orange-500" title={`ค่าจริง ${rawFee.toFixed(2)} พอยต์ — ปัด${direction === "up" ? "ขึ้น" : "ลง"}`}>{/* PHASE-4: D75 */}
              {direction === "up" ? "⬆️" : "⬇️"}
            </span>
          )}
        </span>
      </div>
      <div className="flex justify-between font-bold text-[#D63B12] pt-1 border-t border-gray-200">
        <span>ยอดโอนให้ผู้ขาย (net)</span>
        <span>{netToSeller.toLocaleString()} พอยต์</span>
      </div>
      <div className="flex justify-between font-bold text-blue-700 border-t border-gray-200 pt-1">
        <span>ยอดที่คุณต้องจ่าย</span>
        <span>{totalPoints.toLocaleString()} พอยต์</span>
      </div>
      <p className="text-xs text-gray-400">* ค่าธรรมเนียมปัดเศษ (ปัดเป็น integer — ≥0.5 ขึ้น){/* PHASE-4: D75 */}</p>
    </div>
  );
}
