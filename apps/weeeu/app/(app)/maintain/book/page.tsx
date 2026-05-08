"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

type ApplianceType = "AC" | "WashingMachine";
type CleaningType = "general" | "deep" | "sanitize";
type RecurringInterval = "3_months" | "6_months" | "12_months";

const APPLIANCE_OPTIONS: { value: ApplianceType; label: string; icon: string }[] = [
  { value: "AC", label: "แอร์", icon: "🌡️" },
  { value: "WashingMachine", label: "เครื่องซักผ้า", icon: "🫧" },
];

const CLEANING_OPTIONS: { value: CleaningType; label: string; icon: string; desc: string }[] = [
  { value: "general", label: "ล้างทั่วไป", icon: "🧼", desc: "ล้างทำความสะอาดปกติ 2 ชม." },
  { value: "deep", label: "ล้างลึก", icon: "🔬", desc: "ถอดล้างชิ้นส่วนทั้งหมด 3-4 ชม." },
  { value: "sanitize", label: "ล้าง+ฆ่าเชื้อ", icon: "🦠", desc: "ล้างลึก + สเปรย์ฆ่าเชื้อโรค 4 ชม." },
];

const RECURRING_OPTIONS: { value: RecurringInterval; label: string }[] = [
  { value: "3_months", label: "ทุก 3 เดือน" },
  { value: "6_months", label: "ทุก 6 เดือน" },
  { value: "12_months", label: "ทุกปี (12 เดือน)" },
];

export default function MaintainBookPage() {
  const router = useRouter();
  const [applianceType, setApplianceType] = useState<ApplianceType>("AC");
  const [cleaningType, setCleaningType] = useState<CleaningType>("general");
  const [scheduledAt, setScheduledAt] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<RecurringInterval>("3_months");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 16);

  const clearErr = (key: string) =>
    setErrors(e => { const c = { ...e }; delete c[key]; return c; });

  const handleGPS = () => {
    if (!navigator.geolocation) { setErrors(e => ({ ...e, address: "เบราว์เซอร์ไม่รองรับ GPS" })); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        if (!address) setAddress(`พิกัด: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        clearErr("address");
        setGpsLoading(false);
      },
      () => { setErrors(e => ({ ...e, address: "ไม่สามารถรับตำแหน่ง GPS ได้ — กรุณาพิมพ์ที่อยู่" })); setGpsLoading(false); }
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!scheduledAt) e.scheduledAt = "กรุณาเลือกวันและเวลานัด";
    if (!address.trim()) e.address = "กรุณาระบุที่อยู่";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/v1/maintain/jobs/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applianceType,
          cleaningType,
          scheduledAt: new Date(scheduledAt).toISOString(),
          address: { lat: lat ?? 0, lng: lng ?? 0, address: address.trim() },
          ...(recurringEnabled && { recurring: { enabled: true, interval: recurringInterval } }),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      router.push(`/maintain/jobs/${data.id}`);
    } catch {
      setErrors({ general: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/maintain/jobs" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <div className="flex items-center gap-2">
          <Image src="/logo/WeeeU.png" alt="WeeeU" width={28} height={28} className="rounded-lg" />
          <h1 className="text-xl font-bold text-gray-900">จองล้างเครื่อง</h1>
        </div>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Appliance type */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ประเภทเครื่อง</p>
          <div className="grid grid-cols-2 gap-2">
            {APPLIANCE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setApplianceType(opt.value)}
                className={`py-4 rounded-xl border text-sm font-medium flex flex-col items-center gap-2 transition-colors ${
                  applianceType === opt.value
                    ? "bg-teal-600 border-teal-600 text-white"
                    : "border-gray-200 text-gray-500 hover:border-teal-300"
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cleaning type */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ประเภทการล้าง</p>
          <div className="space-y-2">
            {CLEANING_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCleaningType(opt.value)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-colors flex items-center gap-3 ${
                  cleaningType === opt.value
                    ? "bg-teal-50 border-teal-500 text-teal-800"
                    : "border-gray-200 text-gray-600 hover:border-teal-200"
                }`}
              >
                <span className="text-xl">{opt.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${cleaningType === opt.value ? "text-teal-800" : "text-gray-700"}`}>{opt.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                </div>
                {cleaningType === opt.value && <span className="text-teal-600 text-lg">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">วันและเวลานัด <span className="text-red-500">*</span></p>
          <input
            type="datetime-local"
            value={scheduledAt}
            min={minDateStr}
            onChange={e => { setScheduledAt(e.target.value); clearErr("scheduledAt"); }}
            className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              errors.scheduledAt ? "border-red-400 bg-red-50" : "border-gray-200"
            }`}
          />
          {errors.scheduledAt && <p className="text-red-500 text-xs">{errors.scheduledAt}</p>}
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ที่อยู่บริการ <span className="text-red-500">*</span></p>
            <button
              type="button"
              onClick={handleGPS}
              disabled={gpsLoading}
              className="text-xs text-teal-600 font-medium hover:underline disabled:opacity-50 flex items-center gap-1"
            >
              {gpsLoading ? <><span className="animate-spin">⟳</span> กำลังดึง GPS...</> : "📍 ใช้ GPS ปัจจุบัน"}
            </button>
          </div>
          {lat !== null && (
            <p className="text-xs text-teal-600 bg-teal-50 rounded-lg px-3 py-1.5">
              📍 GPS: {lat.toFixed(5)}, {lng?.toFixed(5)}
            </p>
          )}
          <textarea
            value={address}
            onChange={e => { setAddress(e.target.value); clearErr("address"); }}
            placeholder="เช่น 123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพ 10110"
            rows={3}
            className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none ${
              errors.address ? "border-red-400 bg-red-50" : "border-gray-200"
            }`}
          />
          {errors.address && <p className="text-red-500 text-xs">{errors.address}</p>}
        </div>

        {/* Recurring */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">นัดซ้ำอัตโนมัติ</p>
              <p className="text-xs text-gray-400 mt-0.5">รับส่วนลด 10% สำหรับการนัดซ้ำ</p>
            </div>
            <button
              type="button"
              onClick={() => setRecurringEnabled(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${recurringEnabled ? "bg-teal-500" : "bg-gray-200"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${recurringEnabled ? "translate-x-6" : ""}`} />
            </button>
          </div>

          {recurringEnabled && (
            <div className="space-y-2 border-t border-gray-100 pt-3">
              {RECURRING_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRecurringInterval(opt.value)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-colors flex items-center justify-between ${
                    recurringInterval === opt.value
                      ? "bg-teal-50 border-teal-400 text-teal-800 font-medium"
                      : "border-gray-200 text-gray-600 hover:border-teal-200"
                  }`}
                >
                  <span>{opt.label}</span>
                  {recurringInterval === opt.value && <span className="text-teal-600 text-sm">✓</span>}
                </button>
              ))}
              <div className="bg-teal-50 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <span className="text-teal-600">🎉</span>
                <p className="text-xs text-teal-700 font-medium">ส่วนลด 10% ทุกครั้งที่นัดซ้ำ</p>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
        >
          {submitting
            ? <><span className="animate-spin">⟳</span> กำลังจอง...</>
            : "🛁 ยืนยันการจองล้างเครื่อง"}
        </button>

        <p className="text-xs text-center text-gray-400">
          หลังจอง — ระบบจะหาช่างในพื้นที่และแจ้งผลภายใน 30 นาที
        </p>
      </form>
    </div>
  );
}
