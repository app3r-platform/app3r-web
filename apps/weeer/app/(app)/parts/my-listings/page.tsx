"use client";

// ── My Listings — Phase C-6 ───────────────────────────────────────────────────
// มุมผู้ขาย: คลังของฉัน + คำสั่งซื้อที่เข้ามา

import { useEffect, useState } from "react";
import { PART_LISTINGS_MOCK, PART_ORDERS_MOCK } from "../_lib/mock-data";
import type { PartListing, PartOrder } from "../_lib/types";
import { PartCard } from "../../../../components/parts/PartCard";
import { PartListingForm } from "../../../../components/parts/PartListingForm";
import { OrderCard } from "../../../../components/parts/OrderCard";
import { ShipOrderModal } from "../../../../components/parts/ShipOrderModal";
import { CancelOrderConfirm } from "../../../../components/parts/CancelOrderConfirm";
import {
  getCurrentShopId, getListings, saveListings, getOrders, saveOrders,
  upsertListing, upsertOrder, updateListingStock, partsSync, usePartsSync,
} from "../../../../lib/utils/parts-sync";
import { escrowRefund } from "../../../../lib/utils/parts-escrow";
import { SHOPS_MOCK } from "../../../../lib/mock-data/shops";

type TabType = "listings" | "incoming";

export default function MyListingsPage() {
  const [shopId, setShopId] = useState("S001");
  const [listings, setListings] = useState<PartListing[]>([]);
  const [orders, setOrders] = useState<PartOrder[]>([]);
  const [tab, setTab] = useState<TabType>("listings");
  const [showForm, setShowForm] = useState(false);
  const [shipOrder, setShipOrder] = useState<PartOrder | null>(null);
  const [cancelOrder, setCancelOrder] = useState<PartOrder | null>(null);

  const reload = () => {
    const id = getCurrentShopId();
    setShopId(id);
    const stored = getListings();
    setListings((stored.length > 0 ? stored : PART_LISTINGS_MOCK).filter((l) => l.shopId === id));
    const storedOrders = getOrders();
    setOrders((storedOrders.length > 0 ? storedOrders : PART_ORDERS_MOCK).filter((o) => o.sellerShopId === id));
  };

  useEffect(() => {
    const stored = getListings();
    if (stored.length === 0) saveListings(PART_LISTINGS_MOCK);
    const storedOrders = getOrders();
    if (storedOrders.length === 0) saveOrders(PART_ORDERS_MOCK);
    reload();
  }, []);

  usePartsSync((e) => {
    if (e.type === "refresh_parts" || e.type === "shop_switched" || e.type === "order_placed" || e.type === "order_cancelled" || e.type === "listing_updated") reload();
  });

  const shop = SHOPS_MOCK.find((s) => s.id === shopId);

  const handleAddListing = (data: Omit<PartListing, "id" | "createdAt">) => {
    const newListing: PartListing = {
      ...data,
      id: `P${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    upsertListing(newListing);
    partsSync.emit({ type: "listing_updated", partId: newListing.id });
    setShowForm(false);
    reload();
  };

  const handleShip = (tracking: string) => {
    if (!shipOrder) return;
    const updated: PartOrder = { ...shipOrder, stage: "shipped", shippedAt: new Date().toISOString(), ...(tracking ? { trackingNumber: tracking } : {}) };
    upsertOrder(updated);
    partsSync.emit({ type: "order_shipped", orderId: shipOrder.id, trackingNumber: tracking });
    setShipOrder(null);
    reload();
  };

  const handleCancel = () => {
    if (!cancelOrder) return;
    const updated: PartOrder = { ...cancelOrder, stage: "cancelled", cancelledAt: new Date().toISOString() };
    upsertOrder(updated);
    escrowRefund(cancelOrder.id);
    updateListingStock(cancelOrder.partId, cancelOrder.quantity);
    partsSync.emit({ type: "order_cancelled", orderId: cancelOrder.id, partId: cancelOrder.partId });
    setCancelOrder(null);
    reload();
  };

  const handleAction = (action: "ship" | "receive" | "cancel", orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    if (action === "ship")   setShipOrder(order);
    if (action === "cancel") setCancelOrder(order);
  };

  const pendingOrders = orders.filter((o) => o.stage === "ordered");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ขายของฉัน</h1>
          <p className="text-xs text-gray-500 mt-0.5">{shop?.name} · {listings.length} รายการ</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          + ลงขายใหม่
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button onClick={() => setTab("listings")} className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${tab === "listings" ? "bg-white text-green-700 shadow-sm" : "text-gray-500"}`}>
          📦 รายการของฉัน ({listings.length})
        </button>
        <button onClick={() => setTab("incoming")} className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${tab === "incoming" ? "bg-white text-green-700 shadow-sm" : "text-gray-500"}`}>
          📬 คำสั่งซื้อ ({pendingOrders.length > 0 ? <span className="text-orange-500">{pendingOrders.length}</span> : orders.length})
        </button>
      </div>

      {/* Tab: รายการ */}
      {tab === "listings" && (
        <>
          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <span className="text-4xl mb-3">📦</span>
              <p className="text-sm">ยังไม่มีรายการขาย</p>
              <button onClick={() => setShowForm(true)} className="text-xs text-green-700 mt-2 hover:underline">ลงขายตอนนี้</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {listings.map((l) => <PartCard key={l.id} listing={l} currentShopId={shopId} />)}
            </div>
          )}
        </>
      )}

      {/* Tab: คำสั่งซื้อที่เข้ามา */}
      {tab === "incoming" && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <span className="text-4xl mb-3">📬</span>
              <p className="text-sm">ยังไม่มีคำสั่งซื้อ</p>
            </div>
          ) : (
            orders.map((o) => (
              <OrderCard key={o.id} order={o} role="seller" onAction={handleAction} />
            ))
          )}
        </div>
      )}

      {/* Modals */}
      {showForm && shop && (
        <PartListingForm shopId={shopId} shopName={shop.name} onSubmit={handleAddListing} onClose={() => setShowForm(false)} />
      )}
      {shipOrder && (
        <ShipOrderModal order={shipOrder} onConfirm={handleShip} onClose={() => setShipOrder(null)} />
      )}
      {cancelOrder && (
        <CancelOrderConfirm order={cancelOrder} onConfirm={handleCancel} onClose={() => setCancelOrder(null)} />
      )}
    </div>
  );
}
