"use client";

// ── Parts Marketplace Detail — Phase C-6 + Sub-CMD-8 Wave 3 ──────────────────
// หน้ารายละเอียดอะไหล่ + ปุ่มสั่งซื้อ
// Sub-CMD-8: handleOrder ส่ง POST /api/v1/parts/orders/ (real Backend B2B escrow)
//            fallback → localStorage mock เมื่อ API ไม่พร้อม

import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { PartListing } from "../../_lib/types";
import { PART_LISTINGS_MOCK } from "../../_lib/mock-data";
import { PartDetailHeader } from "../../../../../components/parts/PartDetailHeader";
import { PartImageGallery } from "../../../../../components/parts/PartImageGallery";
import { PlaceOrderModal } from "../../../../../components/parts/PlaceOrderModal";
import { getCurrentShopId, getListings, upsertOrder, updateListingStock, partsSync, usePartsSync } from "../../../../../lib/utils/parts-sync";
import { escrowHold } from "../../../../../lib/utils/parts-escrow";
import { SHOPS_MOCK } from "../../../../../lib/mock-data/shops";
import type { PartOrder, DeliveryMethod } from "../../_lib/types";
// Sub-CMD-8: typed adapter สำหรับ real Backend B2B orders API
import { createPartsOrder } from "../../../../../lib/parts-api";

