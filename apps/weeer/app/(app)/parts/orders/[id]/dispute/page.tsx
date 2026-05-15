"use client";
// ── Parts B2B Dispute — WeeeR (Sub-CMD-9 Wave 3, W3 Carry-over) ──────────────
// Buyer แจ้งปัญหา: POST /api/v1/parts/orders/:id/dispute/
// เงื่อนไข: order ต้องอยู่ใน status = held | fulfilled เท่านั้น

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getPartsOrderDetail,
  raiseDispute,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
} from "../../../../../../lib/parts-api";
import type { PartsOrderDetailDto } from "../../../../../../lib/parts-api";

const DISPUTABLE_STATUSES = ["held", "fulfilled"] as const;
type DisputableStatus = typeof DISPUTABLE_STATUSES[number];

export default function DisputePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = params.id;

  const [order, setOrder]     = useState<PartsOrderDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const detail = await getPartsOrderDetail(orderId);
        setOrder(detail);
      } catch {
        setError("ไม่พบคำสั่งซื้อนี้");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setError("กรุณาระบุเหตุผลอย่างน้อย 10 ตัวอักษร");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await raiseDispute(orderId, reason.trim());
      setSuccess(true);
      setTimeout(() => router.push("/parts/orders"), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "แจ้งปัญหาล้มเหลว");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-400">กำลังโหลด…</div>;
  }

  if (error && !order) {
    return (
      <div className="max-w-lg space-y-4">
        <Link href="/parts/orders" className="text-sm text-gray-400 hover:text-gray-600">← คำสั่งซื้อ</Link>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!order) return null;

  const canDispute = (DISPUTABLE_STATUSES as readonly string[]).includes(order.status);
  const statusLabel = ORDER_STATUS_LABEL[order.status];
  const statusColor = ORDER_STATUS_COLOR[order.status];

  if (!canDispute) {
    return (
      <div className="max-w-lg space-y-4">
        <Link href="/parts/orders" className="text-sm text-gray-400 hover:text-gray-600">← คำสั่งซื้อ</Link>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
          <h1 className="text-lg font-bold text-gray-900">⚠️ แจ้งปัญหา</h1>
          <p className="text-sm text-gray-600">
            ไม่สามารถแจ้งปัญหาได้ — คำสั่งซื้อนี้อยู่ในสถานะ{" "}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
              {statusLabel}
            </span>
          </p>
          <p className="text-xs text-gray-400">แจ้งปัญหาได้เฉพาะ order ที่อยู่ในสถานะ ถือ Escrow หรือ ส่งของแล้ว</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg space-y-4">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center space-y-2">
          <div className="text-4xl">✅</div>
          <p className="text-sm font-medium text-green-800">แจ้งปัญหาสำเร็จแล้ว</p>
          <p className="text-xs text-green-600">Admin จะตรวจสอบและติดต่อกลับ — กำลังกลับสู่คำสั่งซื้อ…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/parts/orders" className="text-sm text-gray-400 hover:text-gray-600">← คำสั่งซื้อ</Link>
        <h1 className="text-xl font-bold text-gray-900">⚠️ แจ้งปัญหา</h1>
      </div>

      {/* Order summary */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono text-gray-400">#{order.id.slice(0, 8)}…</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <p className="text-sm text-gray-700">
          {order.quantity} ชิ้น × {Number(order.unitPriceThb).toLocaleString()} บาท
          {" = "}
          <span className="font-bold text-green-700">{Number(order.totalThb).toLocaleString()} บาท</span>
        </p>
        {order.trackingNumber && (
          <p className="text-xs text-gray-500">📦 Tracking: <span className="font-mono">{order.trackingNumber}</span></p>
        )}
      </div>

      {/* Dispute form */}
      <form onSubmit={(e) => void handleSubmit(e)} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            เหตุผลการแจ้งปัญหา <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="อธิบายปัญหาที่พบ เช่น ไม่ได้รับสินค้า, สินค้าเสียหาย, ไม่ตรงตามที่สั่ง… (อย่างน้อย 10 ตัวอักษร)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{reason.length}/1000</p>
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            ⚠️ {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/parts/orders"
            className="flex-1 text-center border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl px-4 py-2.5 transition-colors"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={submitting || reason.trim().length < 10}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl px-4 py-2.5 transition-colors disabled:opacity-60"
          >
            {submitting ? "กำลังส่ง…" : "⚠️ ส่งคำร้อง"}
          </button>
        </div>
      </form>
    </div>
  );
}
