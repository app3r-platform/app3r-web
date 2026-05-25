"use client";

// ── D-6 Parts Checkout (WeeeT) ─────────────────────────────────────────────────
// Multi-item checkout สำหรับ WeeeT ช่าง

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface TierPricingRule { minQty: number; maxQty: number; discount: number }
interface CartItem {
  id: string;
  listingId: string;
  listing: {
    id: string; weeerUserId: string; sellerName: string; partName: string;
    unitPrice: number; tierPricing: TierPricingRule[]; warrantyDays: number;
    photos: string[];
  };
  qty: number;
  expiresAt: string;
}

type DeliveryMethod = "pickup" | "local" | "shipping";
const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  pickup: "รับเองที่ร้าน",
  local: "ส่งในพื้นที่",
  shipping: "ขนส่งพัสดุ",
};

function getTierDiscount(tier: TierPricingRule[], qty: number): number {
  for (const t of tier) {
    if (qty >= t.minQty && qty <= t.maxQty) return t.discount;
  }
  if (qty >= 6) return 0.10;
  if (qty >= 2) return 0.05;
  return 0;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sellerFilter = searchParams.get("seller");

  const [items, setItems] = useState<CartItem[]>([]);
  const [delivery, setDelivery] = useState<DeliveryMethod>("pickup");
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    const raw: CartItem[] = JSON.parse(localStorage.getItem("weeet_d6_cart") ?? "[]") as CartItem[];
    const valid = raw.filter((i) => new Date(i.expiresAt).getTime() > Date.now());
    setItems(sellerFilter ? valid.filter((i) => i.listing.weeerUserId === sellerFilter) : valid);
  }, [sellerFilter]);

  const totalThb = items.reduce((s, i) => {
    const disc = getTierDiscount(i.listing.tierPricing, i.qty);
    return s + i.listing.unitPrice * (1 - disc) * i.qty;
  }, 0);

  const handleConfirm = () => {
    setConfirming(true);
    setTimeout(() => {
      // Remove checked-out items
      const raw: CartItem[] = JSON.parse(localStorage.getItem("weeet_d6_cart") ?? "[]") as CartItem[];
      const sellerIds = [...new Set(items.map((i) => i.listing.weeerUserId))];
      const remaining = raw.filter((i) => !sellerIds.includes(i.listing.weeerUserId));
      localStorage.setItem("weeet_d6_cart", JSON.stringify(remaining));

      // Save order IDs (for orders list)
      const existing: string[] = JSON.parse(localStorage.getItem("weeet_part_order_ids") ?? "[]") as string[];
      const newId = `ORD-D6-${Date.now().toString(36).toUpperCase()}`;
      existing.push(newId);
      localStorage.setItem("weeet_part_order_ids", JSON.stringify(existing));

      setDone(newId);
      setConfirming(false);
    }, 900);
  };

  if (done) {
    return (
      <div className="px-4 pt-10 pb-4 text-center space-y-6">
        <div className="text-6xl">✅</div>
        <div>
          <h2 className="text-xl font-bold text-white">สั่งซื้อสำเร็จ!</h2>
          <p className="text-gray-400 text-sm mt-1">ออเดอร์: <span className="font-mono text-weeet-primary">{done}</span></p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push("/parts/orders")}
            className="px-5 py-2.5 bg-weeet-primary text-white rounded-xl text-sm font-medium">
            ดูออเดอร์
          </button>
          <button onClick={() => router.push("/parts/catalog")}
            className="px-5 py-2.5 bg-gray-700 text-gray-300 rounded-xl text-sm font-medium">
            ซื้อต่อ
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-4 pt-10 text-center space-y-4">
        <p className="text-4xl">🛒</p>
        <p className="text-gray-400 text-sm">ไม่มีสินค้าสำหรับ checkout</p>
        <button onClick={() => router.push("/parts/cart")} className="px-4 py-2 bg-weeet-primary text-white rounded-xl text-sm">ดูตะกร้า</button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400">← กลับ</button>
        <h1 className="text-lg font-bold text-white">ยืนยันคำสั่งซื้อ</h1>
      </div>

      {/* Items */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
        {items.map((item, i) => {
          const disc = getTierDiscount(item.listing.tierPricing, item.qty);
          const unitP = item.listing.unitPrice * (1 - disc);
          return (
            <div key={item.id} className={`px-4 py-3 flex gap-3 ${i < items.length - 1 ? "border-b border-gray-700/50" : ""}`}>
              {item.listing.photos[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.listing.photos[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{item.listing.partName}</p>
                <p className="text-xs text-gray-400">
                  {item.qty} × ฿{unitP.toFixed(2)}
                  {disc > 0 && <span className="text-green-400 ml-1">(-{(disc * 100).toFixed(0)}%)</span>}
                </p>
              </div>
              <p className="text-sm font-bold text-weeet-primary">฿{(unitP * item.qty).toFixed(2)}</p>
            </div>
          );
        })}
      </div>

      {/* Delivery */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-medium text-gray-300">วิธีรับสินค้า</p>
        {(["pickup", "local", "shipping"] as DeliveryMethod[]).map((m) => (
          <label key={m} className="flex items-center gap-3 cursor-pointer">
            <input type="radio" name="delivery" value={m} checked={delivery === m}
              onChange={() => setDelivery(m)} className="w-4 h-4 text-weeet-primary" />
            <span className="text-sm text-gray-300">{DELIVERY_LABELS[m]}</span>
          </label>
        ))}
      </div>

      {/* Total + confirm */}
      <div className="bg-gray-800 border border-weeet-primary/40 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">{items.length} รายการ</p>
          <p className="text-xl font-bold text-weeet-primary">฿{totalThb.toFixed(2)}</p>
        </div>
        <button onClick={handleConfirm} disabled={confirming}
          className="px-6 py-3 bg-weeet-primary text-white rounded-xl font-medium text-sm disabled:opacity-60">
          {confirming ? "กำลังสั่งซื้อ..." : "ยืนยันสั่งซื้อ"}
        </button>
      </div>
    </div>
  );
}

export default function WeeeTCheckoutPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-10 text-center text-gray-400 text-sm">กำลังโหลด...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
