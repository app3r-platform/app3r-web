"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

type Appliance = { id: string; name: string; brand: string; model: string };

export default function PickupSchedulePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // Pre-filled from repair/new URL params
  const [prefill, setPrefill] = useState({
    appliance_id: "",
    issue_summary: "",
    issue_detail: "",
    budget_max: "",
  });
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [form, setForm] = useState({
    appliance_id: "",
    issue_summary: "",
    issue_detail: "",
    budget_max: "",
    address: "",
    address_note: "",
    pickup_date: "",
    pickup_time: "",
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Read prefill from URL params (passed from repair/new)
    const params = new URLSearchParams(window.location.search);
    const pf = {
      appliance_id: params.get("appliance_id") ?? "",
      issue_summary: params.get("issue_summary") ?? "",
      issue_detail: params.get("issue_detail") ?? "",
      budget_max: params.get("budget_max") ?? "",
    };
    setPrefill(pf);
    setForm(f => ({ ...f, ...pf }));

    apiFetch("/api/v1/appliances")
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setAppliances(d.items ?? []));
  }, []);

  const clearErr = (key: string) =>
    setErrors(e => { const c = { ...e }; delete c[key]; return c; });

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPhotos(prev => {
      const merged = [...prev, ...files].slice(0, 5);
      setPhotoUrls(merged.map(f => URL.createObjectURL(f)));
      return merged;
    });
    e.target.value = "";
    clearErr("photos");
  };

  const removePhoto = (i: number) => {
    setPhotos(p => {
      const next = p.filter((_, idx) => idx !== i);
      setPhotoUrls(next.map(f => URL.createObjectURL(f)));
      return next;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.appliance_id) e.appliance_id = "กรุณาเลือกเครื่องใช้ไฟฟ้า";
    if (!form.issue_summary.trim()) e.issue_summary = "กรุณาระบุอาการเสียเบื้องต้น";
    if (photos.length < 1) e.photos = "กรุณาถ่ายรูปอาการเสียอย่างน้อย 1 รูป (R-01.5)";
    if (!form.address.trim()) e.address = "กรุณาระบุที่อยู่รับเครื่อง";
    if (!form.pickup_date) e.pickup_date = "กรุณาเลือกวันนัดรับ";
    if (!form.pickup_time) e.pickup_time = "กรุณาเลือกช่วงเวลานัดรับ";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const body = new FormData();
      body.append("appliance_id", form.appliance_id);
      body.append("issue_summary", form.issue_summary);
      body.append("issue_detail", form.issue_detail);
      body.append("service_type", "pickup");
      body.append("address", form.address);
      if (form.address_note) body.append("address_note", form.address_note);
      body.append("pickup_date", form.pickup_date);
      body.append("pickup_time", form.pickup_time);
      if (form.budget_max) body.append("budget_max", form.budget_max);
      photos.forEach(f => body.append("photos", f));

      const res = await apiFetch("/api/v1/repair/listings", { method: "POST", body });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      router.push(`/repair/${data.id}/pickup-receipt`);
    } catch {
      setErrors({ general: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (f: string) =>
    `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
      errors[f] ? "border-red-400 bg-red-50" : "border-gray-200"
    }`;

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  const timeSlots = [
    "08:00–10:00", "10:00–12:00", "12:00–14:00",
    "14:00–16:00", "16:00–18:00",
  ];

  const fromNew = !!prefill.appliance_id || !!prefill.issue_summary;

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/repair/new" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">นัดหมาย Pickup</h1>
          {fromNew && <p className="text-xs text-purple-600 mt-0.5">ต่อจากขั้นที่ 1 — กรอกที่อยู่และเวลารับเครื่อง</p>}
        </div>
      </div>

      {/* Progress */}
      {fromNew && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">1. เลือกเครื่อง ✓</span>
          <span className="text-gray-300">→</span>
          <span className="bg-purple-600 text-white px-2 py-1 rounded-full font-medium">2. นัดหมาย</span>
        </div>
      )}

      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-purple-800">🚛 Pickup — ช่างมารับเครื่องถึงบ้าน</p>
        <p className="text-xs text-purple-600 mt-1">ระบุที่อยู่และเวลาที่สะดวกให้ช่างมารับเครื่อง</p>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Appliance */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">เครื่องใช้ไฟฟ้า</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เลือกเครื่อง <span className="text-red-500">*</span>
            </label>
            <select
              value={form.appliance_id}
              onChange={e => { setForm(f => ({ ...f, appliance_id: e.target.value })); clearErr("appliance_id"); }}
              className={inputCls("appliance_id")}
            >
              <option value="">— เลือกเครื่องใช้ไฟฟ้า —</option>
              {appliances.map(a => (
                <option key={a.id} value={a.id}>{a.name} — {a.brand} {a.model}</option>
              ))}
            </select>
            {errors.appliance_id && <p className="text-red-500 text-xs mt-1">{errors.appliance_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อาการเสียเบื้องต้น <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.issue_summary}
              onChange={e => { setForm(f => ({ ...f, issue_summary: e.target.value })); clearErr("issue_summary"); }}
              placeholder="เช่น เปิดไม่ติด / เสียงดัง / น้ำรั่ว"
              className={inputCls("issue_summary")}
            />
            {errors.issue_summary && <p className="text-red-500 text-xs mt-1">{errors.issue_summary}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดเพิ่มเติม</label>
            <textarea
              value={form.issue_detail}
              onChange={e => setForm(f => ({ ...f, issue_detail: e.target.value }))}
              placeholder="เริ่มเป็นตั้งแต่เมื่อไร / เกิดขึ้นบ่อยแค่ไหน"
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">รูปถ่ายอาการเสีย</p>
            <span className="text-xs text-gray-400">{photos.length}/5</span>
          </div>
          {errors.photos && <p className="text-red-500 text-xs">{errors.photos}</p>}
          <div className="flex flex-wrap gap-2">
            {photoUrls.map((url, i) => (
              <div key={i} className="relative w-20 h-20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                >×</button>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-purple-300 hover:text-purple-500 transition-colors text-xs gap-1"
              >
                <span className="text-2xl leading-none">+</span>
                <span>เพิ่มรูป</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handlePhotoAdd} />
          <p className="text-xs text-gray-400">ต้องมีอย่างน้อย 1 รูป, สูงสุด 5 รูป (R-01.5)</p>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ที่อยู่รับเครื่อง</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ที่อยู่ <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.address}
              onChange={e => { setForm(f => ({ ...f, address: e.target.value })); clearErr("address"); }}
              placeholder="บ้านเลขที่ / ถนน / แขวง / เขต / จังหวัด / รหัสไปรษณีย์"
              rows={3}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                errors.address ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุเพิ่มเติม (ไม่บังคับ)</label>
            <input
              type="text"
              value={form.address_note}
              onChange={e => setForm(f => ({ ...f, address_note: e.target.value }))}
              placeholder="เช่น ห้อง A101 / หน้าปั๊มน้ำมัน / โทรก่อนมาถึง"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Pickup date + time slot */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">วันและเวลานัดรับ</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันนัดรับ <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.pickup_date}
              min={minDate.toISOString().slice(0, 10)}
              onChange={e => { setForm(f => ({ ...f, pickup_date: e.target.value })); clearErr("pickup_date"); }}
              className={inputCls("pickup_date")}
            />
            {errors.pickup_date && <p className="text-red-500 text-xs mt-1">{errors.pickup_date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ช่วงเวลา <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => { setForm(f => ({ ...f, pickup_time: slot })); clearErr("pickup_time"); }}
                  className={`py-2 px-2 rounded-xl border text-xs font-medium transition-colors ${
                    form.pickup_time === slot
                      ? "bg-purple-600 border-purple-600 text-white"
                      : "border-gray-200 text-gray-600 hover:border-purple-300"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
            {errors.pickup_time && <p className="text-red-500 text-xs mt-1">{errors.pickup_time}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">งบประมาณสูงสุด (Point)</label>
            <input
              type="number"
              value={form.budget_max}
              onChange={e => setForm(f => ({ ...f, budget_max: e.target.value }))}
              placeholder="ไม่ระบุ = ไม่จำกัด"
              min={0}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
        >
          {submitting
            ? <><span className="animate-spin">⟳</span> กำลังส่งคำขอ...</>
            : "🚛 ยืนยันนัด Pickup"
          }
        </button>
      </form>
    </div>
  );
}
