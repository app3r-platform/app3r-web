"use client";
// ─── แจ้งซ่อมใหม่ (/repair/new) — CMD-A R2: 7 ประเด็น ────────────────────────
// R2-1: อาการ dropdown D-5 mock · R2-2: chip หมายเหตุ 6 อัน
// R2-3: รูป min3-max5 / คลิป min1-max3 · R2-4: งบ slider
// R2-5: ลบค่าตรวจ 100 · R2-6: checklist สภาพ · R2-7: วันรอ slider

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

// ─── Local Types ──────────────────────────────────────────────────────────────
type Appliance = { id: string; name: string; brand: string; model: string };
type ServiceType = "on_site" | "walk_in" | "pickup" | "parcel";
type ServicePriority = "normal" | "urgent" | "vip";

const PRIORITY_CONFIG: Record<ServicePriority, { label: string; cls: string; icon: string; waitMin: number; waitMax: number; waitDefault: number }> = {
  normal: { label: "ปกติ",     cls: "bg-gray-100 text-gray-600",    icon: "⚪", waitMin: 1, waitMax: 7, waitDefault: 7 },
  urgent: { label: "เร่งด่วน", cls: "bg-orange-100 text-orange-700", icon: "🔶", waitMin: 1, waitMax: 2, waitDefault: 2 },
  vip:    { label: "VIP",      cls: "bg-weeeu-surface text-weeeu-dark", icon: "👑", waitMin: 0, waitMax: 1, waitDefault: 1 },
};

// ─── R2-1: อาการเสีย by appliance type (D-5 mock) ───────────────────────────
const SYMPTOMS_BY_TYPE: Record<string, string[]> = {
  "แอร์":            ["ไม่เย็น", "มีน้ำหยด/รั่ว", "มีเสียงดัง", "ไม่ติด", "รีโมทไม่ทำงาน", "คอมเพรสเซอร์มีปัญหา"],
  "ตู้เย็น":         ["ไม่เย็น/เย็นน้อย", "มีเสียงดัง", "มีน้ำรั่ว", "น้ำแข็งเกาะมาก", "ยางขอบประตูเสื่อม", "ไฟสถานะไม่ติด"],
  "เครื่องซักผ้า":   ["ไม่ปั่น/ไม่หมุน", "น้ำไม่เข้า", "น้ำไม่ระบาย", "น้ำรั่ว", "มีเสียงดัง/สั่น", "ฝาไม่ปิดสนิท"],
  "ทีวี":            ["ไม่มีภาพ", "ภาพผิดเพี้ยน", "ไม่มีเสียง", "จอมีเส้น/จุด", "รีโมทไม่ทำงาน", "ไม่เปิดติด"],
  "คอม/โน้ตบุ๊ก":   ["ไม่เปิดติด", "จอไม่ติด", "ร้อน/ดับเอง", "ช้า/ค้าง", "มีเสียงพัดลมดัง", "แบตเตอรี่เสื่อม"],
};
const DEFAULT_SYMPTOMS = ["ไม่เปิดติด", "มีเสียงดัง", "มีน้ำรั่ว", "ไฟไม่ติด", "ทำงานผิดปกติ", "อื่นๆ"];

// ─── R2-2: chip หมายเหตุถึงช่าง 6 อัน ───────────────────────────────────────
const NOTE_CHIPS = [
  { id: "notify_parts",    label: "🔧 แจ้งก่อนเปลี่ยนอะไหล่",  group: "repair" },
  { id: "original_parts",  label: "✅ ใช้อะไหล่แท้เท่านั้น",     group: "repair" },
  { id: "estimate_first",  label: "💰 ประเมินราคาก่อนซ่อม",      group: "repair" },
  { id: "call_30min",      label: "📞 โทรก่อนมา 30 นาที",        group: "onsite" },
  { id: "has_pets",        label: "🐶 มีสัตว์เลี้ยงในบ้าน",       group: "onsite" },
  { id: "parking_limited", label: "🅿️ ที่จอดรถจำกัด",           group: "onsite" },
];

