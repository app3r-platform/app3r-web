"use client";

// ── D-6 Parts Catalog (WeeeT) ─────────────────────────────────────────────────
// ช่างเรียกดู + เพิ่มตะกร้าอะไหล่จากตลาด B2B

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TierPricingRule { minQty: number; maxQty: number; discount: number }

interface D6Listing {
  id: string;
  weeerUserId: string;
  sellerName: string;
  partName: string;
  partNumber?: string;
  manufacturer?: string;
  conditionScore: number;
  sourceType: "new" | "used" | "disassembled";
  unitPrice: number;
  tierPricing: TierPricingRule[];
  qtyAvailable: number;
  warrantyDays: number;
  photos: string[];
  status: "active" | "inactive" | "sold_out" | "deleted";
}

const SOURCE_LABEL: Record<D6Listing["sourceType"], string> = {
  new: "ใหม่", used: "มือสอง", disassembled: "ถอดซาก",
};
const SOURCE_COLOR: Record<D6Listing["sourceType"], string> = {
  new: "text-green-400", used: "text-yellow-400", disassembled: "text-orange-400",
};

const MOCK_LISTINGS: D6Listing[] = [
  { id: "LST-001", weeerUserId: "usr-w-s002", sellerName: "ช่างไฟฟ้า XYZ", partName: "แผงวงจร PCB แอร์ Mitsubishi", partNumber: "PCB-MSZ-001", manufacturer: "Mitsubishi", conditionScore: 7, sourceType: "used", unitPrice: 1200, tierPricing: [{ minQty: 3, maxQty: 10, discount: 0.08 }], qtyAvailable: 3, warrantyDays: 14, photos: ["https://picsum.photos/400/300?seed=LST001"], status: "active" },
  { id: "LST-002", weeerUserId: "usr-w-s003", sellerName: "อะไหล่เครื่องใช้ไฟฟ้า ดี", partName: "เซ็นเซอร์อุณหภูมิ NTC 10K", partNumber: "NTC-10K", manufacturer: "Generic", conditionScore: 9, sourceType: "new", unitPrice: 150, tierPricing: [{ minQty: 6, maxQty: 50, discount: 0.12 }], qtyAvailable: 20, warrantyDays: 30, photos: ["https://picsum.photos/400/300?seed=LST002"], status: "active" },
  { id: "LST-003", weeerUserId: "usr-w-s006", sellerName: "เทคนิค เครื่องเย็น PRO", partName: "มอเตอร์พัดลม Indoor 25W", partNumber: "FAN-25W", manufacturer: "Midea", conditionScore: 10, sourceType: "new", unitPrice: 450, tierPricing: [], qtyAvailable: 6, warrantyDays: 90, photos: ["https://picsum.photos/400/300?seed=LST003"], status: "active" },
  { id: "LST-004", weeerUserId: "usr-w-s005", sellerName: "อะไหล่ราคาถูก เชียงใหม่", partName: "น้ำยาแอร์ R32 กระป๋อง 1kg", partNumber: "R32-1KG", manufacturer: "Honeywell", conditionScore: 10, sourceType: "new", unitPrice: 550, tierPricing: [{ minQty: 2, maxQty: 5, discount: 0.05 }, { minQty: 6, maxQty: 50, discount: 0.10 }], qtyAvailable: 12, warrantyDays: 7, photos: ["https://picsum.photos/400/300?seed=LST004"], status: "active" },
  { id: "LST-005", weeerUserId: "usr-w-s001", sellerName: "ร้านซ่อมแอร์ ABC", partName: "Capacitor 450V 35uF", partNumber: "CAP-450-35", manufacturer: "Epcos", conditionScore: 10, sourceType: "new", unitPrice: 220, tierPricing: [], qtyAvailable: 15, warrantyDays: 30, photos: ["https://picsum.photos/400/300?seed=LST005"], status: "active" },
  { id: "LST-006", weeerUserId: "usr-w-s004", sellerName: "ซ่อมแอร์ นครปฐม", partName: "วาล์ว 4 ทาง (4-Way Valve)", partNumber: "4WAY-R32", manufacturer: "Fujiang", conditionScore: 8, sourceType: "new", unitPrice: 1100, tierPricing: [], qtyAvailable: 3, warrantyDays: 30, photos: ["https://picsum.photos/400/300?seed=LST006"], status: "active" },
];

function getTierMinDiscount(tier: TierPricingRule[]): number {
  if (tier.length === 0) return 0;
  return Math.min(...tier.map((t) => t.discount));
}

export default function WeeeTCatalogPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    try {
      const cart = JSON.parse(localStorage.getItem("weeet_d6_cart") ?? "[]") as unknown[];
      setCartCount(cart.length);
    } catch { /* ignore */ }
  }, []);

  const filtered = MOCK_LISTINGS.filter((l) => {
    if (l.status !== "active") return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return l.partName.toLowerCase().includes(q) ||
      (l.partNumber?.toLowerCase().includes(q) ?? false) ||
      (l.manufacturer?.toLowerCase().includes(q) ?? false);
  });

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">ตลาดอะไหล่ B2B</h1>
          <p className="text-xs text-gray-400 mt-0.5">ซื้ออะไหล่จากร้านซ่อมอื่น</p>
        </div>
        <button
          onClick={() => router.push("/parts/cart")}
          className="relative px-3 py-2 bg-weeet-primary/20 border border-weeet-primary/40 rounded-xl text-weeet-primary text-sm"
        >
          🛒
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
        <input
          type="text"
          placeholder="ค้นหาชื่อ / Part No. / ยี่ห้อ"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-weeet-primary"
        />
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400">{filtered.length} รายการ</p>

      {/* Listings */}
      <div className="space-y-3">
        {filtered.map((l) => {
          const minDisc = getTierMinDiscount(l.tierPricing);
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => router.push(`/parts/catalog/${l.id}`)}
              className="w-full text-left bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2 hover:border-weeet-primary/50 transition-colors"
            >
              <div className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {l.photos[0] && <img src={l.photos[0]} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-white text-sm leading-tight">{l.partName}</p>
                    <p className="text-sm font-bold text-weeet-primary flex-shrink-0">฿{l.unitPrice.toLocaleString()}</p>
                  </div>
                  {l.partNumber && <p className="text-xs text-gray-400">{l.partNumber}</p>}
                  <p className="text-xs text-gray-500 mt-0.5">🏪 {l.sellerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs ${SOURCE_COLOR[l.sourceType]}`}>{SOURCE_LABEL[l.sourceType]}</span>
                <span className="text-xs text-gray-500">คะแนน {l.conditionScore}/10</span>
                <span className={`text-xs ${l.qtyAvailable > 0 ? "text-green-400" : "text-red-400"}`}>
                  สต็อก {l.qtyAvailable}
                </span>
                <span className="text-xs text-gray-500">ประกัน {l.warrantyDays}วัน</span>
                {minDisc > 0 && (
                  <span className="text-xs bg-green-900/60 text-green-400 px-1.5 py-0.5 rounded">
                    ซื้อเพิ่ม ลด {(minDisc * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">ไม่พบอะไหล่ที่ค้นหา</div>
      )}
    </div>
  );
}
