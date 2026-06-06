"use client";

// ── My Orders — Phase C-6 ─────────────────────────────────────────────────────
// มุมผู้ซื้อ + ผู้ขาย: tabs ฝั่งผู้ซื้อ / ฝั่งผู้ขาย
// Screen: R-33 / PARTS-MY-ORDERS
// §5 มาจาก: R-30c (สั่งซื้อสำเร็จ) / R-51 (Parts Hub nav) · §6 → R-34 · เคส P4,P5,P6,P7,P8,P9

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PartOrder } from "../_lib/types";
import { PART_ORDERS_MOCK } from "../_lib/mock-data";
import { OrderCard } from "../../../../components/parts/OrderCard";
import { PointsBalanceCard } from "../../../../components/parts/PointsBalanceCard";
import { ConfirmReceiveModal } from "../../../../components/parts/ConfirmReceiveModal";
import { ShipOrderModal } from "../../../../components/parts/ShipOrderModal";
import { CancelOrderConfirm } from "../../../../components/parts/CancelOrderConfirm";
import { ORDER_STAGE_LABEL } from "../_lib/types";
import {
  getCurrentShopId, getOrders, saveOrders, upsertOrder,
  updateListingStock, partsSync, usePartsSync,
} from "../../../../lib/utils/parts-sync";
import { escrowRelease, escrowRefund, getEscrowHeldByShop } from "../../../../lib/utils/parts-escrow";
import { SHOPS_MOCK } from "../../../../lib/mock-data/shops";
import { FlowOrigin, CrossAppPanel } from "@/components/MockAnno";

type SideTab = "buyer" | "seller";
type StageFilter = PartOrder["stage"] | "all";

