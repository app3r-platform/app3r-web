"use client";
// ── Parts Order Detail — WeeeR (HUB Gen 33 P6) ────────────────────────────────
// แสดงรายละเอียด B2B Order ในฐานะ ผู้ซื้ออะไหล่
// Actions: shipped(fulfilled) → รับของแล้ว · ordered/confirmed(held) → ยกเลิก
// Phase 4 จะ wire API — ตอนนี้ mock hardcoded

import { use, useState } from "react";
import Link from "next/link";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
} from "../../../../../lib/parts-api";
import type { PartsOrderStatus } from "../../../../../lib/parts-api";

// ── Mock Order Detail type ─────────────────────────────────────────────────────
interface MockOrderDetail {
  id: string;
  partId: string;
  partName: string;
  partCondition: string;
  quantity: number;
  unitPriceThb: number;
  totalThb: number;
  status: PartsOrderStatus;
  sellerShopId: string;
  sellerShopName: string;
  trackingNumber: string | null;
  fulfillmentNote: string | null;
  orderedAt: string;
  fulfilledAt: string | null;
  closedAt: string | null;
  escrowHeldThb: number;
}

// ── Mock data — ครอบคลุมทุก stage ที่ WeeeR buyer เจอ ─────────────────────────
const MOCK_ORDER_DB: MockOrderDetail[] = [
  {
    id: "p-001",
    partId: "part-aaaa-1111",
    partName: "คอมเพรสเซอร์แอร์ Rotary 1HP (Mitsubishi)",
    partCondition: "มือสอง",
    quantity: 2,
    unitPriceThb: 4500,
    totalThb: 9000,
    status: "fulfilled",           // shipped → แสดงปุ่ม "รับของแล้ว"
    sellerShopId: "S-COOLTECH-01",
    sellerShopName: "ร้านคูลเทคแอร์",
    trackingNumber: "KE1234567890",
    fulfillmentNote: "ส่ง Kerry ตามที่นัด",
    orderedAt: "2026-05-20T09:00:00Z",
    fulfilledAt: "2026-05-22T12:00:00Z",
    closedAt: null,
    escrowHeldThb: 9000,
  },
  {
    id: "p-002",
    partId: "part-bbbb-2222",
    partName: "แผงวงจรควบคุม Daikin FTXS Series",
    partCondition: "ใหม่",
    quantity: 1,
    unitPriceThb: 2800,
    totalThb: 2800,
    status: "held",                // ordered → แสดงปุ่ม "ยกเลิก"
    sellerShopId: "S-DAIPARTS-02",
    sellerShopName: "ไดกิ้นพาร์ท (กรุงเทพ)",
    trackingNumber: null,
    fulfillmentNote: null,
    orderedAt: "2026-05-24T14:30:00Z",
    fulfilledAt: null,
    closedAt: null,
    escrowHeldThb: 2800,
  },
  {
    id: "p-003",
    partId: "part-cccc-3333",
    partName: "มอเตอร์พัดลม Indoor 25W (ถอดจากชุดซาก)",
    partCondition: "มือสอง — ถอดซาก",
    quantity: 3,
    unitPriceThb: 650,
    totalThb: 1950,
    status: "closed",              // received → terminal
    sellerShopId: "S-SCRAPKING-03",
    sellerShopName: "ศูนย์ซากเย็น",
    trackingNumber: "FL9876543210",
    fulfillmentNote: "ส่ง Flash Express",
    orderedAt: "2026-05-10T08:00:00Z",
    fulfilledAt: "2026-05-12T11:00:00Z",
    closedAt: "2026-05-14T09:00:00Z",
    escrowHeldThb: 0,              // released แล้ว
  },
  {
    id: "p-004",
    partId: "part-dddd-4444",
    partName: "เซ็นเซอร์อุณหภูมิ NTC 10K",
    partCondition: "ใหม่",
    quantity: 5,
    unitPriceThb: 180,
    totalThb: 900,
    status: "cancelled",           // cancelled → terminal
    sellerShopId: "S-SENSOR-04",
    sellerShopName: "เซ็นเซอร์โปร",
    trackingNumber: null,
    fulfillmentNote: null,
    orderedAt: "2026-05-18T10:00:00Z",
    fulfilledAt: null,
    closedAt: null,
    escrowHeldThb: 0,
  },
];

