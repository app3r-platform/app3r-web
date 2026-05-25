"use client";

// ── D-6 Parts Listing Detail (WeeeT) ─────────────────────────────────────────
// รายละเอียดอะไหล่ + เพิ่มตะกร้า

import { use, useState } from "react";
import { useRouter } from "next/navigation";

interface TierPricingRule { minQty: number; maxQty: number; discount: number }

// Reuse the same mock data (inline for isolation)
const MOCK_LISTINGS = [
  { id: "LST-001", weeerUserId: "usr-w-s002", sellerName: "ช่างไฟฟ้า XYZ", partName: "แผงวงจร PCB แอร์ Mitsubishi", partNumber: "PCB-MSZ-001", manufacturer: "Mitsubishi", conditionScore: 7, sourceType: "used" as const, unitPrice: 1200, tierPricing: [{ minQty: 3, maxQty: 10, discount: 0.08 }] as TierPricingRule[], qtyAvailable: 3, warrantyDays: 14, photos: ["https://picsum.photos/400/300?seed=LST001","https://picsum.photos/400/300?seed=LST001b"], status: "active" as const },
  { id: "LST-002", weeerUserId: "usr-w-s003", sellerName: "อะไหล่เครื่องใช้ไฟฟ้า ดี", partName: "เซ็นเซอร์อุณหภูมิ NTC 10K", partNumber: "NTC-10K", manufacturer: "Generic", conditionScore: 9, sourceType: "new" as const, unitPrice: 150, tierPricing: [{ minQty: 6, maxQty: 50, discount: 0.12 }] as TierPricingRule[], qtyAvailable: 20, warrantyDays: 30, photos: ["https://picsum.photos/400/300?seed=LST002"], status: "active" as const },
  { id: "LST-003", weeerUserId: "usr-w-s006", sellerName: "เทคนิค เครื่องเย็น PRO", partName: "มอเตอร์พัดลม Indoor 25W", partNumber: "FAN-25W", manufacturer: "Midea", conditionScore: 10, sourceType: "new" as const, unitPrice: 450, tierPricing: [] as TierPricingRule[], qtyAvailable: 6, warrantyDays: 90, photos: ["https://picsum.photos/400/300?seed=LST003"], status: "active" as const },
  { id: "LST-004", weeerUserId: "usr-w-s005", sellerName: "อะไหล่ราคาถูก เชียงใหม่", partName: "น้ำยาแอร์ R32 กระป๋อง 1kg", partNumber: "R32-1KG", manufacturer: "Honeywell", conditionScore: 10, sourceType: "new" as const, unitPrice: 550, tierPricing: [{ minQty: 2, maxQty: 5, discount: 0.05 }, { minQty: 6, maxQty: 50, discount: 0.10 }] as TierPricingRule[], qtyAvailable: 12, warrantyDays: 7, photos: ["https://picsum.photos/400/300?seed=LST004"], status: "active" as const },
  { id: "LST-005", weeerUserId: "usr-w-s001", sellerName: "ร้านซ่อมแอร์ ABC", partName: "Capacitor 450V 35uF", partNumber: "CAP-450-35", manufacturer: "Epcos", conditionScore: 10, sourceType: "new" as const, unitPrice: 220, tierPricing: [] as TierPricingRule[], qtyAvailable: 15, warrantyDays: 30, photos: ["https://picsum.photos/400/300?seed=LST005"], status: "active" as const },
  { id: "LST-006", weeerUserId: "usr-w-s004", sellerName: "ซ่อมแอร์ นครปฐม", partName: "วาล์ว 4 ทาง (4-Way Valve)", partNumber: "4WAY-R32", manufacturer: "Fujiang", conditionScore: 8, sourceType: "new" as const, unitPrice: 1100, tierPricing: [] as TierPricingRule[], qtyAvailable: 3, warrantyDays: 30, photos: ["https://picsum.photos/400/300?seed=LST006"], status: "active" as const },
];

function getTierDiscount(tier: TierPricingRule[], qty: number): number {
  for (const t of tier) {
    if (qty >= t.minQty && qty <= t.maxQty) return t.discount;
  }
  if (qty >= 6) return 0.10;
  if (qty >= 2) return 0.05;
  return 0;
}

