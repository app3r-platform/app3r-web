"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

// U-MAINTAIN-APPLIANCE: เปลี่ยนจากประเภทคงที่ → checklist เครื่องของผู้ใช้จริง
// ตัด "นัดซ้ำอัตโนมัติ" → เพิ่ม "แจ้งเตือนปีถัดไป"
const MOCK_USER_APPLIANCES = [
  { id: "1", icon: "❄️", name: "แอร์ห้องนอน", brand: "Mitsubishi Electric", category: "แอร์" },
  { id: "2", icon: "❄️", name: "แอร์ห้องแขก", brand: "Daikin", category: "แอร์" },
  { id: "3", icon: "🫧", name: "เครื่องซักผ้า", brand: "LG", category: "เครื่องซักผ้า" },
  { id: "4", icon: "🧊", name: "ตู้เย็น Sharp", brand: "Sharp", category: "ตู้เย็น" },
];

type CleaningType = "general" | "deep" | "sanitize";

const CLEANING_OPTIONS: { value: CleaningType; label: string; icon: string; desc: string }[] = [
  { value: "general", label: "ล้างทั่วไป", icon: "🧼", desc: "ล้างทำความสะอาดปกติ 2 ชม." },
  { value: "deep", label: "ล้างลึก", icon: "🔬", desc: "ถอดล้างชิ้นส่วนทั้งหมด 3-4 ชม." },
  { value: "sanitize", label: "ล้าง+ฆ่าเชื้อ", icon: "🦠", desc: "ล้างลึก + สเปรย์ฆ่าเชื้อโรค 4 ชม." },
];

export default function MaintainBookPage() {
  const router = useRouter();
  const [selectedAppliances, setSelectedAppliances] = useState<string[]>([]);
  const [cleaningType, setCleaningType] = useState<CleaningType>("general");
  const [scheduledAt, setScheduledAt] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [notifyNextYear, setNotifyNextYear] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [mockBooked, setMockBooked] = useState(false);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 16);

  const clearErr = (key: string) =>
    setErrors(e => { const c = { ...e }; delete c[key]; return c; });

  const toggleAppliance = (id: string) => {
    setSelectedAppliances(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    clearErr("appliances");
  };

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
    if (selectedAppliances.length === 0) e.appliances = "กรุณาเลือกเครื่องใช้ไฟฟ้าอย่างน้อย 1 รายการ";
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
          selectedAppliances,
          cleaningType,
          scheduledAt: new Date(scheduledAt).toISOString(),
          address: { lat: lat ?? 0, lng: lng ?? 0, address: address.trim() },
          notifyNextYear,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      router.push(`/maintain/jobs/${data.id}`);
    } catch {
      setTimeout(() => {
        setMockBooked(true);
        setSubmitting(false);
      }, 1500);
      return;
    } finally {
      setSubmitting(false);
    }
  };

  const hasAppliances = MOCK_USER_APPLIANCES.length > 0;

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

      {mockBooked && (
        <div className="bg-weeeu-surface border border-weeeu-primary/40 rounded-2xl p-4 text-center space-y-1">
          <p className="text-2xl">✅</p>
          <p className="text-sm font-semibold text-weeeu-text">จองแล้ว (Mockup)</p>
          <p className="text-xs text-weeeu-primary">WeeeR ในพื้นที่จะส่งข้อเสนอให้เร็วๆ นี้</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Appliance checklist */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">เลือกเครื่องที่ต้องการล้าง</p>
            {hasAppliances && (
              <Link href="/appliances/add" className="text-xs text-weeeu-primary hover:underline">+ เพิ่มเครื่อง</Link>
            )}
          </div>

          {!hasAppliances ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-3xl">🔌</p>
              <p className="text-sm text-gray-500">ยังไม่มีเครื่องใช้ไฟฟ้าในระบบ</p>
              <Link
                href="/appliances/add"
                className="inline-block text-sm font-semibold text-white bg-weeeu-primary hover:bg-weeeu-dark px-4 py-2 rounded-xl transition-colors"
              >
                + เพิ่มเครื่องใช้ไฟฟ้า
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {MOCK_USER_APPLIANCES.map(app => {
                const checked = selectedAppliances.includes(app.id);
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => toggleAppliance(app.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center gap-3 ${
                      checked
                        ? "bg-weeeu-surface border-weeeu-primary"
                        : "border-gray-200 hover:border-weeeu-primary/40"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      checked ? "bg-weeeu-primary border-weeeu-primary" : "border-gray-300"
                    }`}>
                      {checked && <span className="text-white text-xs font-bold">✓</span>}
                    </span>
                    <span className="text-xl">{app.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${checked ? "text-weeeu-text" : "text-gray-700"}`}>{app.name}</p>
                      <p className="text-xs text-gray-400">{app.brand} · {app.category}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {errors.appliances && <p className="text-red-500 text-xs">{errors.appliances}</p>}
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
                    ? "bg-weeeu-surface border-weeeu-primary text-weeeu-text"
                    : "border-gray-200 text-gray-600 hover:border-weeeu-primary/40"
                }`}
              >
                <span className="text-xl">{opt.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${cleaningType === opt.value ? "text-weeeu-text" : "text-gray-700"}`}>{opt.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                </div>
                {cleaningType === opt.value && <span className="text-weeeu-primary text-lg">✓</span>}
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
            className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary ${
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
              className="text-xs text-weeeu-primary font-medium hover:underline disabled:opacity-50 flex items-center gap-1"
            >
              {gpsLoading ? <><span className="animate-spin">⟳</span> กำลังดึง GPS...</> : "📍 ใช้ GPS ปัจจุบัน"}
            </button>
          </div>
          {lat !== null && (
            <p className="text-xs text-weeeu-primary bg-weeeu-surface rounded-lg px-3 py-1.5">
              📍 GPS: {lat.toFixed(5)}, {lng?.toFixed(5)}
            </p>
          )}
          <textarea
            value={address}
            onChange={e => { setAddress(e.target.value); clearErr("address"); }}
            placeholder="เช่น 123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพ 10110"
            rows={3}
            className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary resize-none ${
              errors.address ? "border-red-400 bg-red-50" : "border-gray-200"
            }`}
          />
          {errors.address && <p className="text-red-500 text-xs">{errors.address}</p>}
        </div>

        {/* แจ้งเตือนปีถัดไป (แทน นัดซ้ำอัตโนมัติ) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">แจ้งเตือนปีถัดไป</p>
              <p className="text-xs text-gray-400 mt-0.5">WeeeR จะแจ้งเตือนให้นัดล้างอีกครั้งในปีหน้า</p>
            </div>
            <button
              type="button"
              onClick={() => setNotifyNextYear(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${notifyNextYear ? "bg-weeeu-primary" : "bg-gray-200"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifyNextYear ? "translate-x-6" : ""}`} />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:bg-weeeu-primary/40 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
        >
          {submitting
            ? <><span className="animate-spin">⟳</span> กำลังจอง...</>
            : "🛁 ยืนยันการจองล้างเครื่อง"}
        </button>

        <p className="text-xs text-center text-gray-400">
          หลังจอง — WeeeR ในพื้นที่จะส่งข้อเสนอราคาให้คุณพิจารณาก่อนยืนยัน
        </p>
      </form>
    </div>
  );
}
