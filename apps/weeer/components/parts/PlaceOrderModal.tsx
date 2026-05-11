"use client";

import { useState } from "react";
import type { PartListing, DeliveryMethod } from "../../app/(app)/parts/_lib/types";
import { DELIVERY_LABEL } from "../../app/(app)/parts/_lib/types";
import { calcFee, hasEnoughBalance } from "../../lib/utils/parts-escrow";
import { FeeBreakdown } from "./FeeBreakdown";

interface PlaceOrderModalProps {
  listing: PartListing;
  buyerBalance: number;
  onConfirm: (qty: number, delivery: DeliveryMethod) => void;
  onClose: () => void;
}

export function PlaceOrderModal({ listing, buyerBalance, onConfirm, onClose }: PlaceOrderModalProps) {
  const [qty, setQty] = useState(1);
  const [delivery, setDelivery] = useState<DeliveryMethod>("courier");
  const [loading, setLoading] = useState(false);

  const total = qty * listing.pricePoints;
  const enough = hasEnoughBalance(buyerBalance, total);
  const maxQty = Math.min(listing.stock, 99);

  const handleConfirm = async () => {
    if (!enough || qty < 1 || qty > maxQty) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    onConfirm(qty, delivery);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">สั่งซื้ออะไหล่</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <p className="text-sm font-medium text-gray-700 bg-gray-50 rounded-xl px-3 py-2">{listing.name}</p>

        {/* จำนวน */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">จำนวน (สูงสุด {maxQty} ชิ้น)</label>
          <div className="flex items-center gap-3">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 bg-gray-100 rounded-xl text-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center">−</button>
            <span className="text-lg font-bold text-gray-800 min-w-[2rem] text-center">{qty}</span>
            <button onClick={() => setQty(Math.min(maxQty, qty + 1))} className="w-9 h-9 bg-gray-100 rounded-xl text-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center">+</button>
          </div>
        </div>

        {/* รูปแบบจัดส่ง */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">รูปแบบจัดส่ง</label>
          <div className="flex gap-2">
            {(["courier", "self_pickup"] as DeliveryMethod[]).map((d) => (
              <button key={d} onClick={() => setDelivery(d)} className={`flex-1 text-sm py-2 rounded-xl border font-medium transition-colors ${delivery === d ? "bg-green-700 text-white border-green-700" : "bg-white border-gray-200 text-gray-600 hover:border-green-300"}`}>
                {d === "courier" ? "📦" : "🏪"} {DELIVERY_LABEL[d]}
              </button>
            ))}
          </div>
        </div>

        {/* สรุปค่าใช้จ่าย */}
        <FeeBreakdown totalPoints={total} quantity={qty} pricePerUnit={listing.pricePoints} />

        {/* ยอดคงเหลือ */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>คะแนนของคุณ</span>
          <span className={enough ? "text-green-700 font-medium" : "text-red-600 font-medium"}>
            {buyerBalance.toLocaleString()} pts {!enough && "⚠️ ไม่พอ"}
          </span>
        </div>

        <button
          onClick={handleConfirm}
          disabled={!enough || qty < 1 || loading}
          className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? "กำลังสั่งซื้อ…" : `ยืนยันสั่งซื้อ ${total.toLocaleString()} pts`}
        </button>
      </div>
    </div>
  );
}