export default function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const listing = MOCK_LISTINGS.find((l) => l.id === id);

  const [qty, setQty] = useState(1);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  if (!listing) {
    return (
      <div className="px-4 pt-10 text-center text-gray-400">
        <p>ไม่พบสินค้า #{id}</p>
        <button onClick={() => router.back()} className="mt-3 text-weeet-primary text-sm">← กลับ</button>
      </div>
    );
  }

  const discount = getTierDiscount(listing.tierPricing, qty);
  const discountedPrice = listing.unitPrice * (1 - discount);
  const lineTotal = discountedPrice * qty;

  const handleAddToCart = () => {
    const expiresAt = new Date(Date.now() + 24 * 3600000).toISOString();
    const cartItem = {
      id: `CART-${Date.now()}`,
      listingId: listing.id,
      listing: {
        id: listing.id,
        weeerUserId: listing.weeerUserId,
        sellerName: listing.sellerName,
        partName: listing.partName,
        partNumber: listing.partNumber,
        unitPrice: listing.unitPrice,
        tierPricing: listing.tierPricing,
        qtyAvailable: listing.qtyAvailable,
        warrantyDays: listing.warrantyDays,
        photos: listing.photos,
      },
      qty,
      expiresAt,
    };

    const stored = JSON.parse(localStorage.getItem("weeet_d6_cart") ?? "[]") as typeof cartItem[];
    // Upsert: if same listing exists, update qty
    const existIdx = stored.findIndex((i) => i.listingId === listing.id);
    if (existIdx >= 0) {
      stored[existIdx]!.qty = Math.min(50, (stored[existIdx]!.qty) + qty);
      stored[existIdx]!.expiresAt = expiresAt;
    } else {
      stored.push(cartItem);
    }
    localStorage.setItem("weeet_d6_cart", JSON.stringify(stored));
    setAddedToCart(true);
  };

  return (
    <div className="pb-4 space-y-4">
      {/* Back */}
      <div className="px-4 pt-4">
        <button onClick={() => router.back()} className="text-gray-400 text-sm">← กลับ</button>
      </div>

      {/* Photos */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listing.photos[photoIdx] ?? listing.photos[0]}
          alt={listing.partName}
          className="w-full h-56 object-cover"
        />
        {listing.photos.length > 1 && (
          <div className="absolute bottom-2 right-3 flex gap-1">
            {listing.photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setPhotoIdx(i)}
                className={`w-2 h-2 rounded-full ${i === photoIdx ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 space-y-3">
        <div>
          <h1 className="text-lg font-bold text-white">{listing.partName}</h1>
          {listing.partNumber && <p className="text-xs text-gray-400 mt-0.5">{listing.partNumber}</p>}
          <p className="text-sm text-gray-400 mt-1">🏪 {listing.sellerName}</p>
        </div>

        {/* Details */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 grid grid-cols-2 gap-y-2 text-xs">
          <div><p className="text-gray-400">ยี่ห้อ</p><p className="text-white font-medium">{listing.manufacturer ?? "-"}</p></div>
          <div><p className="text-gray-400">สภาพ</p><p className="text-white font-medium">{listing.conditionScore}/10</p></div>
          <div><p className="text-gray-400">ประเภท</p><p className="text-white font-medium">{listing.sourceType}</p></div>
          <div><p className="text-gray-400">ประกัน</p><p className="text-white font-medium">{listing.warrantyDays} วัน</p></div>
          <div><p className="text-gray-400">สต็อก</p><p className={`font-medium ${listing.qtyAvailable > 0 ? "text-green-400" : "text-red-400"}`}>{listing.qtyAvailable} ชิ้น</p></div>
        </div>

        {/* Tier pricing */}
        {listing.tierPricing.length > 0 && (
          <div className="bg-green-900/30 border border-green-800/50 rounded-xl p-3 space-y-1.5">
            <p className="text-xs font-medium text-green-400">💰 ส่วนลดตามจำนวน</p>
            {listing.tierPricing.map((t, i) => (
              <p key={i} className="text-xs text-gray-300">
                {t.minQty}-{t.maxQty} ชิ้น → ลด <span className="text-green-400 font-medium">{(t.discount * 100).toFixed(0)}%</span>
              </p>
            ))}
          </div>
        )}

        {/* Qty + price */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-300">จำนวน</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}
                className="w-8 h-8 rounded-full bg-gray-700 text-white disabled:opacity-40 text-lg flex items-center justify-center">−</button>
              <span className="text-white font-medium w-6 text-center">{qty}</span>
              <button onClick={() => setQty(Math.min(50, Math.min(listing.qtyAvailable, qty + 1)))} disabled={qty >= listing.qtyAvailable}
                className="w-8 h-8 rounded-full bg-weeet-primary/20 text-weeet-primary disabled:opacity-40 text-lg flex items-center justify-center">+</button>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              {discount > 0 && <p className="text-xs text-gray-500 line-through">฿{listing.unitPrice.toLocaleString()}/ชิ้น</p>}
              <p className="text-sm text-gray-300">
                ฿{discountedPrice.toFixed(2)}/ชิ้น
                {discount > 0 && <span className="text-green-400 ml-1">(-{(discount * 100).toFixed(0)}%)</span>}
              </p>
            </div>
            <p className="text-xl font-bold text-weeet-primary">฿{lineTotal.toFixed(2)}</p>
          </div>
        </div>

        {/* CTA */}
        {addedToCart ? (
          <div className="space-y-2">
            <div className="w-full py-3 bg-green-900/50 border border-green-700 text-green-400 rounded-xl text-sm font-medium text-center">
              ✅ เพิ่มลงตะกร้าแล้ว
            </div>
            <button
              onClick={() => router.push("/parts/cart")}
              className="w-full py-2.5 bg-weeet-primary text-white rounded-xl text-sm font-medium"
            >
              ดูตะกร้า →
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={listing.qtyAvailable === 0}
            className="w-full py-3 bg-weeet-primary text-white rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            🛒 เพิ่มลงตะกร้า
          </button>
        )}
      </div>
    </div>
  );
}
