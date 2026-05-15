"use client";
// ── Parts B2B Orders — WeeeR (Sub-CMD-8 Wave 3) ───────────────────────────────
// แสดงคำสั่งซื้อ B2B ทั้งฝั่งผู้ซื้อและผู้ขาย
// Backend: GET /api/v1/parts/orders/:id/ + PATCH /fulfill/ + PATCH /close/
// R3: happy flow only — dispute/resolve ใน Sub-CMD ต่อไป

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getPartsOrderDetail,
  fulfillPartsOrder,
  closePartsOrder,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
} from "../../../../lib/parts-api";
import type { PartsOrderDto, PartsOrderDetailDto } from "../../../../lib/parts-api";

// ── Mock fallback ─────────────────────────────────────────────────────────────
const MOCK_ORDERS: PartsOrderDto[] = [
  {
    id: "ord-mock-0001",
    partId: "part-aaaa-bbbb-cccc",
    buyerId: "usr-buyer-0001",
    serviceId: null,
    quantity: 2,
    unitPriceThb: "4500.00",
    totalThb: "9000.00",
    status: "held",
    fulfillmentNote: null,
    trackingNumber: null,
    fulfilledAt: null,
    closedAt: null,
    idempotencyKey: "idem-mock-001",
    createdAt: "2026-05-14T09:00:00Z",
    updatedAt: "2026-05-14T09:00:00Z",
  },
  {
    id: "ord-mock-0002",
    partId: "part-dddd-eeee-ffff",
    buyerId: "usr-buyer-0002",
    serviceId: null,
    quantity: 1,
    unitPriceThb: "2200.00",
    totalThb: "2200.00",
    status: "fulfilled",
    fulfillmentNote: "ส่ง Kerry ค่ะ",
    trackingNumber: "KE1234567890",
    fulfilledAt: "2026-05-13T12:00:00Z",
    closedAt: null,
    idempotencyKey: "idem-mock-002",
    createdAt: "2026-05-12T08:00:00Z",
    updatedAt: "2026-05-13T12:00:00Z",
  },
];

// ── หมายเหตุ: Sub-CMD-8 ใช้ order IDs ที่รู้อยู่แล้ว (real flow ดึงจาก list API)
// TODO Sub-CMD-9+: เพิ่ม GET /api/v1/parts/orders/ list endpoint เมื่อ Backend เพิ่ม
const DEMO_ORDER_IDS = ["ord-mock-0001", "ord-mock-0002"];

type Tab = "buyer" | "seller";

