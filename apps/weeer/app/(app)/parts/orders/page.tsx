"use client";
// ── Parts B2B Orders — WeeeR (Sub-CMD-9 Wave 3) ───────────────────────────────
// แสดงคำสั่งซื้อ B2B ทั้งฝั่งผู้ซื้อและผู้ขาย
// Sub-CMD-9: ใช้ GET /api/v1/parts/orders/ list endpoint จริง (deferred จาก Sub-8)
// Backend: listMyOrders + PATCH /fulfill/ + PATCH /close/
// W3 carry-over: dispute link + rate link

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  listMyOrders,
  fulfillPartsOrder,
  closePartsOrder,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
} from "../../../../lib/parts-api";
import type { PartsOrderDto } from "../../../../lib/parts-api";

// ── Mock fallback (ใช้เมื่อ API ล้มเหลวหรือ dev offline) ─────────────────────
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
  {
    id: "ord-mock-0003",
    partId: "part-gggg-hhhh-iiii",
    buyerId: "usr-buyer-0001",
    serviceId: null,
    quantity: 3,
    unitPriceThb: "1500.00",
    totalThb: "4500.00",
    status: "closed",
    fulfillmentNote: "ส่ง Flash ค่ะ",
    trackingNumber: "FL9876543210",
    fulfilledAt: "2026-05-10T12:00:00Z",
    closedAt: "2026-05-11T09:00:00Z",
    idempotencyKey: "idem-mock-003",
    createdAt: "2026-05-09T08:00:00Z",
    updatedAt: "2026-05-11T09:00:00Z",
  },
];

// TODO Sub-CMD-10+: ดึง userId จริงจาก auth context
const PLACEHOLDER_USER_ID = "usr-weeer-current";

type Tab = "buyer" | "seller";

export default function PartsOrdersPage() {
  const [tab, setTab]           = useState<Tab>("buyer");
  const [orders, setOrders]     = useState<PartsOrderDto[]>([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [useMock, setUseMock]   = useState(false);

  const loadOrders = useCallback(async (currentTab: Tab) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Sub-CMD-9: ใช้ list endpoint จริง
      const params =
        currentTab === "buyer"
          ? { buyerId: PLACEHOLDER_USER_ID, limit: 50 }
          : { sellerId: PLACEHOLDER_USER_ID, limit: 50 };
      const result = await listMyOrders(params);
      setOrders(result.items);
      setUseMock(false);
    } catch {
      // fallback to mock data
      const mockFiltered = MOCK_ORDERS.filter((o) =>
        currentTab === "buyer"
          ? o.buyerId === "usr-buyer-0001"
          : o.buyerId !== "usr-buyer-0001"
      );
      setOrders(mockFiltered.length > 0 ? mockFiltered : MOCK_ORDERS);
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders(tab);
  }, [tab, loadOrders]);

  async function handleFulfill(orderId: string) {
    const trackingNumber = prompt("กรอก Tracking Number (ถ้ามี):");
    if (trackingNumber === null) return;
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

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">คำสั่งซื้อ B2B</h1>
        <Link href="/parts" className="text-sm text-gray-400 hover:text-gray-600">← คลังอะไหล่</Link>
      </div>

      {/* Tabs */}
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

      {/* Mock notice */}
      {useMock && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          ⚠️ แสดงข้อมูลตัวอย่าง — ไม่สามารถเชื่อมต่อ Backend ได้
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Orders list */}
      {loading ? (
        <div className="p-8 text-center text-sm text-gray-400">กำลังโหลด…</div>
      ) : orders.length === 0 ? (
        <div className="p-8 text-center space-y-2">
          <div className="text-3xl">🔄</div>
          <p className="text-sm text-gray-500">
            {tab === "buyer" ? "ไม่มีคำสั่งซื้อของคุณ" : "ไม่มีคำสั่งซื้อที่คุณเป็นผู้ขาย"}
          </p>
          <Link href="/parts/marketplace" className="text-sm text-green-600 underline">
            เปิดตลาดอะไหล่
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const statusLabel = ORDER_STATUS_LABEL[order.status];
            const statusColor = ORDER_STATUS_COLOR[order.status];
            const total = Number(order.totalThb);
            const unit  = Number(order.unitPriceThb);
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
                {order.fulfillmentNote && !order.trackingNumber && (
                  <div className="text-xs text-gray-500">หมายเหตุ: {order.fulfillmentNote}</div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1 flex-wrap">
                  {/* Seller: ยืนยันส่งของ */}
                  {tab === "seller" && order.status === "held" && (
                    <button
                      onClick={() => void handleFulfill(order.id)}
                      disabled={isActing}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl px-4 py-2.5 transition-colors disabled:opacity-60"
                    >
                      {isActing ? "กำลังดำเนินการ…" : "📦 ยืนยันส่งของ"}
                    </button>
                  )}

                  {/* Buyer: ยืนยันรับของ */}
                  {tab === "buyer" && order.status === "fulfilled" && (
                    <button
                      onClick={() => void handleClose(order.id)}
                      disabled={isActing}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-xl px-4 py-2.5 transition-colors disabled:opacity-60"
                    >
                      {isActing ? "กำลังดำเนินการ…" : "✅ ยืนยันรับของ"}
                    </button>
                  )}

                  {/* Buyer: dispute link (held/fulfilled) — W3 carry-over */}
                  {tab === "buyer" && (order.status === "held" || order.status === "fulfilled") && (
                    <Link
                      href={`/parts/orders/${order.id}/dispute`}
                      className="text-xs text-red-500 hover:text-red-700 underline py-2.5 px-2"
                    >
                      ⚠️ แจ้งปัญหา
                    </Link>
                  )}

                  {/* Buyer: rate link (closed, not yet rated) — W3 carry-over */}
                  {tab === "buyer" && order.status === "closed" && (
                    <Link
                      href={`/parts/orders/${order.id}/rate`}
                      className="text-xs text-yellow-600 hover:text-yellow-800 underline py-2.5 px-2"
                    >
                      ⭐ ให้คะแนน
                    </Link>
                  )}

                  {/* Terminal states */}
                  {(order.status === "cancelled" || order.status === "refunded" || order.status === "resolved") && (
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
