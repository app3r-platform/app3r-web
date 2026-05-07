"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Appliance = { id: string; name: string; brand: string; model: string };

export default function RepairNewPage() {
  const router = useRouter();
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [form, setForm] = useState({
    appliance_id: "",
    issue_summary: "",
    issue_detail: "",
    scheduled_at: "",
    budget_max: "",
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    fetch("/api/v1/appliances", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
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
    if (!form.scheduled_at) e.scheduled_at = "กรุณาเลือกวันที่สะดวก";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      const body = new FormData();
      body.append("appliance_id", form.appliance_id);
      body.append("issue_summary", form.issue_summary);
      body.append("issue_detail", form.issue_detail);
      body.append("service_type", "on_site");
      body.append("scheduled_at", new Date(form.scheduled_at).toISOString());
      if (form.budget_max) body.append("budget_max", form.budget_max);
      photos.forEach(f => body.append("photos", f));

      const res = await fetch("/api/v1/repair/listings", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      router.push(`/repair/${data.id}/offers`);
    } catch {
      setErrors({ general: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" });
    } finally {
      setSubmitting(false);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const inputCls = (f: string) =>
    `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[f] ? "border-red-400 bg-red-50" : "border-gray-200"
    }`;

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/repair" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">แจ้งซ่อมใหม่</h1>
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
            {appliances.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                ยังไม่มีเครื่องใช้ไฟฟ้า —{" "}
                <Link href="/appliances" className="text-blue-600 hover:underline">เพิ่มเครื่องก่อน</Link>
              </p>
            )}
          </div>
        </div>

        {/* Issue */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">อาการเสีย</p>
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
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Photos — R-01.5: min 1, max 5 */}
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
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors text-xs gap-1"
              >
                <span className="text-2xl leading-none">+</span>
                <span>เพิ่มรูป</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handlePhotoAdd} />
          <p className="text-xs text-gray-400">ต้องมีอย่างน้อย 1 รูป, สูงสุด 5 รูป (Media Constraints R-01.5)</p>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">นัดหมาย</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันที่สะดวก <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              min={minDate.toISOString().slice(0, 16)}
              onChange={e => { setForm(f => ({ ...f, scheduled_at: e.target.value })); clearErr("scheduled_at"); }}
              className={inputCls("scheduled_at")}
            />
            {errors.scheduled_at && <p className="text-red-500 text-xs mt-1">{errors.scheduled_at}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">งบประมาณสูงสุด (Point)</label>
            <input
              type="number"
              value={form.budget_max}
              onChange={e => setForm(f => ({ ...f, budget_max: e.target.value }))}
              placeholder="ไม่ระบุ = ไม่จำกัด"
              min={0}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <p className="text-xs text-blue-700">
            🔧 <strong>บริการนอกสถานที่ (On-site)</strong> — ช่างจะออกมาซ่อมถึงบ้านคุณ
            ค่าตรวจ 100 Point (ไม่คืน)
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
        >
          {submitting ? <><span className="animate-spin">⟳</span> กำลังส่งคำขอ...</> : "ส่งคำขอซ่อม"}
        </button>
      </form>
    </div>
  );
}
