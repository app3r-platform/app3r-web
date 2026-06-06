"use client";

// ── D-6 Parts Cart (WeeeR) ────────────────────────────────────────────────────
// ตะกร้าสินค้า B2B — จัดกลุ่มตาม seller, tier discount, expire 24h
// ปุ่ม Checkout → /parts/checkout?seller=<sellerUserId>

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MockAnnoOrigin, MockAnnoNav } from "@/components/MockAnno";
import type { D6CartItem, D6CartGroup } from "../_lib/d6-types";
import {
  getCartItems, saveCartItems, groupCartByShop,
  getTierDiscount, getDiscountedPrice,
} from "../_lib/d6-types";

function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining("หมดอายุ"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m`);
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const isExpired = new Date(expiresAt).getTime() <= Date.now();
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${isExpired ? "bg-red-100 text-red-600" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
      ⏱ {remaining}
    </span>
  );
}

function DiscountBadge({ tierPricing, qty }: { tierPricing: Parameters<typeof getTierDiscount>[0]; qty: number }) {
  const discount = getTierDiscount(tierPricing, qty);
  if (discount <= 0) return null;
  return (
    <span className="text-xs bg-[#FFE0D6] text-[#D63B12] px-2 py-0.5 rounded-full font-medium">
      -{(discount * 100).toFixed(0)}% ส่วนลด
    </span>
  );
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<D6CartItem[]>([]);
  const [groups, setGroups] = useState<D6CartGroup[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);

  const reload = () => {
    const all = getCartItems();
    const valid = all.filter((i) => new Date(i.expiresAt).getTime() > Date.now());
    if (valid.length !== all.length) saveCartItems(valid);
    setItems(valid);
    setGroups(groupCartByShop(valid));
  };

  useEffect(() => { reload(); }, []);

  const updateQty = (id: string, delta: number) => {
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      const newQty = Math.max(1, Math.min(50, item.qty + delta));
      return { ...item, qty: newQty };
    });
    saveCartItems(updated);
    setItems(updated);
    setGroups(groupCartByShop(updated));
  };

  const removeItem = (id: string) => {
    setRemoving(id);
    setTimeout(() => {
      const updated = items.filter((i) => i.id !== id);
      saveCartItems(updated);
      setItems(updated);
      setGroups(groupCartByShop(updated));
      setRemoving(null);
    }, 300);
  };

  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const totalBaht = groups.reduce((s, g) => s + g.subtotal, 0);

  if (items.length === 0) {
    return (
      <div className="px-4 pt-6 pb-4 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            ← กลับ
          </button>
          <h1 className="text-lg font-bold text-gray-800">ตะกร้าสินค้า</h1>
        </div>
        <div className="text-center py-16 space-y-3">
          <p className="text-5xl">🛒</p>
          <p className="text-gray-500 font-medium">ตะกร้าว่างเปล่า</p>
          <p className="text-sm text-gray-400">เพิ่มสินค้าจากตลาด B2B ก่อน</p>
          <button
            onClick={() => router.push("/parts/marketplace")}
            className="mt-2 px-4 py-2 bg-[#FF663A] text-white rounded-xl text-sm font-medium hover:bg-[#F04E20] transition-colors"
          >
            ไปตลาด B2B
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-24 space-y-4">
      <MockAnnoOrigin from="R-54" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">ตะกร้าสินค้า</h1>
            <p className="text-xs text-gray-500">{totalItems} ชิ้น · {groups.length} ร้าน</p>
          </div>
        </div>
        <span className="text-sm font-bold text-[#D63B12]">฿{totalBaht.toLocaleString("th", { minimumFractionDigits: 2 })}</span>
      </div>

      {/* Groups */}
      {groups.map((group) => {
        const groupTotal = group.subtotal;
        return (
          <div key={group.sellerUserId} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Seller header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="font-medium text-gray-700 text-sm">🏪 {group.sellerName}</span>
              <span className="text-xs text-gray-500">฿{groupTotal.toLocaleString("th", { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Items */}
            {group.items.map((item) => {
              const discounted = getDiscountedPrice(item.listing.unitPrice, item.listing.tierPricing, item.qty);
              const lineTotal = discounted * item.qty;
              const isRemoving = removing === item.id;

              return (
                <div
                  key={item.id}
                  className={`px-4 py-3 border-b border-gray-50 last:border-0 transition-opacity ${isRemoving ? "opacity-30" : "opacity-100"}`}
                >
                  <div className="flex gap-3">
                    {/* Photo */}
                    {item.listing.photos[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.listing.photos[0]}
                        alt={item.listing.partName}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium text-gray-800 leading-tight">{item.listing.partName}</p>
                      {item.listing.partNumber && (
                        <p className="text-xs text-gray-400">{item.listing.partNumber}</p>
                      )}

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1">
                        <ExpiryBadge expiresAt={item.expiresAt} />
                        <DiscountBadge tierPricing={item.listing.tierPricing} qty={item.qty} />
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          ประกัน {item.listing.warrantyDays}วัน
                        </span>
                      </div>

                      {/* Price + qty stepper */}
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          {getTierDiscount(item.listing.tierPricing, item.qty) > 0 && (
                            <p className="text-xs text-gray-400 line-through">฿{item.listing.unitPrice.toLocaleString()}</p>
                          )}
                          <p className="text-sm font-bold text-[#D63B12]">฿{lineTotal.toLocaleString("th", { minimumFractionDigits: 2 })}</p>
                          <p className="text-xs text-gray-400">@฿{discounted.toFixed(2)}/ชิ้น</p>
                        </div>

                        {/* Qty stepper */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            disabled={item.qty <= 1}
                            className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center disabled:opacity-40 hover:bg-gray-200 transition-colors"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            disabled={item.qty >= Math.min(50, item.listing.qtyAvailable)}
                            className="w-7 h-7 rounded-full bg-[#FFE0D6] text-[#D63B12] font-bold text-lg flex items-center justify-center disabled:opacity-40 hover:bg-[#FFD0BF] transition-colors"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="ml-1 text-red-400 hover:text-red-600 text-sm transition-colors"
                            title="ลบ"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Checkout button per group */}
            <div className="px-4 py-3 bg-gray-50">
              <MockAnnoNav to="R-55" label={`สั่งซื้อจาก ${group.sellerName}`} style={{ display: "contents" }}>
                <button
                  onClick={() => router.push(`/parts/checkout?seller=${group.sellerUserId}`)}
                  className="w-full py-2.5 bg-[#FF663A] text-white rounded-xl text-sm font-medium hover:bg-[#F04E20] transition-colors"
                >
                  สั่งซื้อจาก {group.sellerName} — ฿{groupTotal.toLocaleString("th", { minimumFractionDigits: 2 })}
                </button>
              </MockAnnoNav>
            </div>
          </div>
        );
      })}

      {/* Footer summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between shadow-lg">
        <div>
          <p className="text-xs text-gray-500">{totalItems} ชิ้น · {groups.length} ร้าน</p>
          <p className="font-bold text-[#D63B12]">฿{totalBaht.toLocaleString("th", { minimumFractionDigits: 2 })}</p>
        </div>
        <button
          onClick={() => router.push("/parts/checkout")}
          className="px-6 py-2.5 bg-[#FF663A] text-white rounded-xl text-sm font-medium hover:bg-[#F04E20] transition-colors"
        >
          สั่งซื้อทั้งหมด
        </button>
      </div>
    </div>
  );
}
