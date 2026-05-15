"use client";
import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { partsOrdersApi } from "@/lib/api";
import type { PartsOrderDetailDto, PartsOrderStatus } from "@/lib/types";

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<PartsOrderStatus, string> = {
  pending:   "รอยืนยัน",
  held:      "ถือเงินแล้ว",
  fulfilled: "ส่งของแล้ว",
  closed:    "รับของแล้ว",
  disputed:  "มีข้อพิพาท",
  resolved:  "แก้ไขแล้ว",
  refunded:  "คืนเงิน",
  cancelled: "ยกเลิก",
};

const STATUS_COLORS: Record<PartsOrderStatus, string> = {
  pending:   "bg-gray-800 border-gray-600 text-gray-300",
  held:      "bg-blue-900/40 border-blue-700 text-blue-300",
  fulfilled: "bg-yellow-900/40 border-yellow-700 text-yellow-300",
  closed:    "bg-green-900/40 border-green-700 text-green-300",
  disputed:  "bg-red-900/40 border-red-700 text-red-300",
  resolved:  "bg-purple-900/40 border-purple-700 text-purple-300",
  refunded:  "bg-teal-900/40 border-teal-700 text-teal-300",
  cancelled: "bg-gray-900/40 border-gray-700 text-gray-500",
};

const EVENT_LABELS: Record<string, string> = {
  created:         "🆕 สร้างออเดอร์",
  held:            "🔒 ล็อกเงิน escrow",
  fulfilled:       "📦 seller ส่งของแล้ว",
  closed:          "✅ buyer ยืนยันรับของ",
  disputed:        "⚠️ แจ้งข้อพิพาท",
  resolved_buyer:  "🔓 แก้ไขเพื่อ buyer",
  resolved_seller: "🔓 แก้ไขเพื่อ seller",
  refunded:        "💸 คืนเงิน",
  rated:           "⭐ ให้คะแนน",
  cancelled:       "❌ ยกเลิก",
};

// ── Main component ─────────────────────────────────────────────────────────────

