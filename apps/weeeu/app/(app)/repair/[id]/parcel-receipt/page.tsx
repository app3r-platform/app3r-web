"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

type ParcelReceiptData = {
  id: string;
  appliance_name: string;
  weeer_name: string;
  courier_back: string | null;
  tracking_back: string | null;
  final_price: number | null;
  inspection_fee: number;
  post_repair_notes: string;
  post_repair_photos: { url: string }[];
  already_confirmed: boolean;
};

const COURIER_LABEL: Record<string, string> = {
  kerry: "Kerry Express",
  flash: "Flash Express",
  jandt: "J&T Express",
};

function formatCurrency(n: number) {
  return n.toLocaleString();
}

export default function ParcelReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ParcelReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [satisfied, setSatisfied] = useState<boolean | null>(null);
  const [complaintNotes, setComplaintNotes] = useState("");

  useEffect(() => {
    apiFetch(`/api/v1/repair/jobs/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { setError("ไม่พบข้อมูลงาน"); return; }
        setData({
          id: d.id,
          appliance_name: d.appliance_name,
          weeer_name: d.weeer_name,
          courier_back: d.courier_back ?? d.parcel_courier_back ?? null,
          tracking_back: d.tracking_back ?? d.parcel_tracking_back ?? null,
          final_price: d.final_price ?? null,
          inspection_fee: d.inspection_fee ?? 0,
          post_repair_notes: d.post_repair_notes ?? "",
          post_repair_photos: d.post_repair_photos ?? [],
          already_confirmed: d.parcel_confirmed ?? false,
        });
        if (d.parcel_confirmed) setConfirmed(true);
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลได้"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleConfirm = async () => {
    if (satisfied === null) { setError("กรุณาระบุความพึงพอใจ"); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/v1/repair/jobs/${id}/parcel-receipt/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          satisfied,
          complaint_notes: !satisfied ? complaintNotes : undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setConfirmed(true);
      setTimeout(() => router.push(`/repair/${id}/review`), 1500);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;

  if (error && !data) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">📦</p>
      <p className="text-gray-600 font-medium">{error}</p>
      <Link href={`/repair/${id}`} className="mt-3 inline-block text-blue-600 text-sm font-medium hover:underline">← กลับรายละเอียดงาน</Link>
    </div>
  );

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/repair/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">ยืนยันรับพัสดุคืน</h1>
      </div>

      {confirmed ? (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-center space-y-3">
          <p className="text-4xl">✅</p>
          <p className="text-sm font-semibold text-orange-800">ยืนยันรับพัสดุคืนแล้ว!</p>
          <p className="text-xs text-orange-600">กำลังไปหน้ารีวิว...</p>
        </div>
      ) : (
        <>
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-orange-800">📦 พัสดุถึงมือคุณแล้ว — กรุณาตรวจรับ</p>
            <p className="text-xs text-orange-600 mt-1">เปิดกล่องตรวจสอบเครื่องก่อนยืนยัน</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {data && (
            <>
              {/* Job summary */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">สรุปงาน</p>
                <InfoRow label="เครื่อง" value={data.appliance_name} />
                <InfoRow label="ร้านซ่อม" value={data.weeer_name} />
              </div>

              {/* Return tracking */}
              {data.tracking_back && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลพัสดุขากลับ</p>
                  <InfoRow label="บริษัทขนส่ง" value={COURIER_LABEL[data.courier_back ?? ""] ?? (data.courier_back ?? "—")} />
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-gray-500 shrink-0">Tracking</p>
                    <p className="text-sm font-mono font-bold text-orange-600 text-right">{data.tracking_back}</p>
                  </div>
                </div>
              )}

              {/* Price breakdown */}
              {data.final_price !== null && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ยอดที่หัก</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ค่าซ่อม</span>
                    <span className="font-medium text-gray-800">{formatCurrency(data.final_price)} Point</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ค่าตรวจ (Parcel)</span>
                    <span className="font-medium text-gray-800">{formatCurrency(data.inspection_fee)} Point</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2">
                    <span className="text-gray-700">รวม</span>
                    <span className="text-orange-600">{formatCurrency(data.final_price + data.inspection_fee)} Point</span>
                  </div>
                </div>
              )}

              {/* Post-repair notes */}
              {data.post_repair_notes && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">บันทึกการซ่อม</p>
                  <p className="text-sm text-gray-600">{data.post_repair_notes}</p>
                </div>
              )}

              {/* Post-repair photos */}
              {data.post_repair_photos.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    รูปหลังซ่อม ({data.post_repair_photos.length} รูป)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.post_repair_photos.map((f, i) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img key={i} src={f.url} alt="" className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
                    ))}
                  </div>
                </div>
              )}

              {/* Satisfaction */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ความพึงพอใจ <span className="text-red-500">*</span></p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSatisfied(true)}
                    className={`py-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      satisfied === true ? "bg-green-600 border-green-600 text-white" : "border-gray-200 text-gray-600 hover:border-green-300"
                    }`}
                  >
                    <span>😊</span> พึงพอใจ
                  </button>
                  <button
                    type="button"
                    onClick={() => setSatisfied(false)}
                    className={`py-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      satisfied === false ? "bg-red-500 border-red-500 text-white" : "border-gray-200 text-gray-600 hover:border-red-300"
                    }`}
                  >
                    <span>😞</span> ไม่พึงพอใจ
                  </button>
                </div>

                {/* Complaint notes — shown when dissatisfied */}
                {satisfied === false && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ระบุปัญหา / ข้อร้องเรียน</label>
                    <textarea
                      value={complaintNotes}
                      onChange={e => setComplaintNotes(e.target.value)}
                      placeholder="เช่น เครื่องยังมีอาการเดิม / ได้รับเครื่องเสียหาย / ขาดชิ้นส่วน"
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleConfirm}
                disabled={submitting || satisfied === null}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {submitting ? <><span className="animate-spin">⟳</span> กำลังยืนยัน...</> : "✅ ยืนยันรับพัสดุคืน"}
              </button>

              <p className="text-xs text-center text-gray-400">
                หลังยืนยัน — ระบบจะหัก Point และเปิดหน้ารีวิว
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
