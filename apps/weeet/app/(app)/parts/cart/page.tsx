"use client";

// ── D-6 Parts Cart (WeeeT) ─────────────────────────────────────────────────────
// ตะกร้าสินค้า B2B — WeeeT ซื้ออะไหล่จาก WeeeR
// จัดกลุ่มตาม seller, tier discount, expire countdown

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TierPricingRule {
  minQty: number;
  maxQty: number;
  discount: number;
}

interface D6ListingMini {
  id: string;
  weeerUserId: string;
  sellerName: string;
  partName: string;
  partNumber?: string;
  unitPrice: number;
  tierPricing: TierPricingRule[];
  qtyAvailable: number;
  warrantyDays: number;
  photos: string[];
}

interface WeeeTCartItem {
  id: string;
  listingId: string;
  listing: D6ListingMini;
  qty: number;
  expiresAt: string;
}

const CART_KEY = "weeet_d6_cart";

function getTierDiscount(tier: TierPricingRule[], qty: number): number {
  for (const t of tier) {
    if (qty >= t.minQty && qty <= t.maxQty) return t.discount;
  }
  if (qty >= 6) return 0.10;
  if (qty >= 2) return 0.05;
  return 0;
}

function ExpiryLabel({ expiresAt }: { expiresAt: string }) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return <span className="text-xs text-red-400">หมดอายุ</span>;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return <span className="text-xs text-amber-500">⏱ {h}h {m}m</span>;
}

export default function WeeeTCartPage() {
  const router = useRouter();
  const [items, setItems] = useState<WeeeTCartItem[]>([]);

  const reload = () => {
    try {
      const raw: WeeeTCartItem[] = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]") as WeeeTCartItem[];
      const valid = raw.filter((i) => new Date(i.expiresAt).getTime() > Date.now());
      setItems(valid);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => { reload(); }, []);

  const save = (updated: WeeeTCartItem[]) => {
    localStorage.setItem(CART_KEY, JSON.stringify(updated));
    setItems(updated);
  };

  const updateQty = (id: string, delta: number) => {
    save(items.map((i) => {
      if (i.id !== id) return i;
      const newQty = Math.max(1, Math.min(50, i.qty + delta));
      return { ...i, qty: newQty };
    }));
  };

  const remove = (id: string) => save(items.filter((i) => i.id !== id));

  // Group by seller
  const grouped: Record<string, { sellerName: string; items: WeeeTCartItem[]; subtotal: number }> = {};
  for (const item of items) {
    const sid = item.listing.weeerUserId;
    if (!grouped[sid]) grouped[sid] = { sellerName: item.listing.sellerName, items: [], subtotal: 0 };
    const disc = getTierDiscount(item.listing.tierPricing, item.qty);
    const price = item.listing.unitPrice * (1 - disc);
    grouped[sid]!.items.push(item);
    grouped[sid]!.subtotal += price * item.qty;
  }
  const groups = Object.entries(grouped);
  const totalThb = groups.reduce((s, [, g]) => s + g.subtotal, 0);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  if (items.length === 0) {
    return (
      <div className="px-4 pt-6 pb-4 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400">← กลับ</button>
          <h1 className="text-lg font-bold text-white">ตะกร้าสินค้า</h1>
        </div>
        <div className="text-center py-14 space-y-3">
          <p className="text-5xl">🛒</p>
          <p className="text-gray-400 text-sm">ตะกร้าว่างเปล่า</p>
          <button
            onClick={() => router.push("/parts/catalog")}
            className="mt-1 px-4 py-2 bg-weeet-primary text-white rounded-xl text-sm font-medium"
          >
            เลือกซื้ออะไหล่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400">←</button>
          <div>
            <h1 className="text-lg font-bold text-white">ตะกร้าสินค้า</h1>
            <p className="text-xs text-gray-400">{totalQty} ชิ้น · {groups.length} ร้าน</p>
          </div>
        </div>
        <span className="text-sm font-bold text-weeet-primary">฿{totalThb.toFixed(2)}</span>
      </div>

      {groups.map(([sellerId, group]) => (
        <div key={sellerId} className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
          {/* Seller */}
          <div className="px-4 py-2.5 bg-gray-700/50 flex items-center justify-between">
            <span className="text-sm text-gray-300">🏪 {group.sellerName}</span>
            <span className="text-xs text-gray-400">฿{group.subtotal.toFixed(2)}</span>
          </div>

          {/* Items */}
          {group.items.map((item) => {
            const disc = getTierDiscount(item.listing.tierPricing, item.qty);
            const unitP = item.listing.unitPrice * (1 - disc);
            return (
              <div key={item.id} className="px-4 py-3 border-b border-gray-700/50 last:border-0 flex gap-3">
                {item.listing.photos[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.listing.photos[0]} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-white leading-tight">{item.listing.partName}</p>
                  <div className="flex items-center gap-2">
                    <ExpiryLabel expiresAt={item.expiresAt} />
                    {disc > 0 && (
                      <span className="text-xs bg-green-900/60 text-green-400 px-1.5 py-0.5 rounded">
                        -{(disc * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-weeet-primary">฿{(unitP * item.qty).toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.id, -1)} disabled={item.qty <= 1}
                        className="w-6 h-6 rounded-full bg-gray-700 text-gray-300 text-sm flex items-center justify-center disabled:opacity-40">−</button>
                      <span className="text-sm text-white w-5 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} disabled={item.qty >= item.listing.qtyAvailable}
                        className="w-6 h-6 rounded-full bg-weeet-primary/20 text-weeet-primary text-sm flex items-center justify-center disabled:opacity-40">+</button>
                      <button onClick={() => remove(item.id)} className="ml-1 text-red-400 text-sm">🗑</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Checkout per group */}
          <div className="px-4 py-3 bg-gray-700/30">
            <button
              onClick={() => router.push(`/parts/checkout?seller=${sellerId}`)}
              className="w-full py-2.5 bg-weeet-primary text-white rounded-xl text-sm font-medium"
            >
              สั่งซื้อจาก {group.sellerName}
            </button>
          </div>
        </div>
      ))}

      {/* Fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">{totalQty} ชิ้น</p>
          <p className="font-bold text-weeet-primary">฿{totalThb.toFixed(2)}</p>
        </div>
        <button
          onClick={() => router.push("/parts/checkout")}
          className="px-6 py-2.5 bg-weeet-primary text-white rounded-xl text-sm font-medium"
        >
          สั่งซื้อทั้งหมด
        </button>
      </div>
    </div>
  );
}