export default function PartsOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState<PartsOrderDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  // Close order
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  // Dispute
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);

  // Rating
  const [showRate, setShowRate] = useState(false);
  const [rateScore, setRateScore] = useState(5);
  const [rateComment, setRateComment] = useState("");
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setApiError(false);
    partsOrdersApi
      .getOrder(id)
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => {
        setApiError(true);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleClose = useCallback(async () => {
    if (!order) return;
    setCloseLoading(true);
    setCloseError(null);
    try {
      await partsOrdersApi.closeOrder(order.id);
      load(); // refresh
    } catch (e) {
      setCloseError(String(e));
    } finally {
      setCloseLoading(false);
    }
  }, [order, load]);

  const handleDispute = useCallback(async () => {
    if (!order || disputeReason.trim().length < 10) {
      setDisputeError("กรุณาระบุเหตุผลอย่างน้อย 10 ตัวอักษร");
      return;
    }
    setDisputeLoading(true);
    setDisputeError(null);
    try {
      await partsOrdersApi.disputeOrder(order.id, disputeReason.trim());
      setShowDispute(false);
      setDisputeReason("");
      load();
    } catch (e) {
      setDisputeError(String(e));
    } finally {
      setDisputeLoading(false);
    }
  }, [order, disputeReason, load]);

  const handleRate = useCallback(async () => {
    if (!order) return;
    setRateLoading(true);
    setRateError(null);
    try {
      await partsOrdersApi.rateOrder(
        order.id,
        rateScore,
        rateComment.trim() || undefined
      );
      setShowRate(false);
      load();
    } catch (e) {
      setRateError(String(e));
    } finally {
      setRateLoading(false);
    }
  }, [order, rateScore, rateComment, load]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="sticky top-[41px] bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white text-lg"
        >
          ←
        </button>
        <h1 className="font-bold text-white">
          {loading ? "ออเดอร์อะไหล่" : order ? `ออเดอร์ #${order.id.slice(0, 8)}` : "ไม่พบออเดอร์"}
        </h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3 animate-pulse">
            <div className="bg-gray-800 rounded-xl h-28" />
            <div className="bg-gray-800 rounded-xl h-20" />
            <div className="bg-gray-800 rounded-xl h-16" />
          </div>
        )}

        {/* Error */}
        {!loading && apiError && (
          <div className="text-center py-12 space-y-2">
            <p className="text-3xl">🔩</p>
            <p className="text-gray-400 text-sm">ไม่สามารถโหลดข้อมูลออเดอร์ได้</p>
            <button
              onClick={load}
              className="text-orange-400 text-xs underline mt-2"
            >
              ลองใหม่
            </button>
          </div>
        )}

        {/* Order detail */}
        {!loading && order && (
          <>
            {/* Status + summary */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">สถานะออเดอร์</p>
                <span
                  className={`text-xs px-3 py-1 rounded-full border font-medium ${STATUS_COLORS[order.status]}`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-gray-900 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">จำนวน</p>
                  <p className="text-white font-bold">{order.quantity} ชิ้น</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">ราคา/หน่วย</p>
                  <p className="text-orange-400 font-bold">
                    ฿{parseFloat(order.unitPriceThb).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-900 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-gray-500 mb-1">ยอดรวม</p>
                  <p className="text-orange-400 font-bold text-xl">
                    ฿{parseFloat(order.totalThb).toLocaleString()}
                  </p>
                </div>
              </div>

              {order.serviceId && (
                <div className="border-t border-gray-700 pt-3">
                  <p className="text-xs text-gray-500 mb-0.5">เชื่อมกับงาน</p>
                  <p className="text-sm text-blue-300 font-mono">{order.serviceId}</p>
                </div>
              )}

              {order.trackingNumber && (
                <div className="border-t border-gray-700 pt-3">
                  <p className="text-xs text-gray-500 mb-0.5">Tracking</p>
                  <p className="text-sm text-white font-mono">{order.trackingNumber}</p>
                </div>
              )}

              {order.fulfillmentNote && (
                <div className="border-t border-gray-700 pt-3">
                  <p className="text-xs text-gray-500 mb-0.5">หมายเหตุการส่งของ</p>
                  <p className="text-sm text-gray-300">{order.fulfillmentNote}</p>
                </div>
              )}

              <div className="border-t border-gray-700 pt-3 text-xs text-gray-600 space-y-0.5">
                <p>สร้าง: {new Date(order.createdAt).toLocaleString("th-TH")}</p>
                {order.fulfilledAt && (
                  <p>ส่งของ: {new Date(order.fulfilledAt).toLocaleString("th-TH")}</p>
                )}
                {order.closedAt && (
                  <p>ปิด: {new Date(order.closedAt).toLocaleString("th-TH")}</p>
                )}
              </div>
            </div>

            {/* ── Buyer Actions ─────────────────────────────────────────── */}

            {/* Close order (ยืนยันรับของ) */}
            {order.status === "fulfilled" && (
              <div className="bg-gray-800 border border-green-800/40 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-white">✅ ยืนยันรับของ</p>
                <p className="text-xs text-gray-400">
                  กดเมื่อได้รับอะไหล่แล้ว — escrow จะปล่อยเงินให้ seller
                </p>
                {closeError && (
                  <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/50 rounded-lg px-3 py-2">
                    ⚠️ {closeError}
                  </p>
                )}
                <button
                  onClick={handleClose}
                  disabled={closeLoading}
                  className="w-full py-3 rounded-xl bg-green-700 hover:bg-green-600 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {closeLoading ? "กำลังยืนยัน..." : "✅ ยืนยันรับของแล้ว"}
                </button>
              </div>
            )}

            {/* Rate seller (ให้คะแนน) */}
            {order.status === "closed" && !order.rating && (
              <div className="bg-gray-800 border border-yellow-800/40 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-white">⭐ ให้คะแนน seller</p>
                {!showRate ? (
                  <button
                    onClick={() => setShowRate(true)}
                    className="w-full py-2.5 rounded-xl bg-yellow-700 hover:bg-yellow-600 text-white font-medium text-sm transition-colors"
                  >
                    ⭐ ให้คะแนน
                  </button>
                ) : (
                  <div className="space-y-3">
                    {/* Star selector */}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400">คะแนน (1–5 ดาว)</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setRateScore(s)}
                            className={`text-2xl transition-opacity ${s <= rateScore ? "opacity-100" : "opacity-30"}`}
                          >
                            ⭐
                          </button>
                        ))}
                        <span className="text-white font-bold ml-2 self-center">{rateScore}/5</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-400">ความคิดเห็น (ไม่บังคับ)</label>
                      <textarea
                        value={rateComment}
                        onChange={(e) => setRateComment(e.target.value)}
                        rows={2}
                        placeholder="รีวิวสั้นๆ..."
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 resize-none"
                      />
                    </div>

                    {rateError && (
                      <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/50 rounded-lg px-3 py-2">
                        ⚠️ {rateError}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowRate(false); setRateError(null); }}
                        className="flex-1 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={handleRate}
                        disabled={rateLoading}
                        className="flex-1 py-2.5 rounded-xl bg-yellow-700 hover:bg-yellow-600 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                      >
                        {rateLoading ? "กำลังส่ง..." : "ส่งคะแนน"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dispute button (held / fulfilled) */}
            {(order.status === "held" || order.status === "fulfilled") && !order.dispute && (
              <div className="bg-gray-800 border border-red-900/30 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-white">⚠️ แจ้งข้อพิพาท</p>
                {!showDispute ? (
                  <button
                    onClick={() => setShowDispute(true)}
                    className="w-full py-2.5 rounded-xl bg-red-900/50 hover:bg-red-800/60 text-red-300 font-medium text-sm border border-red-800/50 transition-colors"
                  >
                    แจ้งปัญหากับออเดอร์นี้
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400">
                        เหตุผล (อย่างน้อย 10 ตัวอักษร)
                      </label>
                      <textarea
                        value={disputeReason}
                        onChange={(e) => {
                          setDisputeReason(e.target.value);
                          setDisputeError(null);
                        }}
                        rows={3}
                        placeholder="อธิบายปัญหาที่พบ เช่น ไม่ได้รับของ, ของผิด, ของชำรุด..."
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500 resize-none"
                      />
                      <p className="text-xs text-gray-600 text-right">
                        {disputeReason.trim().length}/10 ตัวอักษรขั้นต่ำ
                      </p>
                    </div>

                    {disputeError && (
                      <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/50 rounded-lg px-3 py-2">
                        ⚠️ {disputeError}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowDispute(false); setDisputeReason(""); setDisputeError(null); }}
                        className="flex-1 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={handleDispute}
                        disabled={disputeLoading || disputeReason.trim().length < 10}
                        className="flex-1 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                      >
                        {disputeLoading ? "กำลังส่ง..." : "ส่งข้อพิพาท"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Rating display (if already rated) ─────────────────────── */}
            {order.rating && (
              <div className="bg-gray-800 border border-yellow-800/30 rounded-xl p-4 space-y-2">
                <p className="text-xs text-gray-500">คะแนนที่ให้ไว้</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{"⭐".repeat(order.rating.score)}</span>
                  <span className="text-white font-bold">{order.rating.score}/5</span>
                </div>
                {order.rating.comment && (
                  <p className="text-sm text-gray-300">{order.rating.comment}</p>
                )}
              </div>
            )}

            {/* ── Dispute display ────────────────────────────────────────── */}
            {order.dispute && (
              <div className="bg-red-950/20 border border-red-800/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-red-300">⚠️ ข้อพิพาท</p>
                  <span className="text-xs text-gray-500">{order.dispute.status}</span>
                </div>
                <p className="text-sm text-gray-300">{order.dispute.reason}</p>
                {order.dispute.resolution && (
                  <div className="mt-2 pt-2 border-t border-red-900/40">
                    <p className="text-xs text-gray-500 mb-0.5">ผลการแก้ไข</p>
                    <p className="text-sm text-purple-300">{order.dispute.resolution}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Audit trail ───────────────────────────────────────────── */}
            {order.events.length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  ประวัติออเดอร์
                </p>
                <div className="space-y-2">
                  {[...order.events].reverse().map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="flex-1">
                        <p className="text-white text-xs">
                          {EVENT_LABELS[ev.eventType] ?? ev.eventType}
                        </p>
                        {ev.detail && (
                          <p className="text-gray-500 text-xs mt-0.5 truncate">{ev.detail}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 whitespace-nowrap">
                        {new Date(ev.createdAt).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Part ID (small reference) ─────────────────────────────── */}
            <div className="text-center">
              <p className="text-xs text-gray-700 font-mono">
                Order ID: {order.id}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
