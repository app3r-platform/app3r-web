"use client";

// ── My Order Detail — Phase D-4 (P7 Receive · P8 Buyer Cancel · P9 Seller Cancel) ──
// Screen: R-34 / PARTS-BUYER-ORDER
// §5 มาจาก: R-33 (My Orders, buyer tab) · เคส P7, P8

import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { PartOrder } from "../../_lib/types";
import { PART_ORDERS_MOCK } from "../../_lib/mock-data";
import { MockAnnoOrigin, MockAnnoXApp } from "@/components/MockAnno";
import { OrderStageStepper } from "../../../../../components/parts/OrderStageStepper";
import { ORDER_STAGE_LABEL, ORDER_STAGE_COLOR, DELIVERY_LABEL } from "../../_lib/types";
import {
  getCurrentShopId, getOrders, saveOrders, upsertOrder,
  updateListingStock, partsSync, usePartsSync,
} from "../../../../../lib/utils/parts-sync";
import { escrowRelease, escrowRefund } from "../../../../../lib/utils/parts-escrow";

// ── D-6: Inventory Import Prompt component ─────────────────────────────────────
// แสดงหลังออเดอร์ถึง "received" — ถามผู้ขายว่าต้องการเพิ่มอะไหล่เข้าสต็อกไหม
function InventoryImportPrompt({
  orderId, partName, qty,
}: { orderId: string; partName: string; qty: number }) {
  const [dismissed, setDismissed] = useState(false);
  const [imported, setImported] = useState(false);

  const doneKey = `d6_inv_import_${orderId}`;

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem(doneKey)) setImported(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (dismissed || imported) return null;

  const handleImport = () => {
    // Mock: store in localStorage → simulate inventory_item + stock_movement creation
    const entry = { orderId, partName, qty, importedAt: new Date().toISOString() };
    const stored: typeof entry[] = JSON.parse(localStorage.getItem("d6_inv_imports") ?? "[]") as typeof entry[];
    stored.push(entry);
    localStorage.setItem("d6_inv_imports", JSON.stringify(stored));
    localStorage.setItem(doneKey, "1");
    setImported(true);
  };

  return (
    <div className="bg-[#FFF1ED] border border-[#FF8B66] rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="text-2xl">📦</span>
        <div>
          <p className="text-sm font-semibold text-[#B8300E]">รับอะไหล่เข้าสต็อก?</p>
          <p className="text-xs text-[#F04E20] mt-0.5">
            ออเดอร์ปิดแล้ว — ต้องการเพิ่ม <strong>{partName}</strong> ({qty} ชิ้น) เข้าคลังอะไหล่ไหม?
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        ระบบจะสร้าง Inventory Item + Stock Movement (purchase-in) โดยอัตโนมัติ
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleImport}
          className="flex-1 py-2 bg-[#FF663A] text-white rounded-lg text-xs font-medium hover:bg-[#F04E20] transition-colors"
        >
          ✅ เพิ่มเข้าสต็อก
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-xs"
        >
          ข้าม
        </button>
      </div>
    </div>
  );
}

// P7: checklist ตรวจสอบสินค้าก่อนยืนยันรับ
const RECEIVE_CHECKLIST = [
  "จำนวนสินค้าครบถ้วนตามที่สั่งซื้อ",
  "สภาพสินค้าดี ไม่มีความเสียหาย",
  "สินค้าตรงตามรายการที่สั่งซื้อ",
];