export default function MyOrdersPage() {
  const router = useRouter();
  const [shopId, setShopId] = useState("S001");
  const [orders, setOrders] = useState<PartOrder[]>([]);
  const [sideTab, setSideTab] = useState<SideTab>("buyer");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [confirmOrder, setConfirmOrder] = useState<PartOrder | null>(null);
  const [receiveOrder, setReceiveOrder] = useState<PartOrder | null>(null);
  const [shipOrder, setShipOrder] = useState<PartOrder | null>(null);
  const [cancelOrder, setCancelOrder] = useState<PartOrder | null>(null);
  const [escrowHeld, setEscrowHeld] = useState(0);

  const reload = () => {
    const id = getCurrentShopId();
    setShopId(id);
    const stored = getOrders();
    setOrders(stored.length > 0 ? stored : PART_ORDERS_MOCK);
    setEscrowHeld(getEscrowHeldByShop(id));
  };

  useEffect(() => {
    const stored = getOrders();
    if (stored.length === 0) saveOrders(PART_ORDERS_MOCK);
    reload();
  }, []);

  usePartsSync((e) => {
    if (["refresh_parts", "shop_switched", "order_placed", "order_confirmed", "order_shipped", "order_received", "order_cancelled"].includes(e.type)) reload();
  });

  const shop = SHOPS_MOCK.find((s) => s.id === shopId);

  // กรองตาม side + stage
  const sideOrders = orders.filter((o) =>
    sideTab === "buyer" ? o.buyerShopId === shopId : o.sellerShopId === shopId
  );
  const filtered = stageFilter === "all" ? sideOrders : sideOrders.filter((o) => o.stage === stageFilter);

  // นับแต่ละ stage
  const countByStage = (stage: PartOrder["stage"]) => sideOrders.filter((o) => o.stage === stage).length;

  // P5: ผู้ขายรับออเดอร์ ordered→confirmed
  const handleConfirm = () => {
    if (!confirmOrder) return;
    const updated: PartOrder = { ...confirmOrder, stage: "confirmed" };
    upsertOrder(updated);
    partsSync.emit({ type: "order_confirmed", orderId: confirmOrder.id });
    setConfirmOrder(null);
    reload();
  };

  const handleAction = (action: "confirm" | "ship" | "receive" | "cancel", orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    if (action === "confirm") setConfirmOrder(order);
    if (action === "receive") setReceiveOrder(order);
    if (action === "ship")    setShipOrder(order);
    if (action === "cancel")  setCancelOrder(order);
  };

  const handleReceive = () => {
    if (!receiveOrder) return;
    const result = escrowRelease(receiveOrder.id);
    if (result.success) {
      const updated: PartOrder = { ...receiveOrder, stage: "received", receivedAt: new Date().toISOString() };
      upsertOrder(updated);
      partsSync.emit({ type: "order_received", orderId: receiveOrder.id });
    }
    setReceiveOrder(null);
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
    escrowRefund(cancelOrder.id);
    updateListingStock(cancelOrder.partId, cancelOrder.quantity);
    const updated: PartOrder = { ...cancelOrder, stage: "cancelled", cancelledAt: new Date().toISOString() };
    upsertOrder(updated);
    partsSync.emit({ type: "order_cancelled", orderId: cancelOrder.id, partId: cancelOrder.partId });
    setCancelOrder(null);
    reload();
  };

  const STAGE_TABS: { value: StageFilter; label: string }[] = [
    { value: "all",       label: `ทั้งหมด (${sideOrders.length})` },
    { value: "ordered",   label: `${ORDER_STAGE_LABEL.ordered} (${countByStage("ordered")})` },
    { value: "confirmed", label: `${ORDER_STAGE_LABEL.confirmed} (${countByStage("confirmed")})` },
    { value: "shipped",   label: `${ORDER_STAGE_LABEL.shipped} (${countByStage("shipped")})` },
    { value: "received",  label: `${ORDER_STAGE_LABEL.received} (${countByStage("received")})` },
    { value: "cancelled", label: `${ORDER_STAGE_LABEL.cancelled} (${countByStage("cancelled")})` },
  ];

  return (
    <div className="space-y-4">
      {/* §5 Flow Origin */}
      <FlowOrigin
        sources={[
          { id: "R-30c", label: "Item Detail (สั่งซื้อสำเร็จ)" },
          { id: "R-51", label: "Parts Hub (nav)" },
        ]}
        cases="P4, P5, P6, P7, P8, P9"
      />

      {/* §8 Cross-App — ผู้ขาย WeeeR ณ ขณะต่างๆ ของ flow */}
      <CrossAppPanel
        moment="ผู้ซื้อดูออเดอร์ / ดำเนินการ"
        entries={[
          {
            app: "WeeeR (ร้านผู้ขาย)",
            screenId: "R-29",
            screenLabel: "My Listings (tab: คำสั่งซื้อ)",
            description: "[P5] เมื่อผู้ซื้อรอ confirm → ผู้ขายเห็น order ใหม่ใน incoming · [P6] กดส่ง → tracking ปรากฏ",
          },
          {
            app: "WeeeR (ร้านผู้ขาย)",
            screenId: "R-33",
            screenLabel: "My Orders (seller tab)",
            description: "[P7] เมื่อผู้ซื้อรับของ → escrow release → ยอด pts เข้าร้านผู้ขาย",
          },
        ]}
        cases="P5, P6, P7"
      />

      <h1 className="text-xl font-bold text-gray-900">คำสั่งซื้อของฉัน</h1>

      {/* คะแนนยอดเงิน */}
      {shop && (
        <PointsBalanceCard
          balance={shop.pointsBalance}
          escrowHeld={escrowHeld}
          shopName={shop.name}
        />
      )}

      {/* ฝั่ง: ผู้ซื้อ / ผู้ขาย */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {(["buyer", "seller"] as SideTab[]).map((s) => (
          <button
            key={s}
            onClick={() => { setSideTab(s); setStageFilter("all"); }}
            className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${sideTab === s ? "bg-white text-[#D63B12] shadow-sm" : "text-gray-500"}`}
          >
            {s === "buyer" ? "🛒 ฝั่งผู้ซื้อ" : "📦 ฝั่งผู้ขาย"}
          </button>
        ))}
      </div>

      {/* Stage filter */}
      <div className="flex gap-1.5 flex-wrap">
        {STAGE_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStageFilter(t.value)}
            className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${stageFilter === t.value ? "bg-[#FF663A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
          <span className="text-4xl mb-3">🔄</span>
          <p className="text-sm">ไม่มีคำสั่งซื้อ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* §6 FlowNav: click order card → R-34 (Buyer Order Detail) */}
          {filtered.map((o) => (
            <div key={o.id} onClick={() => router.push(`/parts/my-orders/${o.id}`)} className="cursor-pointer" title="§6 → R-34 Buyer Order Detail">
              <OrderCard order={o} role={sideTab} onAction={handleAction} />
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {/* P5 Confirm modal */}
      {confirmOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
            <h2 className="font-bold text-gray-900">☑️ รับออเดอร์ (P5)</h2>
            <p className="text-sm text-gray-600">
              ยืนยันรับออเดอร์ <span className="font-semibold">{confirmOrder.partName}</span>{" "}
              จาก {confirmOrder.buyerShopName} — {confirmOrder.quantity} ชิ้น · {confirmOrder.totalPoints.toLocaleString()} pts
            </p>
            <div className="flex gap-2">
              <button onClick={handleConfirm} className="flex-1 bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                ✅ ยืนยันรับออเดอร์
              </button>
              <button onClick={() => setConfirmOrder(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
      {receiveOrder && <ConfirmReceiveModal order={receiveOrder} onConfirm={handleReceive} onClose={() => setReceiveOrder(null)} />}
      {shipOrder    && <ShipOrderModal order={shipOrder}         onConfirm={handleShip}    onClose={() => setShipOrder(null)} />}
      {cancelOrder  && <CancelOrderConfirm order={cancelOrder}   onConfirm={handleCancel}  onClose={() => setCancelOrder(null)} />}
    </div>
  );
}