function findOrder(id: string): MockOrderDetail | null {
  return MOCK_ORDER_DB.find((o) => o.id === id) ?? MOCK_ORDER_DB[0] ?? null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function platformFee(total: number): number {
  return Math.round(total * 0.03);
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function PartsOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<MockOrderDetail | null>(() => findOrder(id));
  const [acting, setActing] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [done, setDone] = useState<"received" | "cancelled" | "rejected" | null>(null);
  // P9 — seller reject
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
        <span className="text-4xl">🔍</span>
        <p className="text-sm">ไม่พบคำสั่งซื้อ #{id}</p>
        <Link href="/parts/orders" className="text-sm text-green-600 hover:underline">
          ← กลับรายการ
        </Link>
      </div>
    );
  }

  const statusLabel = ORDER_STATUS_LABEL[order.status];
  const statusColor = ORDER_STATUS_COLOR[order.status];
  const fee = platformFee(order.totalThb);
  const netToSeller = order.totalThb - fee;

  // Actions (buyer perspective)
  const canReceive = order.status === "fulfilled";
  const canCancel  = order.status === "held" || order.status === "pending";
  // P9 — seller perspective: ปฏิเสธออเดอร์ (status = held = รอ seller confirm)
  const canReject  = order.status === "held";

  function handleReceive() {
    if (!canReceive || acting) return;
    setActing(true);
    // mock async
    setTimeout(() => {
      setOrder((prev) =>
        prev ? { ...prev, status: "closed", closedAt: new Date().toISOString(), escrowHeldThb: 0 } : prev
      );
      setDone("received");
      setActing(false);
    }, 600);
  }

  function handleCancel() {
    if (!cancelReason.trim()) return;
    setActing(true);
    setShowCancelModal(false);
    setTimeout(() => {
      setOrder((prev) =>
        prev ? { ...prev, status: "cancelled", escrowHeldThb: 0 } : prev
      );
      setDone("cancelled");
      setActing(false);
    }, 600);
  }

  // P9 — seller reject handler
  function handleReject() {
    if (!rejectReason.trim()) return;
    setActing(true);
    setShowRejectModal(false);
    setTimeout(() => {
      setOrder((prev) =>
        prev ? { ...prev, status: "cancelled", escrowHeldThb: 0 } : prev
      );
      setDone("rejected");
      setActing(false);
    }, 600);
  }

  return (
    <div className="space-y-5 max-w-lg">
      {/* Back */}
      <Link href="/parts/orders" className="text-sm text-gray-400 hover:text-gray-600">
        ← คำสั่งซื้อ B2B
      </Link>

      {/* ── Success banners ── */}
      {done === "received" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-start gap-3">
          <span className="text-2xl shrink-0">✅</span>
          <div>
            <p className="text-sm font-semibold text-green-700">ยืนยันรับของเรียบร้อย</p>
            <p className="text-xs text-green-600 mt-0.5">
              คะแนน escrow โอนให้ผู้ขายแล้ว (สุทธิ {netToSeller.toLocaleString()} pts)
            </p>
          </div>
        </div>
      )}
      {done === "cancelled" && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex items-start gap-3">
          <span className="text-2xl shrink-0">🚫</span>
          <div>
            <p className="text-sm font-semibold text-gray-700">ยกเลิกคำสั่งซื้อแล้ว</p>
            <p className="text-xs text-gray-500 mt-0.5">
              คะแนน {order.totalThb.toLocaleString()} pts คืนเข้ากระเป๋าคุณแล้ว
            </p>
          </div>
        </div>
      )}
      {done === "rejected" && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex items-start gap-3">
          <span className="text-2xl shrink-0">🚫</span>
          <div>
            <p className="text-sm font-semibold text-orange-700">ปฏิเสธออเดอร์แล้ว (P9)</p>
            <p className="text-xs text-orange-600 mt-0.5">
              escrow {order.totalThb.toLocaleString()} pts คืนผู้ซื้อแล้ว
            </p>
          </div>
        </div>
      )}

      {/* ── Order header card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Status bar */}
        <div className={`px-5 py-3 flex items-center justify-between ${statusColor.replace("text-", "border-l-4 border-").split(" ").slice(0, 1).join("")} bg-gray-50`}>
          <div>
            <p className="text-xs text-gray-400">คำสั่งซื้อ</p>
            <p className="text-sm font-mono font-medium text-gray-700">#{order.id}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Part info */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-xl shrink-0">🔩</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 leading-snug">{order.partName}</p>
              <p className="text-xs text-gray-400 mt-0.5">สภาพ: {order.partCondition}</p>
            </div>
          </div>

          {/* Qty / price / total */}
          <div className="grid grid-cols-3 gap-3 text-center bg-gray-50 rounded-xl py-3">
            <div>
              <p className="text-xs text-gray-400">จำนวน</p>
              <p className="text-sm font-bold text-gray-900">{order.quantity} ชิ้น</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">ราคา/ชิ้น</p>
              <p className="text-sm font-bold text-gray-900">{order.unitPriceThb.toLocaleString()} pts</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">รวม</p>
              <p className="text-sm font-bold text-green-700">{order.totalThb.toLocaleString()} pts</p>
            </div>
          </div>

          {/* Fee breakdown */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>ค่าบริการแพลตฟอร์ม (3%)</span>
              <span>{fee.toLocaleString()} pts</span>
            </div>
            <div className="flex justify-between font-medium text-gray-700 border-t border-gray-100 pt-1.5">
              <span>ผู้ขายได้รับ (สุทธิ)</span>
              <span className="text-green-700">{netToSeller.toLocaleString()} pts</span>
            </div>
            {order.escrowHeldThb > 0 && (
              <div className="flex justify-between text-blue-600 bg-blue-50 rounded-lg px-2 py-1.5 mt-1">
                <span>🔒 Gold escrow (พักอยู่)</span>
                <span className="font-semibold">{order.escrowHeldThb.toLocaleString()} pts</span>
              </div>
            )}
          </div>

          {/* Seller */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
            <span className="text-base">🏪</span>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">ผู้ขาย</p>
              <p className="text-sm font-medium text-gray-800 truncate">{order.sellerShopName}</p>
            </div>
          </div>

          {/* Tracking */}
          {order.trackingNumber && (
            <div className="flex items-center gap-2 bg-[#FFF1ED] border border-[#FFE0D6] rounded-xl px-3 py-2.5">
              <span className="text-base">📦</span>
              <div>
                <p className="text-xs text-[#F04E20]">Tracking Number</p>
                <p className="text-sm font-mono font-semibold text-[#D63B12]">{order.trackingNumber}</p>
              </div>
            </div>
          )}
          {order.fulfillmentNote && (
            <p className="text-xs text-gray-500">หมายเหตุจากผู้ขาย: {order.fulfillmentNote}</p>
          )}

          {/* Timeline */}
          <div className="space-y-1 pt-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">ไทม์ไลน์</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                <span>สั่งซื้อ — {formatDate(order.orderedAt)}</span>
              </div>
              {order.fulfilledAt && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF663A] shrink-0" />
                  <span>ผู้ขายส่งของ — {formatDate(order.fulfilledAt)}</span>
                </div>
              )}
              {order.closedAt && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-700 shrink-0" />
                  <span>รับของเรียบร้อย — {formatDate(order.closedAt)}</span>
                </div>
              )}
              {order.status === "cancelled" && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                  <span>ยกเลิก</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Action buttons (buyer only) ── */}
      {!done && (
        <div className="space-y-2">
          {/* รับของแล้ว — status = fulfilled */}
          {canReceive && (
            <button
              onClick={handleReceive}
              disabled={acting}
              className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-2xl transition-colors"
            >
              {acting ? "กำลังดำเนินการ…" : "✅ รับของแล้ว — ยืนยันรับสินค้า"}
            </button>
          )}

          {/* ยกเลิก — status = held / pending */}
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={acting}
              className="w-full bg-white border border-red-200 hover:bg-red-50 text-red-600 font-medium py-2.5 rounded-2xl transition-colors text-sm"
            >
              {acting ? "กำลังดำเนินการ…" : "🚫 ยกเลิกคำสั่งซื้อ"}
            </button>
          )}

          {/* Dispute link (fulfilled, not yet closed) */}
          {order.status === "fulfilled" && (
            <Link
              href={`/parts/orders/${order.id}/dispute`}
              className="flex items-center justify-center gap-1.5 w-full text-sm text-red-400 hover:text-red-600 py-2"
            >
              ⚠️ แจ้งปัญหา / เปิด Dispute
            </Link>
          )}
        </div>
      )}

      {/* ── P9: Seller action block ── */}
      {!done && canReject && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🏪</span>
            <p className="text-sm font-semibold text-orange-800">มุมผู้ขาย — ออเดอร์ใหม่รอยืนยัน</p>
          </div>
          <p className="text-xs text-orange-600">
            ออเดอร์นี้รอการยืนยันจากร้านของคุณ · ยืนยันผ่านหน้า orders หลัก หรือปฏิเสธได้ที่นี่
          </p>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={acting}
            className="w-full bg-white border border-orange-300 hover:bg-orange-100 text-orange-700 font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            {acting ? "กำลังดำเนินการ…" : "🚫 ปฏิเสธออเดอร์นี้ (P9)"}
          </button>
        </div>
      )}

      {/* Terminal state message */}
      {(order.status === "closed" || order.status === "cancelled" || order.status === "refunded" || order.status === "resolved") && !done && (
        <div className="text-center text-xs text-gray-400 py-2">
          คำสั่งซื้อนี้ดำเนินการเสร็จสิ้นแล้ว
        </div>
      )}

      {/* ── P9 Reject modal (seller) ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🚫</span>
              <div>
                <p className="text-sm font-bold text-gray-900">ปฏิเสธออเดอร์นี้?</p>
                <p className="text-xs text-gray-500 mt-1">
                  escrow {order.totalThb.toLocaleString()} pts จะถูกคืนผู้ซื้อทันที
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                เหตุผลที่ปฏิเสธ <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="เช่น สินค้าหมดสต็อก / ราคาผิด / ไม่รับออเดอร์นี้…"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(""); }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                ยืนยันปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🚫</span>
              <div>
                <p className="text-sm font-bold text-gray-900">ยืนยันยกเลิกคำสั่งซื้อ?</p>
                <p className="text-xs text-gray-500 mt-1">
                  คะแนน {order.totalThb.toLocaleString()} pts จะถูกคืนเข้ากระเป๋าของคุณ
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                เหตุผลในการยกเลิก <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="ระบุเหตุผล เช่น เปลี่ยนใจ / ได้ของจากที่อื่นแล้ว…"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                ยังไม่ยกเลิก
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                ยืนยันยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
