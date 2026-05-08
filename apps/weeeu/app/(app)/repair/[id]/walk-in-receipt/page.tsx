"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

type ReceiptData = {
  id: string;
  receipt_code: string;
  appliance_name: string;
  issue_summary: string;
  weeer_name: string;
  weeer_address: string;
  weeer_phone: string;
  weeer_open_hours: string;
  inspection_fee: number;
  created_at: string;
  storage_fee_per_day: number | null;
  pickup_deadline_days: number | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function WalkInReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/api/v1/repair/jobs/${id}/receipt`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { setError("ไม่พบข้อมูล Receipt"); return; }
        setReceipt({
          id: d.id,
          receipt_code: d.receipt_code ?? d.id.slice(0, 8).toUpperCase(),
          appliance_name: d.appliance_name,
          issue_summary: d.issue_summary,
          weeer_name: d.weeer_name,
          weeer_address: d.weeer_address ?? "",
          weeer_phone: d.weeer_phone ?? "",
          weeer_open_hours: d.weeer_open_hours ?? "",
          inspection_fee: d.inspection_fee ?? 100,
          created_at: d.created_at,
          storage_fee_per_day: d.storage_fee_per_day ?? null,
          pickup_deadline_days: d.pickup_deadline_days ?? null,
        });
      })
      .catch(() => setError("ไม่สามารถโหลด Receipt ได้"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;

  if (error || !receipt) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">🔍</p>
      <p className="text-gray-600 font-medium">{error || "ไม่พบข้อมูล"}</p>
      <Link href="/repair" className="mt-3 inline-block text-blue-600 text-sm font-medium hover:underline">← กลับรายการ</Link>
    </div>
  );

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/repair" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">ใบรับเครื่อง (Walk-in)</h1>
      </div>

      {/* Success banner */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
        <p className="text-3xl mb-2">✅</p>
        <p className="text-sm font-semibold text-green-800">คำขอ Walk-in สำเร็จแล้ว!</p>
        <p className="text-xs text-green-600 mt-1">แสดง Receipt code นี้เมื่อนำเครื่องไปที่ร้าน</p>
      </div>

      {/* Receipt code — large and prominent */}
      <div className="bg-white rounded-2xl border-2 border-green-300 shadow-sm p-6 text-center space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Receipt Code</p>
        <p className="text-4xl font-bold tracking-[0.25em] text-gray-900 font-mono">
          {receipt.receipt_code}
        </p>
        <div className="bg-gray-100 rounded-xl p-6 flex items-center justify-center">
          {/* QR placeholder */}
          <div className="text-center">
            <p className="text-5xl mb-2">⬛</p>
            <p className="text-xs text-gray-400">QR Code</p>
          </div>
        </div>
        <p className="text-xs text-gray-400">สร้างเมื่อ {formatDate(receipt.created_at)}</p>
      </div>

      {/* Device info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">เครื่องที่แจ้งซ่อม</p>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">เครื่อง</span>
          <span className="font-medium text-gray-800">{receipt.appliance_name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">อาการ</span>
          <span className="font-medium text-gray-800 text-right max-w-[60%]">{receipt.issue_summary}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">ค่าตรวจ</span>
          <span className="font-medium text-gray-800">{receipt.inspection_fee.toLocaleString()} Point</span>
        </div>
      </div>

      {/* Shop info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลร้านซ่อม</p>
        <p className="font-semibold text-gray-900">{receipt.weeer_name}</p>
        {receipt.weeer_address && (
          <div className="flex gap-2 text-sm text-gray-600">
            <span>📍</span>
            <span>{receipt.weeer_address}</span>
          </div>
        )}
        {receipt.weeer_phone && (
          <div className="flex gap-2 text-sm text-gray-600">
            <span>📞</span>
            <a href={`tel:${receipt.weeer_phone}`} className="text-blue-600 hover:underline">
              {receipt.weeer_phone}
            </a>
          </div>
        )}
        {receipt.weeer_open_hours && (
          <div className="flex gap-2 text-sm text-gray-600">
            <span>🕐</span>
            <span>{receipt.weeer_open_hours}</span>
          </div>
        )}
      </div>

      {/* Storage fee notice */}
      {receipt.storage_fee_per_day && receipt.pickup_deadline_days && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800">⏳ กรุณารับเครื่องภายใน {receipt.pickup_deadline_days} วัน</p>
          <p className="text-xs text-amber-600 mt-1">
            หากเกินกำหนด จะมีค่าฝากเครื่อง {receipt.storage_fee_per_day.toLocaleString()} Point/วัน
            จนกว่าจะมารับ
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
        <p className="text-sm font-semibold text-blue-800">📋 ขั้นตอนต่อไป</p>
        <ol className="space-y-1.5 pl-1">
          {[
            "นำเครื่องและ Receipt code ไปที่ร้านซ่อม",
            "ร้านจะตรวจสอบและประเมินราคา",
            "รอการแจ้งเตือนผลการตรวจ",
            "อนุมัติราคา → รับเครื่องเมื่อซ่อมเสร็จ",
          ].map((step, i) => (
            <li key={i} className="flex gap-2 text-xs text-blue-700">
              <span className="font-bold shrink-0">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <Link
          href={`/repair/${id}`}
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-2xl text-sm text-center transition-colors"
        >
          📊 ติดตามสถานะงานซ่อม
        </Link>
        <Link
          href="/repair"
          className="block w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-3 rounded-2xl text-sm text-center transition-colors"
        >
          กลับรายการงานซ่อม
        </Link>
      </div>
    </div>
  );
}
