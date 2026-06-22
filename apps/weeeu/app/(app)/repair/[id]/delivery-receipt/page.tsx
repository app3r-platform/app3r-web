"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { SEED_JOB_COMPLETION_OTP, JOB_COMPLETION_OTP_LENGTH } from "@/lib/mock-data/repair-receipt";

type DeliveryReceiptData = {
  id: string;
  appliance_name: string;
  weeer_name: string;
  weeet_name: string;
  delivered_at: string | null;
  final_price: number | null;
  inspection_fee: number;
  post_repair_notes: string;
  post_repair_photos: { url: string }[];
  weeet_closed_at: string | null; // B4 ปิดงาน + ออก OTP (แทนลายเซ็น · SoT Gen 57)
  customer_confirmed: boolean;
};

const MOCK_DELIVERY_RECEIPT: DeliveryReceiptData = {
  id: "mock-job-001",
  appliance_name: "เครื่องซักผ้า Samsung",
  weeer_name: "ร้านซ่อมดีเจริญ",
  weeet_name: "สมชาย ช่างดี",
  delivered_at: "2026-05-25T10:00:00.000Z",
  final_price: 800,
  inspection_fee: 150,
  post_repair_notes: "เปลี่ยนปั๊มน้ำและทำความสะอาดระบบ ทดสอบการทำงานเรียบร้อย",
  post_repair_photos: [],
  weeet_closed_at: "2026-05-25T09:50:00.000Z",
  customer_confirmed: false,
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function DeliveryReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [receipt, setReceipt] = useState<DeliveryReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  // REP-C09 — OTP เข้ารับเครื่อง (แทนลายเซ็น · SoT Gen 57). WeeeT ออก OTP ตอนปิดงาน B4,
  // ลูกค้ากรอกที่นี่ → mock match เทียบ SEED_JOB_COMPLETION_OTP. verify จริง = backend (deferred).
  const [otp, setOtp] = useState("");

  useEffect(() => {
    apiFetch(`/api/v1/repair/jobs/${id}/delivery-receipt`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { setError("ไม่พบข้อมูล Delivery Receipt"); return; }
        setReceipt({
          id: d.id,
          appliance_name: d.appliance_name,
          weeer_name: d.weeer_name,
          weeet_name: d.weeet_name ?? "ช่าง",
          delivered_at: d.delivered_at ?? null,
          final_price: d.final_price ?? null,
          inspection_fee: d.inspection_fee ?? 0,
          post_repair_notes: d.post_repair_notes ?? "",
          post_repair_photos: d.post_repair_photos ?? [],
          weeet_closed_at: d.weeet_closed_at ?? d.weeet_signature_at ?? null,
          customer_confirmed: d.customer_confirmed ?? false,
        });
        if (d.customer_confirmed) setConfirmed(true);
      })
      .catch(() => { setReceipt(prev => prev ?? MOCK_DELIVERY_RECEIPT); })
      .finally(() => setLoading(false));
  }, [id]);

  const otpComplete = otp.length === JOB_COMPLETION_OTP_LENGTH;

  const handleConfirm = async () => {
    if (!otpComplete) { setError("กรุณากรอกรหัสยืนยัน (OTP) ให้ครบ 6 หลัก"); return; }
    // Mock check: เทียบ OTP ที่ช่างออกตอนปิดงาน (verify จริง = backend, deferred)
    if (otp !== SEED_JOB_COMPLETION_OTP) {
      setError("รหัสยืนยัน (OTP) ไม่ถูกต้อง — กรุณาตรวจสอบกับช่าง");
      return;
    }
    setConfirming(true);
    setError("");
    try {
      const res = await apiFetch(`/api/v1/repair/jobs/${id}/delivery-receipt/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_completion_otp: otp }),
      });
      if (!res.ok) throw new Error(await res.text());
      setConfirmed(true);
      // After confirm, redirect to review page
      setTimeout(() => router.push(`/repair/${id}/review`), 1500);
    } catch {
      setError("เกิดข้อผิดพลาดในการยืนยัน กรุณาลองใหม่");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;

  if (error && !receipt) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">🔍</p>
      <p className="text-gray-600 font-medium">{error}</p>
      <Link href="/repair" className="mt-3 inline-block text-weeeu-primary text-sm font-medium hover:underline">← กลับรายการ</Link>
    </div>
  );

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/repair/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">ใบส่งมอบเครื่อง (Delivery)</h1>
      </div>

      {confirmed ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center space-y-3">
          <p className="text-4xl">✅</p>
          <p className="text-sm font-semibold text-green-800">ยืนยันรับเครื่องเรียบร้อย!</p>
          <p className="text-xs text-green-600">กำลังไปหน้ารีวิว...</p>
        </div>
      ) : (
        <>
          <div className="bg-weeeu-surface border border-weeeu-primary/20 rounded-2xl p-4">
            <p className="text-sm font-semibold text-weeeu-text">🚛 ช่างส่งเครื่องคืนแล้ว — กรุณาตรวจรับ</p>
            <p className="text-xs text-weeeu-dark mt-1">ตรวจสอบงานซ่อมก่อนเซ็นรับ</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {receipt && (
            <>
              {/* Job summary */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">สรุปงาน</p>
                <InfoRow label="เครื่อง" value={receipt.appliance_name} />
                <InfoRow label="ช่าง" value={`${receipt.weeet_name} — ${receipt.weeer_name}`} />
                {receipt.delivered_at && <InfoRow label="เวลาส่ง" value={formatDate(receipt.delivered_at)} />}
              </div>

              {/* Price */}
              {receipt.final_price !== null && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ยอดที่หัก (พอยต์ทอง / Gold Point)</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ค่าซ่อม</span>
                    <span className="font-medium text-gray-800">{receipt.final_price.toLocaleString()} พอยต์ทอง</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ค่าตรวจ (Pickup)</span>
                    <span className="font-medium text-gray-800">{receipt.inspection_fee.toLocaleString()} พอยต์ทอง</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2">
                    <span className="text-gray-700">รวม</span>
                    <span className="text-weeeu-dark">
                      {(receipt.final_price + receipt.inspection_fee).toLocaleString()} พอยต์ทอง
                    </span>
                  </div>
                </div>
              )}

              {/* Post-repair notes */}
              {receipt.post_repair_notes && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">บันทึกการซ่อม</p>
                  <p className="text-sm text-gray-600">{receipt.post_repair_notes}</p>
                </div>
              )}

              {/* Post-repair photos */}
              {receipt.post_repair_photos.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    รูปหลังซ่อม ({receipt.post_repair_photos.length} รูป)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {receipt.post_repair_photos.map((f, i) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img key={i} src={f.url} alt="" className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
                    ))}
                  </div>
                </div>
              )}

              {/* WeeeT closed B4 — ปิดงาน + ออก OTP (แทนลายเซ็น) */}
              {receipt.weeet_closed_at && (
                <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <p className="text-xs text-gray-600">ช่างปิดงานและส่งรหัสยืนยันแล้ว — {formatDate(receipt.weeet_closed_at)}</p>
                </div>
              )}

              {/* REP-C09 — OTP เข้ารับเครื่อง (แทนลายเซ็น · SoT Gen 57) */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">รหัสยืนยันรับเครื่อง (OTP)</p>
                <p className="text-xs text-gray-500">ช่างจะแจ้งรหัส 6 หลักเมื่อปิดงาน — กรอกเพื่อยืนยันรับเครื่องคืน</p>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={JOB_COMPLETION_OTP_LENGTH}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, JOB_COMPLETION_OTP_LENGTH))}
                  placeholder="______"
                  aria-label="รหัสยืนยันรับเครื่อง (OTP)"
                  className="w-full text-center text-2xl font-bold tracking-[0.5em] border-2 border-gray-200 rounded-xl py-3 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-weeeu-primary"
                />
              </div>

              <button
                onClick={handleConfirm}
                disabled={confirming || !otpComplete}
                className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:bg-weeeu-primary/40 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {confirming ? <><span className="animate-spin">⟳</span> กำลังยืนยัน...</> : "✅ ยืนยันรับเครื่องคืน"}
              </button>

              <p className="text-xs text-center text-gray-400">
                หลังยืนยัน — ระบบจะหักพอยต์ทอง และเปิดหน้ารีวิว
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-gray-500 shrink-0">{label}</p>
      <p className="text-sm font-medium text-gray-800 text-right">{value}</p>
    </div>
  );
}
