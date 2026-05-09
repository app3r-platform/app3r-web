"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

type TransactionData = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  appliance_name: string;
  buyer_name: string;
  seller_name: string;
  agreed_price: number;
  delivery_method: string;
  status: string;
  tracking_number?: string;
  courier?: string;
  delivered_at?: string;
  inspection_deadline?: string;
  completed_at?: string;
  is_buyer: boolean;
};

const STEPS: { key: string; label: string; icon: string }[] = [
  { key: "offer_selected", label: "เลือกข้อเสนอ", icon: "🤝" },
  { key: "buyer_confirmed", label: "ผู้ซื้อยืนยัน", icon: "✅" },
  { key: "in_progress", label: "กำลังจัดส่ง", icon: "📦" },
  { key: "delivered", label: "ส่งถึงแล้ว", icon: "🏠" },
  { key: "inspection_period", label: "ช่วงตรวจสอบ", icon: "🔍" },
  { key: "completed", label: "เสร็จสมบูรณ์", icon: "🎉" },
];

const STEP_ORDER = STEPS.map(s => s.key);

const DELIVERY_LABEL: Record<string, string> = {
  on_site: "ส่งเอง / นัดรับ",
  parcel: "ส่งพัสดุ (ขนส่ง)",
};

const COURIER_LABEL: Record<string, string> = {
  kerry: "Kerry Express",
  flash: "Flash Express",
  jandt: "J&T Express",
};

export default function TransactionPage() {
  const { id } = useParams<{ id: string }>();
  const [tx, setTx] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const load = () => {
    apiFetch(`/api/v1/transactions/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { setError("ไม่พบข้อมูลธุรกรรม"); return; }
        setTx(d);
        if (d.status === "completed") setConfirmed(true);
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลได้"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleConfirmReceived = async () => {
    setConfirming(true);
    setError("");
    try {
      const res = await apiFetch(`/api/v1/transactions/${id}/confirm-received/`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      setConfirmed(true);
      load();
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;
  if (error && !tx) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">📋</p>
      <p className="text-gray-600 font-medium">{error}</p>
      <Link href="/sell" className="mt-3 inline-block text-indigo-600 text-sm font-medium hover:underline">← กลับรายการขาย</Link>
    </div>
  );
  if (!tx) return null;

  const currentStepIdx = STEP_ORDER.indexOf(tx.status);

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/sell" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">สถานะธุรกรรม</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">สรุปธุรกรรม</p>
        <InfoRow label="สินค้า" value={tx.appliance_name} />
        <InfoRow label="ผู้ขาย" value={tx.seller_name} />
        <InfoRow label="ผู้ซื้อ" value={tx.buyer_name} />
        <InfoRow label="ราคาที่ตกลง" value={`${tx.agreed_price.toLocaleString()} ฿`} bold />
        <InfoRow label="จัดส่ง" value={DELIVERY_LABEL[tx.delivery_method] ?? tx.delivery_method} />
        {tx.courier && <InfoRow label="บริษัทขนส่ง" value={COURIER_LABEL[tx.courier] ?? tx.courier} />}
        {tx.tracking_number && (
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-gray-500 shrink-0">Tracking</p>
            <p className="text-sm font-mono font-bold text-indigo-600 text-right">{tx.tracking_number}</p>
          </div>
        )}
      </div>

      {/* State machine timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ความคืบหน้า</p>
        <div className="space-y-0">
          {STEPS.map((step, i) => {
            const done = currentStepIdx >= i;
            const active = currentStepIdx === i;
            const isLast = i === STEPS.length - 1;
            return (
              <div key={step.key} className="flex gap-3">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 ${
                    done ? "bg-indigo-600" : "bg-gray-100"
                  }`}>
                    {done ? <span className="text-white text-xs">{step.icon}</span> : <span className="text-gray-400 text-xs">{step.icon}</span>}
                  </div>
                  {!isLast && <div className={`w-0.5 h-6 ${done && currentStepIdx > i ? "bg-indigo-200" : "bg-gray-100"}`} />}
                </div>
                {/* Label */}
                <div className={`pb-4 pt-1 ${isLast ? "" : ""}`}>
                  <p className={`text-sm font-medium ${active ? "text-indigo-700" : done ? "text-gray-700" : "text-gray-400"}`}>
                    {step.label}
                    {active && <span className="ml-2 text-xs text-indigo-500">(ปัจจุบัน)</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inspection deadline */}
      {tx.status === "inspection_period" && tx.inspection_deadline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-yellow-800">⏰ ช่วงตรวจสอบ</p>
          <p className="text-xs text-yellow-700 mt-1">
            กรุณายืนยันรับสินค้าก่อน {new Date(tx.inspection_deadline).toLocaleDateString("th-TH")}
          </p>
        </div>
      )}

      {/* Buyer confirm receipt button */}
      {tx.is_buyer && tx.status === "inspection_period" && !confirmed && (
        <button
          onClick={handleConfirmReceived}
          disabled={confirming}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
        >
          {confirming ? <><span className="animate-spin">⟳</span> กำลังยืนยัน...</> : "✅ ยืนยันรับสินค้าแล้ว"}
        </button>
      )}

      {/* Completed state */}
      {confirmed && tx.status === "completed" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center space-y-2">
          <p className="text-4xl">🎉</p>
          <p className="text-sm font-semibold text-green-800">ธุรกรรมเสร็จสมบูรณ์!</p>
          <p className="text-xs text-green-600">ขอบคุณที่ใช้งาน WeeeU</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2">
        <Link
          href={`/listings/${tx.listing_id}`}
          className="flex-1 text-center border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
        >
          ดูประกาศ
        </Link>
        <Link
          href="/sell"
          className="flex-1 text-center border border-indigo-200 text-indigo-600 font-medium py-2.5 rounded-xl text-sm hover:bg-indigo-50 transition-colors"
        >
          รายการขายของฉัน
        </Link>
      </div>
    </div>
  );
}

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-gray-500 shrink-0">{label}</p>
      <p className={`text-sm text-right ${bold ? "font-bold text-indigo-600" : "font-medium text-gray-800"}`}>{value}</p>
    </div>
  );
}
