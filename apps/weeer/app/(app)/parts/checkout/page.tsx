"use client";

// ── D-6 Parts Checkout (WeeeR) ─────────────────────────────────────────────────
// Multi-item checkout — สร้าง parts_order (is_multi_item=true) + parts_order_items

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { D6CartGroup } from "../_lib/d6-types";
import {
  getCartItems, saveCartItems, groupCartByShop,
  getDiscountedPrice, getTierDiscount,
} from "../_lib/d6-types";

type DeliveryMethod = "pickup" | "local" | "shipping";

const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  pickup:   "รับเองที่ร้าน",
  local:    "ส่งในพื้นที่ (มอเตอร์ไซค์)",
  shipping: "ขนส่งพัสดุ",
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sellerFilter = searchParams.get("seller");

  const [groups, setGroups] = useState<D6CartGroup[]>([]);
  const [delivery, setDelivery] = useState<DeliveryMethod>("pickup");
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<string | null>(null); // orderId on success

  useEffect(() => {
    const all = getCartItems();
    const valid = all.filter((i) => new Date(i.expiresAt).getTime() > Date.now());
    let allGroups = groupCartByShop(valid);
    if (sellerFilter) {
      allGroups = allGroups.filter((g) => g.sellerUserId === sellerFilter);
    }
    setGroups(allGroups);
  }, [sellerFilter]);

  const totalThb = groups.reduce((s, g) => s + g.subtotal, 0);
  const totalItems = groups.reduce((s, g) => s + g.items.reduce((si, i) => si + i.qty, 0), 0);

  const handleConfirm = () => {
    setConfirming(true);
    // Simulate API call — remove checked-out items from cart
    setTimeout(() => {
      const all = getCartItems();
      const sellerIds = groups.map((g) => g.sellerUserId);
      const remaining = all.filter((i) => !sellerIds.includes(i.listing.weeerUserId));
      saveCartItems(remaining);

      const mockOrderId = `ORD-D6-${Date.now().toString(36).toUpperCase()}`;
      setDone(mockOrderId);
      setConfirming(false);
    }, 1000);
  };

  // ── Success screen ───────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="px-4 pt-10 pb-4 text-center space-y-6">
        <div className="text-6xl">✅</div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">สั่งซื้อสำเร็จ!</h2>
          <p className="text-gray-500 text-sm mt-1">หมายเลขออเดอร์: <span className="font-mono font-medium text-green-700">{done}</span></p>
        </div>
        <p className="text-sm text-gray-500">ผู้ขายจะยืนยันออเดอร์และแจ้งกำหนดส่งต่อไป</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push("/parts/my-orders")}
            className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700"
          >
            ดูออเดอร์
          </button>
          <button
            onClick={() => router.push("/parts/marketplace")}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
          >
            ซื้อต่อ
          </button>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="px-4 pt-6 pb-4 text-center space-y-4">
        <p className="text-4xl">🛒</p>
        <p className="text-gray-500">ไม่มีสินค้าสำหรับ checkout</p>
        <button
          onClick={() => router.push("/parts/cart")}
          className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm"
        >
          ดูตะกร้า
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">← กลับ</button>
        <h1 className="text-lg font-bold text-gray-800">ยืนยันคำสั่งซื้อ</h1>
      </div>

      {/* Order summary by group */}
      {groups.map((group) => (
        <div key={group.sellerUserId} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <span className="font-medium text-gray-700 text-sm">🏪 {group.sellerName}</span>
          </div>
          {group.items.map((item) => {
            const disc = getTierDiscount(item.listing.tierPricing, item.qty);
            const unitP = getDiscountedPrice(item.listing.unitPrice, item.listing.tierPricing, item.qty);
            return (
              <div key={item.id} className="px-4 py-3 border-b border-gray-50 last:border-0 flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {item.listing.photos[0] && (
                  <img src={item.listing.photos[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{item.listing.partName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.qty} × ฿{unitP.toFixed(2)}
                    {disc > 0 && <span className="text-green-600 ml-1">(-{(disc * 100).toFixed(0)}%)</span>}
                  </p>
                </div>
                <p className="text-sm font-bold text-green-700">฿{(unitP * item.qty).toFixed(2)}</p>
              </div>
            );
          })}
          <div className="px-4 py-2 bg-gray-50 flex justify-between text-sm">
            <span className="text-gray-500">รวม</span>
            <span className="font-bold text-green-700">฿{group.subtotal.toFixed(2)}</span>
          </div>
        </div>
      ))}

      {/* Delivery method */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">วิธีรับสินค้า</p>
        {(["pickup", "local", "shipping"] as DeliveryMethod[]).map((m) => (
          <label key={m} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="delivery"
              value={m}
              checked={delivery === m}
              onChange={() => setDelivery(m)}
              className="w-4 h-4 text-green-600"
            />
            <span className="text-sm text-gray-700">{DELIVERY_LABELS[m]}</span>
          </label>
        ))}
      </div>

      {/* Note */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
        <p className="text-sm font-medium text-gray-700">หมายเหตุ (ถ้ามี)</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="ระบุรายละเอียดเพิ่มเติม..."
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-green-400 resize-none"
        />
      </div>

      {/* Total + confirm */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{totalItems} ชิ้น · {groups.length} ร้าน</p>
          <p className="text-xl font-bold text-green-700">฿{totalThb.toLocaleString("th", { minimumFractionDigits: 2 })}</p>
        </div>
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-60 transition-colors"
        >
          {confirming ? "กำลังสั่งซื้อ..." : "ยืนยันสั่งซื้อ"}
        </button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-10 text-center text-gray-400 text-sm">กำลังโหลด...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