export default function MyOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [shopId, setShopId] = useState("S001");
  const [order, setOrder] = useState<PartOrder | null>(null);

  // P7: receive modal state
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [checklist, setChecklist] = useState<boolean[]>(RECEIVE_CHECKLIST.map(() => false));
  const [receiving, setReceiving] = useState(false);
  const [receiveResult, setReceiveResult] = useState<{ netToSeller: number; fee: number } | null>(null);

  // P8/P9: cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);

  const reload = () => {
    const sid = getCurrentShopId();
    setShopId(sid);
    const stored = getOrders();
    const all = stored.length > 0 ? stored : PART_ORDERS_MOCK;
    setOrder(all.find((o) => o.id === id) ?? null);
  };

  useEffect(() => {
    const stored = getOrders();
    if (stored.length === 0) saveOrders(PART_ORDERS_MOCK);
    reload();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  usePartsSync((e) => {
    if (
      ["refresh_parts", "shop_switched", "order_confirmed", "order_shipped",
       "order_received", "order_cancelled"].includes(e.type)
    ) reload();
  });

  // ── Not found ──────────────────────────────────────────────────────────────────
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-2">
        <span className="text-4xl">🔍</span>
        <p className="text-sm">ไม่พบคำสั่งซื้อ #{id}</p>
        <Link href="/parts/my-orders" className="text-xs text-[#D63B12] hover:underline mt-1">
          ‹ กลับรายการคำสั่งซื้อ
        </Link>
      </div>
    );
  }

  // ── Role ───────────────────────────────────────────────────────────────────────
  const role: "buyer" | "seller" | null =
    order.buyerShopId  === shopId ? "buyer"  :
    order.sellerShopId === shopId ? "seller" : null;

  // ── P7: buyer confirm receive (shipped → received) ────────────────────────────
  const canReceive = role === "buyer" && order.stage === "shipped";
  const checklistAllDone = checklist.every(Boolean);

  const handleReceive = () => {
    if (!checklistAllDone || receiving) return;
    setReceiving(true);
    const result = escrowRelease(order.id);
    const updated: PartOrder = {
      ...order,
      stage: "received",
      receivedAt: new Date().toISOString(),
    };
    upsertOrder(updated);
    partsSync.emit({ type: "order_received", orderId: order.id });
    if (result.success) {
      setReceiveResult({ netToSeller: result.netToSeller, fee: result.fee });
    }
    setShowReceiveModal(false);
    setReceiving(false);
    reload();
  };

  // ── P8: buyer cancel (ordered only)
  // ── P9: seller cancel (ordered or confirmed, before shipped)
  const canCancel =
    (role === "buyer"  && order.stage === "ordered") ||
    (role === "seller" && (order.stage === "ordered" || order.stage === "confirmed"));

  const handleCancel = () => {
    if (!cancelReason.trim() || cancelling) return;
    setCancelling(true);
    escrowRefund(order.id);
    updateListingStock(order.partId, order.quantity);
    const updated: PartOrder = {
      ...order,
      stage: "cancelled",
      cancelledAt: new Date().toISOString(),
    };
    upsertOrder(updated);
    partsSync.emit({ type: "order_cancelled", orderId: order.id, partId: order.partId });
    setShowCancelModal(false);
    setCancelReason("");
    setCancelling(false);
    setCancelDone(true);
    reload();
  };

  // ── UI ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* §5 Flow Origin — เคส P7, P8 */}
      <MockAnnoOrigin from={["R-33"]} />

      {/* §8 Cross-App — ผู้ขาย WeeeR เห็นอะไรขณะผู้ซื้อดูรายละเอียด (เคส P7, P8) */}
      <MockAnnoXApp
        entries={[
          {
            app: "WeeeR (ร้านผู้ขาย)",
            screen: "R-29 My Listings (incoming tab)",
            url: "http://localhost:3001/parts/my-listings",
          },
          {
            app: "WeeeR (ร้านผู้ขาย)",
            screen: "R-33 My Orders (seller tab)",
            url: "http://localhost:3001/parts/my-orders",
          },
        ]}
      />

      {/* Back */}
      <Link href="/parts/my-orders" className="text-sm text-gray-400 hover:text-gray-600">
        ‹ กลับรายการคำสั่งซื้อ {/* §6 → R-33 */}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">{order.partName}</h1>
          <p className="text-xs text-gray-400 mt-0.5">#{order.id}</p>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${ORDER_STAGE_COLOR[order.stage]}`}>
          {ORDER_STAGE_LABEL[order.stage]}
        </span>
      </div>

      {/* Stepper */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <OrderStageStepper stage={order.stage} />
      </div>

      {/* Order Details */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">รายละเอียดคำสั่งซื้อ</h2>
        <div className="grid grid-cols-2 gap-y-3 text-xs">
          <div>
            <p className="text-gray-400">ผู้ขาย</p>
            <p className="font-medium text-gray-700">{order.sellerShopName}</p>
          </div>
          <div>
            <p className="text-gray-400">ผู้ซื้อ</p>
            <p className="font-medium text-gray-700">{order.buyerShopName}</p>
          </div>
          <div>
            <p className="text-gray-400">จำนวน</p>
            <p className="font-medium text-gray-700">
              {order.quantity} ชิ้น · {order.pricePoints.toLocaleString()} พอยต์/ชิ้น
            </p>
          </div>
          <div>
            <p className="text-gray-400">รวม</p>
            <p className="font-bold text-[#D63B12]">{order.totalPoints.toLocaleString()} พอยต์</p>
          </div>
          <div>
            <p className="text-gray-400">ค่าธรรมเนียม (3%)</p>
            <p className="font-medium text-gray-500">{order.platformFee.toLocaleString()} พอยต์</p>
          </div>
          <div>
            <p className="text-gray-400">ผู้ขายได้รับ</p>
            <p className="font-medium text-gray-700">{order.netToSeller.toLocaleString()} พอยต์</p>
          </div>
          <div>
            <p className="text-gray-400">การจัดส่ง</p>
            <p className="font-medium text-gray-700">{DELIVERY_LABEL[order.deliveryMethod]}</p>
          </div>
          <div>
            <p className="text-gray-400">วันที่สั่ง</p>
            <p className="font-medium text-gray-700">
              {new Date(order.orderedAt).toLocaleDateString("th-TH")}
            </p>
          </div>
        </div>

        {/* Tracking */}
        {order.trackingNumber && (
          <div className="bg-orange-50 rounded-lg px-3 py-2 text-xs">
            📦 เลขพัสดุ (Tracking):{" "}
            <span className="font-mono font-medium text-gray-800">{order.trackingNumber}</span>
          </div>
        )}

        {/* Timestamps */}
        <div className="space-y-0.5 text-xs text-gray-400">
          {order.shippedAt && (
            <p>จัดส่งเมื่อ: {new Date(order.shippedAt).toLocaleDateString("th-TH")}</p>
          )}
          {order.receivedAt && (
            <p>รับของเมื่อ: {new Date(order.receivedAt).toLocaleDateString("th-TH")}</p>
          )}
          {order.cancelledAt && (
            <p className="text-red-400">
              ยกเลิกเมื่อ: {new Date(order.cancelledAt).toLocaleDateString("th-TH")}
            </p>
          )}
        </div>
      </div>

      {/* P7 Receive result banner */}
      {receiveResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 space-y-1">
          <p className="text-sm font-semibold text-emerald-700">
            ✅ ยืนยันรับของสำเร็จ — ปลดพักเงินกลาง (Escrow) แล้ว
          </p>
          <p className="text-xs text-emerald-600">
            ผู้ขายได้รับ {receiveResult.netToSeller.toLocaleString()} พอยต์
            (หักค่าธรรมเนียม {receiveResult.fee.toLocaleString()} พอยต์)
          </p>
        </div>
      )}

      {/* P8/P9 Cancel done banner */}
      {cancelDone && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
          <p className="text-sm font-semibold text-red-700">🚫 ยกเลิกคำสั่งซื้อแล้ว</p>
          <p className="text-xs text-red-500">
            คะแนน {order.totalPoints.toLocaleString()} พอยต์ ถูกคืนให้ผู้ซื้อแล้ว
          </p>
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────────────────── */}
      <div className="space-y-2">

        {/* P7: Buyer confirm receive */}
        {canReceive && !receiveResult && (
          <button
            onClick={() => setShowReceiveModal(true)}
            className="w-full bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            ✅ ยืนยันรับของ (P7)
          </button>
        )}

        {/* P8/P9: Cancel */}
        {canCancel && !cancelDone && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium py-2.5 rounded-xl text-sm transition-colors"
          >
            🚫 {role === "buyer" ? "ยกเลิกคำสั่งซื้อ (P8)" : "ยกเลิกออเดอร์ (P9)"}
          </button>
        )}

        {/* Stage-specific info messages */}
        {order.stage === "shipped" && role === "seller" && (
          <p className="text-xs text-center text-gray-400">📬 รอผู้ซื้อยืนยันรับของ</p>
        )}
        {order.stage === "received" && !receiveResult && (
          <p className="text-xs text-center text-gray-400">
            ✅ งานนี้ปิดแล้ว — ปลดพักเงินกลาง (Escrow) แล้ว
          </p>
        )}
        {order.stage === "cancelled" && !cancelDone && (
          <p className="text-xs text-center text-gray-400">
            🚫 คำสั่งซื้อถูกยกเลิก — พักเงินกลาง (Escrow) คืนแล้ว
          </p>
        )}
        {order.stage === "ordered" && role === "seller" && (
          <p className="text-xs text-center text-gray-400">
            ⏳ รอคุณรับออเดอร์ใน{" "}
            <Link href="/parts/my-listings" className="text-[#D63B12] hover:underline">
              จัดการร้าน
            </Link>
          </p>
        )}
        {order.stage === "confirmed" && role === "buyer" && (
          <p className="text-xs text-center text-gray-400">
            ☑️ ผู้ขายรับออเดอร์แล้ว — รอการจัดส่ง
          </p>
        )}
      </div>

      {/* ── P7: Receive Modal ─────────────────────────────────────────────────── */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
            {/* §7 เคส P7 */}
            <h2 className="font-bold text-gray-900">✅ ยืนยันรับของ</h2>
            <p className="text-sm text-gray-600">
              กรุณาตรวจสอบสินค้าก่อนยืนยัน — ติ๊กครบทุกข้อ:
            </p>

            {/* Checklist */}
            <div className="space-y-3">
              {RECEIVE_CHECKLIST.map((item, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checklist[i]}
                    onChange={(e) => {
                      const next = [...checklist];
                      next[i] = e.target.checked;
                      setChecklist(next);
                    }}
                    className="w-4 h-4 accent-[#FF663A] shrink-0"
                  />
                  <span
                    className={`text-sm leading-snug ${
                      checklist[i] ? "text-gray-800 font-medium" : "text-gray-500"
                    }`}
                  >
                    {item}
                  </span>
                </label>
              ))}
            </div>

            {/* Warning if not all checked */}
            {!checklistAllDone && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                ⚠️ กรุณาติ๊กครบทุกข้อก่อนยืนยัน
              </p>
            )}

            {/* Escrow info */}
            <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700">
              💰 พักเงินกลาง (Escrow) {order.totalPoints.toLocaleString()} พอยต์ จะถูกปล่อยให้ผู้ขายทันที
              (หักค่าธรรมเนียม {order.platformFee.toLocaleString()} พอยต์ · ผู้ขายได้{" "}
              {order.netToSeller.toLocaleString()} พอยต์)
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleReceive}
                disabled={!checklistAllDone || receiving}
                className="flex-1 bg-[#FF663A] hover:bg-[#F04E20] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {receiving ? "กำลังยืนยัน…" : "✅ ยืนยันรับของ"}
              </button>
              <button
                onClick={() => {
                  setShowReceiveModal(false);
                  setChecklist(RECEIVE_CHECKLIST.map(() => false));
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── D-6: Warranty + Return links (buyer, received stage) ─────────────── */}
      {role === "buyer" && order.stage === "received" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-blue-800">🛡️ ข้อมูลการรับประกัน (D-6)</p>
          <div className="flex gap-2">
            <Link
              href={`/parts/my-orders/${id}/warranty`}
              className="flex-1 text-center py-2 border border-blue-400 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
            >
              ดูประกัน
            </Link>
            <Link
              href={`/parts/my-orders/${id}/return`}
              className="flex-1 text-center py-2 border border-orange-400 text-orange-600 rounded-lg text-xs font-medium hover:bg-orange-50 transition-colors"
            >
              แจ้งคืน/เคลม
            </Link>
          </div>
        </div>
      )}

      {/* ── D-6: Inventory Import Prompt (seller, received stage) ─────────────── */}
      {role === "seller" && order.stage === "received" && (
        <InventoryImportPrompt orderId={id} partName={order.partName} qty={order.quantity} />
      )}

      {/* ── P8/P9: Cancel Modal ───────────────────────────────────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
            <h2 className="font-bold text-gray-900">
              🚫 {role === "buyer" ? "ยกเลิกคำสั่งซื้อ (P8)" : "ยกเลิกออเดอร์ (P9)"}
            </h2>
            <p className="text-sm text-gray-600">
              {role === "buyer"
                ? "ออเดอร์ยังรอผู้ขายรับ — สามารถยกเลิกได้"
                : "ยกเลิกก่อนจัดส่ง — พักเงินกลาง (Escrow) จะถูกคืนให้ผู้ซื้อ"}
            </p>

            <div className="bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-700">
              💰 คะแนน {order.totalPoints.toLocaleString()} พอยต์
              จะถูกคืนให้ผู้ซื้อ ({order.buyerShopName}) ทันที
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">
                เหตุผลการยกเลิก <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="ระบุเหตุผลการยกเลิก…"
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
              />
              {!cancelReason.trim() && (
                <p className="text-xs text-red-500 mt-1">⚠️ กรุณากรอกเหตุผลก่อนยืนยัน</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim() || cancelling}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {cancelling ? "กำลังยกเลิก…" : "🚫 ยืนยันยกเลิก"}
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                ย้อนกลับ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