export default function MarketplaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [listing, setListing] = useState<PartListing | null>(null);
  const [shopId, setShopId] = useState("S001");
  const [showModal, setShowModal] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  // P10: notify-when-back state (mock)
  const [notifySet, setNotifySet] = useState(false);

  useEffect(() => {
    setShopId(getCurrentShopId());
    const stored = getListings();
    const found = stored.find((l) => l.id === id) ?? PART_LISTINGS_MOCK.find((l) => l.id === id);
    setListing(found ?? null);
  }, [id]);

  usePartsSync((e) => {
    if (e.type === "shop_switched") setShopId(e.shopId);
    if (e.type === "listing_updated" || e.type === "order_placed") {
      const stored = getListings();
      const found = stored.find((l) => l.id === id);
      if (found) setListing(found);
    }
  });

  // Sub-CMD-8: ส่ง order ผ่าน real Backend API (fallback → localStorage mock)
  const handleOrder = (qty: number, delivery: DeliveryMethod) => {
    if (!listing || ordering) return;
    setOrdering(true);
    setOrderError(null);

    // Try real Backend B2B orders API ก่อน
    createPartsOrder({
      partId: listing.id,
      quantity: qty,
      idempotencyKey: `${listing.id}-${shopId}-${Date.now()}`,
    })
      .then(() => {
        // Backend order created — update UI
        const updated = { ...listing, stock: listing.stock - qty };
        setListing(updated);
        setShowModal(false);
        setOrdered(true);
        partsSync.emit({ type: "order_placed", orderId: `api-${Date.now()}`, partId: listing.id, buyerShopId: shopId });
      })
      .catch(() => {
        // Fallback to localStorage mock (Backend ยังไม่ deploy / dev mode)
        const shop = SHOPS_MOCK.find((s) => s.id === shopId);
        if (!shop) { setOrderError("ไม่พบข้อมูลร้านค้า"); setOrdering(false); return; }

        const total = qty * listing.pricePoints;
        const fee = Math.round(total * 0.03);
        const orderId = `O${Date.now()}`;

        const order: PartOrder = {
          id: orderId,
          partId: listing.id,
          partName: listing.name,
          sellerShopId: listing.shopId,
          sellerShopName: listing.shopName ?? "",
          buyerShopId: shopId,
          buyerShopName: shop.name,
          quantity: qty,
          pricePoints: listing.pricePoints,
          totalPoints: total,
          platformFee: fee,
          netToSeller: total - fee,
          deliveryMethod: delivery,
          stage: "ordered",
          orderedAt: new Date().toISOString(),
        };

        upsertOrder(order);
        escrowHold(orderId, shopId, total);
        updateListingStock(listing.id, -qty);
        partsSync.emit({ type: "order_placed", orderId, partId: listing.id, buyerShopId: shopId });

        const updated = { ...listing, stock: listing.stock - qty };
        setListing(updated);
        setShowModal(false);
        setOrdered(true);
      })
      .finally(() => setOrdering(false));
  };

  if (!listing) {
    return <div className="flex items-center justify-center h-40 text-gray-400">กำลังโหลด…</div>;
  }

  const isOwn = listing.shopId === shopId;
  const shop = SHOPS_MOCK.find((s) => s.id === shopId);
  const balance = shop?.pointsBalance ?? 0;

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link href="/parts/marketplace" className="text-sm text-gray-400 hover:text-gray-600">‹ กลับตลาด</Link>

      {/* Gallery (คลังรูปภาพ) */}
      <PartImageGallery images={listing.images} name={listing.name} />

      {/* Header */}
      <PartDetailHeader listing={listing} isOwn={isOwn} />

      {/* คะแนนของร้าน */}
      <div className="flex justify-between text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
        <span>คะแนนของร้านคุณ</span>
        <span className="font-medium text-gray-700">{balance.toLocaleString()} pts</span>
      </div>

      {/* แจ้งเตือนสั่งซื้อสำเร็จ */}
      {ordered && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <span>✅</span>
          <div>
            <p className="text-sm font-medium text-green-700">สั่งซื้อสำเร็จ!</p>
            <Link href="/parts/orders" className="text-xs text-green-600 hover:underline">ดูคำสั่งซื้อ B2B →</Link>
          </div>
        </div>
      )}

      {/* P11: Transaction / escrow error */}
      {orderError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-lg shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-red-700">ไม่สามารถดำเนินการได้</p>
              <p className="text-xs text-red-600 mt-0.5">{orderError}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg px-3 py-2 text-xs text-gray-500 border border-gray-100">
            💡 คะแนน escrow ยังไม่ถูกหัก — จะดำเนินการก็ต่อเมื่อการสั่งซื้อสำเร็จเท่านั้น
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setOrderError(null); setShowModal(true); }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-xl transition-colors"
            >
              🔄 ลองใหม่อีกครั้ง
            </button>
            <a
              href="mailto:support@app3r.co"
              className="flex-1 text-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium py-2 rounded-xl transition-colors"
            >
              ติดต่อ Support
            </a>
          </div>
        </div>
      )}

      {/* P10: Stock = 0 — rich "หมดแล้ว" UI */}
      {!isOwn && !ordered && listing.stock === 0 && (
        <div className="space-y-2">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col items-center gap-2 text-center">
            <span className="text-4xl">📦</span>
            <p className="font-semibold text-gray-700">อะไหล่นี้หมดสต็อกแล้ว</p>
            <p className="text-xs text-gray-400">ผู้ขายยังไม่ได้เติมสินค้า — ลองกลับมาใหม่ภายหลัง</p>
          </div>
          <Link
            href="/parts/marketplace"
            className="flex items-center justify-center gap-1.5 w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition-colors"
          >
            ‹ กลับค้นหาอะไหล่อื่น
          </Link>
          <button
            onClick={() => setNotifySet(true)}
            disabled={notifySet}
            className={`w-full font-medium py-2.5 rounded-xl text-sm transition-colors ${
              notifySet
                ? "bg-green-50 border border-green-200 text-green-700 cursor-default"
                : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-600"
            }`}
          >
            {notifySet ? "🔔 ตั้งการแจ้งเตือนแล้ว" : "🔔 แจ้งเตือนเมื่อมีสินค้า"}
          </button>
        </div>
      )}

      {/* ปุ่มซื้อ (เฉพาะ stock > 0) */}
      {!isOwn && !ordered && listing.stock > 0 && (
        <button
          onClick={() => setShowModal(true)}
          disabled={ordering}
          className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {ordering ? "กำลังสั่งซื้อ…" : `🛒 สั่งซื้อ — ${listing.pricePoints.toLocaleString()} pts/ชิ้น`}
        </button>
      )}

      {isOwn && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
          🏪 นี่คือรายการของร้านคุณ — ไม่สามารถซื้อจากตัวเองได้
        </div>
      )}

      {/* Modal สั่งซื้อ */}
      {showModal && (
        <PlaceOrderModal
          listing={listing}
          buyerBalance={balance}
          onConfirm={handleOrder}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
