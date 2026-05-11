"use client";

// ── ShopIdSwitcher — Phase C-6 ────────────────────────────────────────────────
// dropdown สลับร้าน (เฉพาะ demo) — วางไว้ใน parts/layout.tsx เท่านั้น
// persist ใน localStorage key: app3r-parts-shop-id

import { useEffect, useState } from "react";
import { SHOPS_MOCK } from "../lib/mock-data/shops";
import { getCurrentShopId, setCurrentShopId } from "../lib/utils/parts-sync";

interface ShopIdSwitcherProps {
  /** callback เมื่อร้านเปลี่ยน */
  onShopChange?: (shopId: string) => void;
  /** disable ระหว่าง modal เปิดอยู่ (ป้องกัน race condition) */
  disabled?: boolean;
}

export function ShopIdSwitcher({ onShopChange, disabled = false }: ShopIdSwitcherProps) {
  const [shopId, setShopId] = useState<string>("S001");

  useEffect(() => {
    setShopId(getCurrentShopId());
  }, []);

  const currentShop = SHOPS_MOCK.find((s) => s.id === shopId);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setShopId(id);
    setCurrentShopId(id);
    onShopChange?.(id);
  };

  return (
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
      <span className="text-sm">🏪</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 leading-none mb-0.5">ร้านปัจจุบัน (demo)</p>
        <select
          value={shopId}
          onChange={handleChange}
          disabled={disabled}
          className="text-sm font-semibold text-green-800 bg-transparent border-none outline-none w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {SHOPS_MOCK.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
        </select>
      </div>
      {currentShop && (
        <div className="shrink-0 text-right">
          <p className="text-xs text-green-700 font-medium">{currentShop.pointsBalance.toLocaleString()} pts</p>
          <p className="text-xs text-gray-400">{currentShop.address}</p>
        </div>
      )}
      {disabled && (
        <span className="text-xs text-orange-500 shrink-0">🔒 ล็อก</span>
      )}
    </div>
  );
}
