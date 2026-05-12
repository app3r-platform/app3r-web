"use client";
// ─── CheckoutButton (D89) — 2C2P Payment Intent → Redirect ────────────────────
// NOTE-D89-2: WeeeU = customer เท่านั้น — ไม่มี withdrawal UI

import { useState } from "react";
import { getAdapter } from "@/lib/dal";

interface Props {
  serviceId: string;
  amount: number;      // บาท
  description?: string;
  onSuccess?: (intentId: string) => void;
  onError?: (msg: string) => void;
}

export function CheckoutButton({ serviceId, amount, description, onSuccess, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      const dal = getAdapter();
      const result = await dal.payment.createIntent({
        serviceId,
        amount,
        currency: "THB",
        description,
      });
      if (!result.ok) throw new Error(result.error);

      const { intentId, checkoutUrl } = result.data;
      // บันทึก intentId ไว้ตรวจสอบ status ตอน return
      sessionStorage.setItem("payment_intent_id", intentId);

      onSuccess?.(intentId);
      // Redirect ไป 2C2P checkout (หรือ mock URL ใน Phase C)
      window.location.href = checkoutUrl;

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการชำระเงิน";
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Amount display */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
        <p className="text-xs text-indigo-500 mb-1">ยอดชำระ</p>
        <p className="text-2xl font-bold text-indigo-700">
          ฿{amount.toLocaleString("th-TH")}
        </p>
        {description && (
          <p className="text-xs text-indigo-400 mt-1">{description}</p>
        )}
      </div>

      {/* Checkout button */}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors"
      >
        {loading ? (
          "กำลังดำเนินการ..."
        ) : (
          <>
            💳 ชำระเงิน {amount.toLocaleString("th-TH")} บาท
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 text-center bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <p className="text-xs text-gray-400 text-center">
        ชำระผ่าน 2C2P — ปลอดภัยด้วย SSL
      </p>
    </div>
  );
}

// ─── PaymentStatusCard — แสดงผลหลัง redirect กลับมา ──────────────────────────

export function PaymentStatusCard({ intentId }: { intentId: string }) {
  const [status, setStatus] = useState<"loading" | "paid" | "failed" | "pending">("loading");

  const STATUS_CONFIG = {
    loading: { icon: "⏳", label: "กำลังตรวจสอบ...", cls: "bg-gray-50 text-gray-600" },
    paid:    { icon: "✅", label: "ชำระเงินสำเร็จ",  cls: "bg-green-50 text-green-700" },
    failed:  { icon: "❌", label: "ชำระเงินไม่สำเร็จ", cls: "bg-red-50 text-red-700" },
    pending: { icon: "⏳", label: "รอการยืนยัน",     cls: "bg-yellow-50 text-yellow-700" },
  };

  // ตรวจสอบ status จาก DAL
  const cfg = STATUS_CONFIG[status];

  return (
    <div className={`rounded-2xl border p-5 text-center space-y-2 ${cfg.cls}`}>
      <p className="text-3xl">{cfg.icon}</p>
      <p className="font-semibold text-sm">{cfg.label}</p>
      <p className="text-xs opacity-70">Intent ID: {intentId}</p>
    </div>
  );
}
