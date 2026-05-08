"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

type ShipOutInfo = {
  appliance_name: string;
  courier: string;
  shop_address: string;
  tracking_instructions: string;
};

const COURIER_LABEL: Record<string, string> = {
  kerry: "Kerry Express",
  flash: "Flash Express",
  jandt: "J&T Express",
};

export default function ShipOutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [info, setInfo] = useState<ShipOutInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [serialNumber, setSerialNumber] = useState("");
  const [conditionNotes, setConditionNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  useEffect(() => {
    apiFetch(`/api/v1/repair/jobs/${id}/shipping-details`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { setError("ไม่พบข้อมูลการขนส่ง"); return; }
        setInfo({
          appliance_name: d.appliance_name ?? "",
          courier: d.confirmed_courier ?? d.courier ?? "",
          shop_address: d.shop_address ?? d.address ?? "",
          tracking_instructions: d.tracking_instructions ?? "",
        });
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลได้"))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPhotos(prev => {
      const merged = [...prev, ...files].slice(0, 10);
      setPhotoUrls(merged.map(f => URL.createObjectURL(f)));
      return merged;
    });
    e.target.value = "";
  };

  const removePhoto = (i: number) => {
    setPhotos(p => {
      const next = p.filter((_, idx) => idx !== i);
      setPhotoUrls(next.map(f => URL.createObjectURL(f)));
      return next;
    });
  };

  const handleSubmit = async () => {
    if (photos.length < 3) { setError("กรุณาถ่ายรูปสภาพเครื่องก่อนแพ็คอย่างน้อย 3 รูป"); return; }
    if (!trackingNumber.trim()) { setError("กรุณาระบุเลข Tracking ของพัสดุ"); return; }
    setError("");
    setSubmitting(true);
    try {
      const body = new FormData();
      body.append("tracking_number", trackingNumber.trim());
      body.append("serial_number", serialNumber.trim());
      body.append("condition_notes", conditionNotes.trim());
      photos.forEach(f => body.append("photos", f));
      const res = await apiFetch(`/api/v1/repair/jobs/${id}/ship-out`, { method: "POST", body });
      if (!res.ok) throw new Error(await res.text());
      setSubmitted(true);
      setTimeout(() => router.push(`/repair/${id}`), 1500);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;

  if (error && !info) return (
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
        <h1 className="text-xl font-bold text-gray-900">ส่งพัสดุไปร้านซ่อม</h1>
      </div>

      {submitted ? (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-center space-y-3">
          <p className="text-4xl">🚚</p>
          <p className="text-sm font-semibold text-orange-800">บันทึกข้อมูลการส่งพัสดุแล้ว!</p>
          <p className="text-xs text-orange-600">กำลังกลับหน้ารายละเอียดงาน...</p>
        </div>
      ) : (
        <>
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-orange-800">📦 แพ็คพัสดุและส่งเครื่องไปร้าน</p>
            <p className="text-xs text-orange-600 mt-1">ถ่ายรูปสภาพเครื่อง + กรอกเลข Tracking หลังฝากส่ง</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {info && (
            <>
              {/* Courier + address info */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลการส่ง</p>
                <InfoRow label="เครื่อง" value={info.appliance_name} />
                <InfoRow label="บริษัทขนส่ง" value={COURIER_LABEL[info.courier] ?? info.courier} />
                {info.shop_address && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">ที่อยู่ปลายทาง</p>
                    <p className="text-sm font-medium text-gray-800 leading-relaxed">{info.shop_address}</p>
                  </div>
                )}
                {info.tracking_instructions && (
                  <p className="text-xs text-orange-600 bg-orange-50 rounded-lg p-2">{info.tracking_instructions}</p>
                )}
              </div>

              {/* Pre-shipping photos */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">รูปสภาพเครื่องก่อนแพ็ค</p>
                    <p className="text-xs text-gray-400 mt-0.5">ต้องมีอย่างน้อย 3 รูป — ถ่ายทุกด้านเพื่อป้องกันข้อพิพาท</p>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{photos.length}/10</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {photoUrls.map((url, i) => (
                    <div key={i} className="relative w-20 h-20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {photos.length < 10 && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className={`w-20 h-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-xs gap-1 transition-colors ${
                        photos.length < 3
                          ? "border-orange-300 text-orange-400 hover:border-orange-500"
                          : "border-gray-200 text-gray-400 hover:border-blue-300"
                      }`}
                    >
                      <span className="text-2xl leading-none">+</span>
                      <span>เพิ่มรูป</span>
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handlePhotoAdd} />
                {photos.length < 3 && (
                  <p className="text-xs text-orange-500">⚠️ ยังขาดอีก {3 - photos.length} รูป</p>
                )}
              </div>

              {/* Condition notes */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">สภาพเครื่องก่อนส่ง</p>
                <textarea
                  value={conditionNotes}
                  onChange={e => setConditionNotes(e.target.value)}
                  placeholder="เช่น มีรอยขีดข่วนด้านหลัง / ฝาสแตนเลสมีคราบ / กล่องพลาสติกมีรอยแตก ฯลฯ"
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>

              {/* Serial number */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Serial Number</p>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={e => setSerialNumber(e.target.value)}
                  placeholder="ระบุหมายเลข Serial ของเครื่อง (ถ้ามี)"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Tracking number */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  เลข Tracking <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-gray-400">กรอกหลังจากฝากพัสดุกับบริษัทขนส่งแล้ว</p>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder={`เลข Tracking ของ ${COURIER_LABEL[info.courier] ?? info.courier}`}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono ${
                    !trackingNumber && error ? "border-red-400 bg-red-50" : "border-gray-200"
                  }`}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || photos.length < 3 || !trackingNumber.trim()}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {submitting ? <><span className="animate-spin">⟳</span> กำลังบันทึก...</> : "🚚 ยืนยันส่งพัสดุแล้ว"}
              </button>

              <p className="text-xs text-center text-gray-400">
                หลังยืนยัน — ร้านซ่อมจะแจ้งเมื่อรับพัสดุได้
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