// ─── R2-6: checklist สภาพเครื่อง by type ────────────────────────────────────
const CONDITION_CHECKLIST: Record<string, string[]> = {
  "แอร์":            ["ไฟเข้าไหม", "คอมเพรสเซอร์ทำงานไหม", "มีน้ำหยด/รั่ว", "ไม่เย็น", "มีเสียงดัง", "รีโมทไม่ทำงาน"],
  "ตู้เย็น":         ["ไฟเข้าไหม", "ไม่เย็น/เย็นน้อย", "มีเสียงดัง", "มีน้ำรั่ว/น้ำแข็งเกาะ", "ยางขอบประตูเสื่อม", "ไฟสถานะไม่ติด"],
  "เครื่องซักผ้า":   ["ไฟเข้าไหม", "ไม่ปั่น/ไม่หมุน", "น้ำไม่เข้า/ไม่ระบาย", "น้ำรั่ว", "มีเสียงดัง/สั่น", "ฝาไม่ปิดสนิท"],
  "ทีวี":            ["ไฟเข้าไหม", "ไม่มีภาพ", "ภาพผิดเพี้ยน", "ไม่มีเสียง", "จอมีเส้น/จุด", "รีโมทไม่ทำงาน"],
  "คอม/โน้ตบุ๊ก":   ["ไม่เปิดติด", "จอไม่ติด", "ร้อน/ดับเอง", "ช้า/ค้าง", "มีเสียงพัดลมดัง", "แบตเตอรี่เสื่อม"],
};