export default function PartsOrdersPage() {
  const [tab, setTab]           = useState<Tab>("buyer");
  const [orders, setOrders]     = useState<PartsOrderDto[]>([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Try to load each demo order from Backend
      const results = await Promise.allSettled(
        DEMO_ORDER_IDS.map((id) => getPartsOrderDetail(id))
      );
      const loaded = results
        .filter((r): r is PromiseFulfilledResult<PartsOrderDetailDto> => r.status === "fulfilled")
        .map((r) => r.value as PartsOrderDto);

      setOrders(loaded.length > 0 ? loaded : MOCK_ORDERS);
    } catch {
      setOrders(MOCK_ORDERS);
    } finally {
      setLoading(false);
    }
  }

  async function handleFulfill(orderId: string) {
    const trackingNumber = prompt("กรอก Tracking Number (ถ้ามี):");
    if (trackingNumber === null) return; // cancelled
    setActionId(orderId);
    setErrorMsg(null);
    try {
      const updated = await fulfillPartsOrder(orderId, {
        trackingNumber: trackingNumber.trim() || undefined,
        fulfillmentNote: "ส่งสินค้าแล้ว",
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o))
      );
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "ยืนยันส่งของล้มเหลว");
    } finally {
      setActionId(null);
    }
  }

  async function handleClose(orderId: string) {
    if (!confirm("ยืนยันรับของเรียบร้อยแล้ว?")) return;
    setActionId(orderId);
    setErrorMsg(null);
    try {
      const updated = await closePartsOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o))
      );
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "ยืนยันรับของล้มเหลว");
    } finally {
      setActionId(null);
    }
  }

  // TODO Sub-CMD-9+: filter by buyer/seller when list API available
  const displayed = orders;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">คำสั่งซื้อ B2B</h1>
        <Link href="/parts" className="text-sm text-gray-400 hover:text-gray-600">← คลังอะไหล่</Link>
      </div>

      {/* Tab */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {(["buyer", "seller"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${
              tab === t ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "buyer" ? "🛒 ฝั่งผู้ซื้อ" : "📦 ฝั่งผู้ขาย"}
          </button>
        ))}
      </div>

      {/* Info note */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 text-xs text-blue-700">
        <div className="font-semibold text-blue-800 mb-1">⚡ Parts B2B Order Workflow — Sub-CMD-8</div>
        <div>• ผู้ซื้อสั่งซื้อ → escrow ถือเงิน → ผู้ขายส่งของ → ผู้ซื้อยืนยันรับ → release เงิน</div>
        <div>• Dispute / Rating ใน Sub-CMD ถัดไป</div>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Orders */}
      {loading ? (
        <div className="p-8 text-center text-sm text-gray-400">กำลังโหลด…</div>
      ) : displayed.length === 0 ? (
        <div className="p-8 text-center space-y-2">
          <div className="text-3xl">🔄</div>
          <p className="text-sm text-gray-500">ไม่มีคำสั่งซื้อ</p>
          <Link href="/parts/marketplace" className="text-sm text-green-600 underline">
            เปิดตลาดอะไหล่
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((order) => {
            const statusLabel = ORDER_STATUS_LABEL[order.status];
            const statusColor = ORDER_STATUS_COLOR[order.status];
            const total = Number(order.totalThb);
            const unit = Number(order.unitPriceThb);
            const isActing = actionId === order.id;

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-gray-400">#{order.id.slice(0, 8)}…</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">
                      Part: <span className="font-mono text-xs">{order.partId.slice(0, 8)}…</span>
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xs text-gray-400">จำนวน</div>
                    <div className="text-sm font-bold text-gray-900">{order.quantity} ชิ้น</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">ราคา/ชิ้น</div>
                    <div className="text-sm font-bold text-gray-900">{unit.toLocaleString()} บาท</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">รวม</div>
                    <div className="text-sm font-bold text-green-700">{total.toLocaleString()} บาท</div>
                  </div>
                </div>

                {/* Fulfillment info */}
                {order.trackingNumber && (
                  <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    📦 Tracking: <span className="font-mono font-medium">{order.trackingNumber}</span>
                  </div>
                )}
                {order.fulfillmentNote && (
                  <div className="text-xs text-gray-500">หมายเหตุ: {order.fulfillmentNote}</div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {/* Seller actions */}
                  {tab === "seller" && order.status === "held" && (
                    <button
                      onClick={() => void handleFulfill(order.id)}
                      disabled={isActing}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl px-4 py-2.5 transition-colors disabled:opacity-60"
                    >
                      {isActing ? "กำลังดำเนินการ…" : "📦 ยืนยันส่งของ"}
                    </button>
                  )}
                  {/* Buyer actions */}
                  {tab === "buyer" && order.status === "fulfilled" && (
                    <button
                      onClick={() => void handleClose(order.id)}
                      disabled={isActing}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-xl px-4 py-2.5 transition-colors disabled:opacity-60"
                    >
                      {isActing ? "กำลังดำเนินการ…" : "✅ ยืนยันรับของ"}
                    </button>
                  )}
                  {(order.status === "closed" || order.status === "cancelled" || order.status === "refunded") && (
                    <div className="flex-1 text-center text-xs text-gray-400 py-2.5">
                      ดำเนินการเสร็จสิ้น
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