// ─── MOCK appliances fallback ─────────────────────────────────────────────────
const MOCK_APPLIANCES: Appliance[] = [
  { id: "a1", name: "แอร์ห้องนอน",   brand: "Mitsubishi", model: "MSY-GN13VF" },
  { id: "a2", name: "แอร์ห้องแขก",   brand: "Daikin",     model: "FTKQ25SV2S" },
  { id: "a3", name: "เครื่องซักผ้า", brand: "LG",         model: "T2108VSAM" },
  { id: "a4", name: "ตู้เย็น Sharp", brand: "Sharp",      model: "SJ-X420TP-SL" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getApplianceType = (name: string): string => {
  if (/แอร์|air/i.test(name)) return "แอร์";
  if (/ตู้เย็น/i.test(name)) return "ตู้เย็น";
  if (/ซักผ้า|ซัก/i.test(name)) return "เครื่องซักผ้า";
  if (/ทีวี|TV/i.test(name)) return "ทีวี";
  if (/คอม|โน้ต/i.test(name)) return "คอม/โน้ตบุ๊ก";
  return "อื่นๆ";
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RepairNewPage() {
  const router = useRouter();
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [serviceType, setServiceType] = useState<ServiceType>("on_site");
  const [selectedShopId, setSelectedShopId] = useState("");
  const [selectedShopName, setSelectedShopName] = useState("");
  const [form, setForm] = useState({
    appliance_id: "",
    issue_detail: "",
    scheduled_at: "",
    scheduled_at_2: "",   // A3: วันเวลาสะดวก slot สำรอง (2 ช่วง)
    priority: "normal" as ServicePriority,
  });
  // A3: ที่อยู่บริการ — pre-fill จากที่ลงทะเบียน (mock · พิกัดจริง=BE จังหวะ2)
  const REGISTERED_ADDRESS = "123/45 ถ.สุขุมวิท ซ.21 บางรัก กรุงเทพ 10110"; // Mockup
  const [serviceAddress, setServiceAddress] = useState(REGISTERED_ADDRESS);
  const [useRegisteredAddress, setUseRegisteredAddress] = useState(true);

  // R2-1: อาการ dropdown
  const [selectedSymptom, setSelectedSymptom] = useState("");
  const [customSymptom, setCustomSymptom] = useState("");

  // R2-2: chip หมายเหตุ
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());

  // R2-3: รูป + คลิป
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  // R2-4: งบ slider (0 = ไม่จำกัด)
  const [budgetValue, setBudgetValue] = useState(0);

  // R2-6: condition checklist
  const [conditionChecks, setConditionChecks] = useState<Set<string>>(new Set());

  // R2-7: วันรอ
  const [waitDays, setWaitDays] = useState(7);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch("/api/v1/appliances")
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setAppliances(d.items?.length ? d.items : MOCK_APPLIANCES))
      .catch(() => setAppliances(MOCK_APPLIANCES));
    // URL params (walk-in / shop selection)
    const params = new URLSearchParams(window.location.search);
    const st = params.get("service_type");
    const sid = params.get("shop_id");
    const sname = params.get("shop_name");
    if (st === "walk_in") setServiceType("walk_in");
    if (st === "pickup") setServiceType("pickup");
    if (st === "parcel") setServiceType("parcel");
    if (sid) setSelectedShopId(sid);
    if (sname) setSelectedShopName(decodeURIComponent(sname));
    // appliance pre-select from /appliances
    const aid = params.get("appliance");
    if (aid) setForm(f => ({ ...f, appliance_id: aid }));
  }, []);

  // ── D1: DEV mock attach — pre-fill 3 photos so on_site validation passes ──────
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_NAV !== "true") return;
    try {
      // Minimal 1×1 white JPEG
      const b64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAAQCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const blob = new Blob([arr], { type: "image/jpeg" });
      const mockFiles = Array.from({ length: 3 }, (_, i) =>
        new File([blob], `mock-photo-${i + 1}.jpg`, { type: "image/jpeg" })
      );
      setPhotos(mockFiles);
      setPhotoUrls(mockFiles.map(() => URL.createObjectURL(blob)));
    } catch { /* ignore — dev only */ }
  }, []);

  const clearErr = (key: string) =>
    setErrors(e => { const c = { ...e }; delete c[key]; return c; });

  // Derived appliance type
  const selectedAppliance = appliances.find(a => a.id === form.appliance_id);
  const applianceType = selectedAppliance ? getApplianceType(selectedAppliance.name) : "";
  const symptomOptions = SYMPTOMS_BY_TYPE[applianceType] ?? DEFAULT_SYMPTOMS;
  const conditionOptions = CONDITION_CHECKLIST[applianceType] ?? [];

  // R2-7: update waitDays when priority changes
  const handlePriorityChange = (p: ServicePriority) => {
    setForm(f => ({ ...f, priority: p }));
    setWaitDays(PRIORITY_CONFIG[p].waitDefault);
  };

  // R2-3: photo handlers
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
    setPhotos(p => { const next = p.filter((_, idx) => idx !== i); setPhotoUrls(next.map(f => URL.createObjectURL(f))); return next; });
  };

  const handleVideoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setVideos(prev => [...prev, ...files].slice(0, 3));
    e.target.value = "";
    clearErr("videos");
  };
  const removeVideo = (i: number) => setVideos(v => v.filter((_, idx) => idx !== i));

  // R2-2: chip toggle
  const toggleChip = (id: string) => {
    setSelectedChips(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // R2-6: condition toggle
  const toggleCondition = (item: string) => {
    setConditionChecks(prev => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.appliance_id) e.appliance_id = "กรุณาเลือกเครื่องใช้ไฟฟ้า";
    const issueVal = selectedSymptom === "อื่นๆ" ? customSymptom.trim() : selectedSymptom;
    if (!issueVal) e.issue_summary = "กรุณาระบุอาการเสีย";
    if (serviceType === "on_site") {
      if (photos.length < 3) e.photos = "กรุณาถ่ายรูปอาการเสียอย่างน้อย 3 รูป";
      if (videos.length < 1) e.videos = "กรุณาอัพโหลดคลิปอย่างน้อย 1 คลิป";
      if (!form.scheduled_at) e.scheduled_at = "กรุณาเลือกวันที่สะดวก";
    }
    if (serviceType === "walk_in" && !selectedShopId) e.shop = "กรุณาเลือกร้านซ่อม";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const issueVal = selectedSymptom === "อื่นๆ" ? customSymptom.trim() : selectedSymptom;
      const noteFromChips = [...selectedChips]
        .map(id => NOTE_CHIPS.find(c => c.id === id)?.label.replace(/^[^\s]+\s/, "") ?? "")
        .filter(Boolean).join(", ");

      const body = new FormData();
      body.append("appliance_id", form.appliance_id);
      body.append("issue_summary", issueVal);
      body.append("issue_detail", form.issue_detail);
      body.append("service_type", serviceType);
      if (serviceType === "on_site") body.append("scheduled_at", new Date(form.scheduled_at).toISOString());
      if (serviceType === "walk_in") body.append("shop_id", selectedShopId);
      if (budgetValue > 0) body.append("budget_max", String(budgetValue));
      body.append("priority", form.priority);
      body.append("wait_days", String(waitDays));
      if (noteFromChips) body.append("customer_note", noteFromChips);
      photos.forEach(f => body.append("photos", f));

      if (serviceType === "pickup") {
        const p = new URLSearchParams({ appliance_id: form.appliance_id, issue_summary: issueVal, issue_detail: form.issue_detail, priority: form.priority, ...(budgetValue > 0 && { budget_max: String(budgetValue) }) });
        router.push(`/repair/pickup/schedule?${p.toString()}`);
        return;
      }

      const res = await apiFetch("/api/v1/repair/listings", { method: "POST", body });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (serviceType === "parcel") { router.push(`/repair/${data.id}/shipping-details`); return; }
      router.push(serviceType === "walk_in" ? `/repair/${data.id}/walk-in-receipt` : `/repair/${data.id}/offers`);
    } catch {
      setErrors({ general: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" });
    } finally {
      setSubmitting(false);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const inputCls = (f: string) =>
    `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30 ${
      errors[f] ? "border-red-400 bg-red-50" : "border-gray-200"
    }`;
  const pCfg = PRIORITY_CONFIG[form.priority];
  const visibleChips = serviceType === "on_site"
    ? NOTE_CHIPS
    : NOTE_CHIPS.filter(c => c.group === "repair");

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
        {/* Service type */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ประเภทบริการ</p>
          <div className="grid grid-cols-2 gap-2">
            {(["on_site", "walk_in", "pickup", "parcel"] as ServiceType[]).map(type => {
              const conf = {
                on_site: { icon: "🏠", label: "On-site\nช่างมาบ้าน",    active: "bg-weeeu-primary border-weeeu-primary text-white" },
                walk_in: { icon: "🚶", label: "Walk-in\nไปร้านเอง",      active: "bg-green-600 border-green-600 text-white" },
                pickup:  { icon: "🚛", label: "Pickup\nช่างมารับ-ส่ง",   active: "bg-weeeu-primary border-weeeu-primary text-white" },
                parcel:  { icon: "📦", label: "Parcel\nส่งพัสดุ",        active: "bg-orange-500 border-orange-500 text-white" },
              }[type];
              return (
                <button key={type} type="button"
                  onClick={() => { setServiceType(type); setErrors({}); }}
                  className={`py-3 rounded-xl border text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                    serviceType === type ? conf.active : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <span className="text-lg">{conf.icon}</span>
                  <span className="text-xs text-center leading-tight whitespace-pre-line">{conf.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Appliance */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">เครื่องใช้ไฟฟ้า</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เลือกเครื่อง <span className="text-red-500">*</span></label>
            <select
              value={form.appliance_id}
              onChange={e => { setForm(f => ({ ...f, appliance_id: e.target.value })); setSelectedSymptom(""); setConditionChecks(new Set()); clearErr("appliance_id"); }}
              className={inputCls("appliance_id")}
            >
              <option value="">— เลือกเครื่องใช้ไฟฟ้า —</option>
              {appliances.map(a => <option key={a.id} value={a.id}>{a.name} — {a.brand} {a.model}</option>)}
            </select>
            {errors.appliance_id && <p className="text-red-500 text-xs mt-1">{errors.appliance_id}</p>}
            {appliances.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">ยังไม่มีเครื่อง — <Link href="/appliances" className="text-weeeu-primary hover:underline">เพิ่มเครื่องก่อน</Link></p>
            )}
          </div>
        </div>

        {/* R2-1: อาการเสีย dropdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">อาการเสีย</p>

          {/* Symptom dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อาการเสียเบื้องต้น <span className="text-red-500">*</span></label>
            <select
              value={selectedSymptom}
              onChange={e => { setSelectedSymptom(e.target.value); clearErr("issue_summary"); }}
              className={inputCls("issue_summary")}
              disabled={!form.appliance_id}
            >
              <option value="">— เลือกอาการเสีย —</option>
              {symptomOptions.map(s => <option key={s} value={s}>{s}</option>)}
              <option value="อื่นๆ">อื่นๆ (ระบุเอง)</option>
            </select>
            {selectedSymptom === "อื่นๆ" && (
              <input
                type="text"
                value={customSymptom}
                onChange={e => { setCustomSymptom(e.target.value); clearErr("issue_summary"); }}
                placeholder="ระบุอาการเสีย..."
                className="mt-2 w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30"
              />
            )}
            {!form.appliance_id && <p className="text-xs text-gray-400 mt-1">เลือกเครื่องก่อนเพื่อดูอาการตามประเภท</p>}
            {errors.issue_summary && <p className="text-red-500 text-xs mt-1">{errors.issue_summary}</p>}
          </div>

          {/* Detail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดเพิ่มเติม</label>
            <textarea
              value={form.issue_detail}
              onChange={e => setForm(f => ({ ...f, issue_detail: e.target.value }))}
              placeholder="เริ่มเป็นตั้งแต่เมื่อไร / เกิดขึ้นบ่อยแค่ไหน"
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30 resize-none"
            />
          </div>

          {/* R2-2: chip หมายเหตุถึงช่าง */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุถึงช่าง (ไม่บังคับ)</label>
            <div className="flex flex-wrap gap-2">
              {visibleChips.map(chip => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => toggleChip(chip.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedChips.has(chip.id)
                      ? "bg-weeeu-primary text-white border-weeeu-primary"
                      : "border-gray-200 text-gray-600 hover:border-weeeu-primary/30"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* R2-7: Priority + วันรอ slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ลำดับความสำคัญ + วันที่ยอมรอ</label>
            <div className="flex gap-2 mb-3">
              {(["normal", "urgent", "vip"] as ServicePriority[]).map(p => {
                const cfg = PRIORITY_CONFIG[p];
                const active = form.priority === p;
                return (
                  <button key={p} type="button" onClick={() => handlePriorityChange(p)}
                    className={`flex-1 py-2 px-2 rounded-xl border text-xs font-medium transition-colors flex flex-col items-center gap-0.5 ${
                      active ? `${cfg.cls} border-current ring-1 ring-current` : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-base leading-none">{cfg.icon}</span>
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>ยอมรอได้</span>
                <span className="font-semibold text-weeeu-primary">
                  {waitDays === 0 ? "ภายในวันนี้" : `${waitDays} วัน`}
                </span>
              </div>
              <input
                type="range"
                min={pCfg.waitMin}
                max={pCfg.waitMax}
                step={1}
                value={waitDays}
                onChange={e => setWaitDays(Number(e.target.value))}
                className="w-full accent-weeeu-primary"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{pCfg.waitMin === 0 ? "วันนี้" : `${pCfg.waitMin} วัน`}</span>
                <span>{pCfg.waitMax} วัน</span>
              </div>
            </div>
          </div>
        </div>

        {/* R2-6: checklist สภาพเครื่อง (แสดงเมื่อเลือกเครื่องแล้ว) */}
        {form.appliance_id && conditionOptions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              สภาพเครื่อง — เช็คอาการที่พบ (ไม่บังคับ)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {conditionOptions.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleCondition(item)}
                  className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border transition-colors text-left ${
                    conditionChecks.has(item)
                      ? "bg-weeeu-surface border-weeeu-primary text-weeeu-primary"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    conditionChecks.has(item) ? "bg-weeeu-primary border-weeeu-primary text-white" : "border-gray-300"
                  }`}>
                    {conditionChecks.has(item) && "✓"}
                  </span>
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* R2-3: รูปถ่าย + คลิป */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          {/* Photos */}
          <div className="space-y-3">
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
                  <button type="button" onClick={() => removePhoto(i)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    ×
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-weeeu-primary/40 transition-colors text-xs gap-1">
                  <span className="text-2xl leading-none">+</span>
                  <span>เพิ่มรูป</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handlePhotoAdd} />
            <p className="text-xs text-gray-400">
              {serviceType === "on_site"
                ? "ต้องมีอย่างน้อย 3 รูป, สูงสุด 5 รูป · 3MB/รูป (R2-3)"
                : "แนบรูปเพิ่มเติมได้ (ไม่บังคับ) · สูงสุด 5 รูป"}
            </p>
          </div>

          {/* Videos — R2-3 */}
          <div className="space-y-3 border-t border-gray-50 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">คลิปวิดีโออาการเสีย</p>
              <span className="text-xs text-gray-400">{videos.length}/3</span>
            </div>
            {errors.videos && <p className="text-red-500 text-xs">{errors.videos}</p>}
            <div className="flex flex-wrap gap-2">
              {videos.map((v, i) => (
                <div key={i} className="relative bg-gray-100 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-lg">🎥</span>
                  <span className="text-xs text-gray-600 max-w-[100px] truncate">{v.name}</span>
                  <button type="button" onClick={() => removeVideo(i)}
                    className="text-red-400 hover:text-red-600 text-xs ml-1">×</button>
                </div>
              ))}
              {videos.length < 3 && (
                <button type="button" onClick={() => videoRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl px-4 py-2 flex items-center gap-2 text-gray-400 hover:border-weeeu-primary/40 transition-colors text-xs">
                  <span>🎥</span> เพิ่มคลิป
                </button>
              )}
            </div>
            <input ref={videoRef} type="file" accept="video/*" multiple hidden onChange={handleVideoAdd} />
            <p className="text-xs text-gray-400">
              {serviceType === "on_site"
                ? "ต้องมีอย่างน้อย 1 คลิป, สูงสุด 3 คลิป · 30MB/คลิป (R2-3)"
                : "แนบคลิปเพิ่มเติมได้ (ไม่บังคับ) · สูงสุด 3 คลิป"}
            </p>
          </div>
        </div>

        {/* Walk-in: shop selector */}
        {serviceType === "walk_in" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ร้านซ่อม</p>
            {selectedShopId ? (
              <div className="flex items-center justify-between gap-3 bg-green-50 rounded-xl p-3">
                <div>
                  <p className="text-sm font-semibold text-green-800">✅ {selectedShopName}</p>
                  <p className="text-xs text-green-600 mt-0.5">ร้านที่เลือกแล้ว</p>
                </div>
                <Link href="/repair/walk-in/select-shop?service_type=walk_in" className="text-xs text-weeeu-primary hover:underline">เปลี่ยนร้าน</Link>
              </div>
            ) : (
              <div>
                <Link href="/repair/walk-in/select-shop?service_type=walk_in"
                  className="w-full flex items-center justify-between gap-3 border-2 border-dashed border-green-300 rounded-xl p-4 text-green-600 hover:border-green-500 hover:bg-green-50 transition-colors">
                  <span className="text-sm font-medium">🏪 เลือกร้านซ่อมที่จะไป</span>
                  <span className="text-lg">›</span>
                </Link>
                {errors.shop && <p className="text-red-500 text-xs mt-1">{errors.shop}</p>}
              </div>
            )}
          </div>
        )}

        {/* Schedule (on_site) + R2-4: Budget slider */}
        {serviceType !== "pickup" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {serviceType === "on_site" ? "นัดหมาย + งบประมาณ" : "งบประมาณ"}
            </p>
            {serviceType === "on_site" && (
              <>
                {/* A3: วันเวลาสะดวก 2 ช่วง */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันเวลาสะดวก ช่วงที่ 1 <span className="text-red-500">*</span>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันเวลาสะดวก ช่วงที่ 2 <span className="text-gray-400 text-xs font-normal">(สำรอง — ถ้าช่วงแรกไม่ว่าง)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.scheduled_at_2}
                    min={minDate.toISOString().slice(0, 16)}
                    onChange={e => setForm(f => ({ ...f, scheduled_at_2: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/40"
                  />
                </div>

                {/* A3: ที่อยู่รับบริการ — ดึงที่ลงทะเบียน + Google map UI (พิกัดจริง=BE จังหวะ2) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ที่อยู่รับบริการ <span className="text-red-500">*</span>
                  </label>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useRegisteredAddress}
                      onChange={e => {
                        setUseRegisteredAddress(e.target.checked);
                        if (e.target.checked) setServiceAddress(REGISTERED_ADDRESS);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-weeeu-primary focus:ring-weeeu-primary/40"
                    />
                    <span className="text-xs text-gray-600">ใช้ที่อยู่ที่ลงทะเบียน</span>
                  </label>
                  {useRegisteredAddress ? (
                    <div className="bg-weeeu-surface border border-weeeu-primary/20 rounded-xl px-3 py-2.5 text-sm text-weeeu-dark">
                      📍 {REGISTERED_ADDRESS}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={serviceAddress}
                      onChange={e => setServiceAddress(e.target.value)}
                      placeholder="ระบุที่อยู่รับบริการ..."
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/40"
                    />
                  )}
                  {/* Map UI placeholder — พิกัดจริง = BE จังหวะ2 */}
                  <div className="mt-2 bg-gray-100 rounded-xl h-24 flex flex-col items-center justify-center border border-gray-200 border-dashed">
                    <span className="text-gray-400 text-lg">🗺️</span>
                    <p className="text-xs text-gray-400 mt-1">แผนที่ยืนยันที่ตั้ง (จังหวะ 2 — รอพิกัดจาก BE)</p>
                  </div>
                </div>
              </>
            )}

            {/* R2-4: Budget slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">งบประมาณสูงสุด พอยต์ทอง (Gold Point)</label>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <button type="button"
                    onClick={() => setBudgetValue(v => Math.max(0, v - 500))}
                    className="w-9 h-9 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-lg font-bold flex-shrink-0"
                  >−</button>
                  <input type="range" min={0} max={20000} step={500} value={budgetValue}
                    onChange={e => setBudgetValue(Number(e.target.value))}
                    className="flex-1 accent-weeeu-primary"
                  />
                  <button type="button"
                    onClick={() => setBudgetValue(v => Math.min(20000, v + 500))}
                    className="w-9 h-9 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-lg font-bold flex-shrink-0"
                  >+</button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-weeeu-primary">
                    {budgetValue === 0 ? "ไม่จำกัด" : `${budgetValue.toLocaleString()} พอยต์ทอง`}
                  </span>
                  {budgetValue > 0 && (
                    <button type="button" onClick={() => setBudgetValue(0)}
                      className="text-xs text-gray-400 hover:text-gray-600 underline">ไม่จำกัด</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pickup info */}
        {serviceType === "pickup" && (
          <div className="bg-weeeu-surface border border-weeeu-primary/20 rounded-2xl p-4 space-y-2">
            <p className="text-sm font-semibold text-weeeu-text">🚛 Pickup — ช่างมารับเครื่องถึงบ้าน</p>
            <p className="text-xs text-weeeu-dark">ขั้นตอนถัดไป: กรอกที่อยู่รับเครื่อง + เลือกวัน/เวลานัดรับ</p>
          </div>
        )}

        {/* Parcel info */}
        {serviceType === "parcel" && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-2">
            <p className="text-sm font-semibold text-orange-800">📦 Parcel — ส่งพัสดุไปร้านซ่อม</p>
            <p className="text-xs text-orange-600">ขั้นตอนถัดไป: ตกลงบริษัทขนส่ง + แพ็คพัสดุ + กรอก Tracking</p>
          </div>
        )}

        {/* R2-5: on-site info — ลบค่าตรวจ 100 พอยต์ทอง */}
        {serviceType === "on_site" && (
          <div className="bg-weeeu-surface border border-weeeu-primary/10 rounded-xl p-3">
            <p className="text-xs text-weeeu-primary">
              🏠 <strong>On-site</strong> — ช่างออกมาซ่อมถึงบ้านคุณ · ร้านจะเสนอค่าตรวจ/ค่าเดินทางในข้อเสนอ
            </p>
          </div>
        )}
        {serviceType === "walk_in" && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-3">
            <p className="text-xs text-green-700">
              🚶 <strong>Walk-in</strong> — นำเครื่องไปที่ร้านซ่อมได้เลย รับ Receipt code เพื่อติดตามสถานะ
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={`w-full font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2 ${
            serviceType === "walk_in"
              ? "bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white"
              : serviceType === "pickup"
              ? "bg-weeeu-primary hover:bg-weeeu-dark disabled:bg-weeeu-primary/40 text-white"
              : serviceType === "parcel"
              ? "bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white"
              : "bg-weeeu-primary hover:bg-weeeu-dark disabled:opacity-50 text-white"
          }`}
        >
          {submitting
            ? <><span className="animate-spin">⟳</span> กำลังดำเนินการ...</>
            : serviceType === "walk_in" ? "🚶 ส่งคำขอ Walk-in"
            : serviceType === "pickup"  ? "🚛 ถัดไป — กรอกที่อยู่และนัดหมาย"
            : serviceType === "parcel"  ? "📦 ส่งคำขอ — ตกลงรายละเอียดขนส่ง"
            : "🔧 ส่งคำขอซ่อม"
          }
        </button>
      </form>
    </div>
  );
}
