"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { listingsApi } from "@/lib/api/listings";
import type { Appliance } from "@/lib/types";

const DELIVERY_OPTIONS = [
  { value: "on_site", label: "ส่งเอง / นัดรับ" },
  { value: "parcel", label: "ส่งพัสดุ (ขนส่ง)" },
];

const GRADE_OPTIONS = [
  { value: "grade_A", label: "เกรด A — สภาพดีมาก ใช้งานปกติ", color: "text-green-700" },
  { value: "grade_B", label: "เกรด B — สภาพพอใช้ มีรอยบ้าง", color: "text-yellow-700" },
  { value: "grade_C", label: "เกรด C — สภาพต้องซ่อม / อะไหล่", color: "text-red-600" },
];

const SCRAP_GRADE_OPTIONS = [
  { value: "grade_A", label: "เกรด A — ชิ้นส่วนยังใช้งานได้ดี", color: "text-green-700" },
  { value: "grade_B", label: "เกรด B — ชิ้นส่วนบางส่วนใช้งานได้", color: "text-yellow-700" },
  { value: "grade_C", label: "เกรด C — ซากเครื่อง / อะไหล่เท่านั้น", color: "text-red-600" },
];

const COMMON_PARTS = ["คอมเพรสเซอร์", "มอเตอร์", "แผงวงจร PCB", "หน้าจอ", "ปั๊มน้ำ", "ฮีตเตอร์", "ถัง", "ฝาครอบ", "สายไฟ", "รีโมท"];

// Terms 3 แกน options (Mockup)
const SHIPPING_POLICY_OPTIONS = [
  { value: "seller_pays", label: "ผู้ขายออกค่าส่งให้ทั้งหมด" },
  { value: "buyer_pays", label: "ผู้ซื้อออกค่าส่ง" },
  { value: "split", label: "แบ่งกัน (ตกลงกันเอง)" },
];

const LIABILITY_POLICY_OPTIONS = [
  { value: "full_refund", label: "คืนเงินเต็มถ้าสินค้าไม่ตรงปก (ภายใน 7 วัน)" },
  { value: "repair_first", label: "ซ่อมให้ก่อน ถ้าซ่อมไม่ได้ค่อยคืน" },
  { value: "no_return", label: "ขายตามสภาพ — ไม่รับคืน (ต้องตรวจก่อนรับ)" },
];

export default function SellNewPage() {
  const router = useRouter();
  const partInputRef = useRef<HTMLInputElement>(null);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loadingAppliances, setLoadingAppliances] = useState(true);

  const [listingType, setListingType] = useState<"used_appliance" | "scrap">("used_appliance");
  const [applianceId, setApplianceId] = useState("");
  const [conditionGrade, setConditionGrade] = useState("");
  const [price, setPrice] = useState("");
  const [deliveryMethods, setDeliveryMethods] = useState<string[]>([]);
  const [sourceWarranty, setSourceWarranty] = useState("");
  const [additionalWarranty, setAdditionalWarranty] = useState("");
  const [description, setDescription] = useState("");
  // Scrap-specific
  const [workingParts, setWorkingParts] = useState<string[]>([]);
  const [partInput, setPartInput] = useState("");

  // Terms 3 แกน (Mockup — Resell 2.2)
  const [shippingPolicy, setShippingPolicy] = useState("seller_pays");
  const [usedWarrantyDays, setUsedWarrantyDays] = useState("30");
  const [liabilityPolicy, setLiabilityPolicy] = useState("full_refund");

  // Media (Mockup — 3 รูป + 1 คลิป · create contract 488cae4 ยังไม่รับ media → local preview เท่านั้น)
  const MAX_IMAGES = 3;
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);
  const [clip, setClip] = useState<{ url: string; name: string } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const clipInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/v1/appliances/mine/")
      .then(r => r.ok ? r.json() : [])
      .then(setAppliances)
      .catch(() => setAppliances([]))
      .finally(() => setLoadingAppliances(false));
  }, []);

  // Reset fields when switching type
  const handleTypeSwitch = (t: "used_appliance" | "scrap") => {
    setListingType(t);
    setConditionGrade("");
    setWorkingParts([]);
    setPartInput("");
  };

  const toggleDelivery = (v: string) => {
    setDeliveryMethods(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    );
  };

  const addPart = (p: string) => {
    const trimmed = p.trim();
    if (!trimmed || workingParts.includes(trimmed)) return;
    setWorkingParts(prev => [...prev, trimmed]);
    setPartInput("");
  };

  const removePart = (p: string) => setWorkingParts(prev => prev.filter(x => x !== p));

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setImages(prev => {
      const next = [...prev];
      for (const f of files) {
        if (next.length >= MAX_IMAGES) break;
        next.push({ url: URL.createObjectURL(f), name: f.name });
      }
      return next;
    });
    e.target.value = "";
  };
  const handleRemoveImage = (i: number) => setImages(prev => prev.filter((_, idx) => idx !== i));
  const handleSetClip = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setClip({ url: URL.createObjectURL(f), name: f.name });
    e.target.value = "";
  };

  const handlePartKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addPart(partInput);
    }
  };

  const handleSubmit = async () => {
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError("กรุณาระบุราคา"); return;
    }
    if (listingType === "used_appliance" && !applianceId) {
      setError("กรุณาเลือกเครื่องใช้ไฟฟ้า"); return;
    }
    if (!conditionGrade) { setError("กรุณาระบุเกรดสภาพเครื่อง"); return; }
    if (deliveryMethods.length === 0) { setError("กรุณาเลือกวิธีจัดส่งอย่างน้อย 1 วิธี"); return; }
    if (listingType === "scrap" && workingParts.length === 0) {
      setError("กรุณาระบุชิ้นส่วนที่ใช้งานได้อย่างน้อย 1 รายการ"); return;
    }
    if (images.length < MAX_IMAGES) { setError(`กรุณาเพิ่มรูปสินค้าให้ครบ ${MAX_IMAGES} รูป`); return; }
    if (!clip) { setError("กรุณาเพิ่มคลิปวิดีโอสินค้า 1 คลิป"); return; }
    setError("");
    setSubmitting(true);
    try {
      // contract Backend Part1 (488cae4): create ไม่รับ description — ส่งเฉพาะ field ที่ schema จริงมี
      const body: Parameters<typeof listingsApi.create>[0] = {
        listingType,
        conditionGrade,
        price: Number(price),
        deliveryMethods,
      };
      if (listingType === "used_appliance") {
        body.applianceId = applianceId;
        if (sourceWarranty) body.sourceWarranty = Number(sourceWarranty);
        if (additionalWarranty) body.additionalWarranty = Number(additionalWarranty);
      } else {
        body.workingParts = workingParts;
      }
      const res = await listingsApi.create(body);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      router.push(`/sell/${data.id}`);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  const gradeOptions = listingType === "scrap" ? SCRAP_GRADE_OPTIONS : GRADE_OPTIONS;
  const primaryColor = listingType === "scrap" ? "bg-green-600 hover:bg-green-700" : "bg-weeeu-primary hover:bg-weeeu-dark";
  const ringColor = listingType === "scrap" ? "focus:ring-green-400" : "focus:ring-weeeu-primary/40";

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/sell" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">ประกาศขายใหม่</h1>
      </div>

      {/* Listing type toggle */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ประเภทสินค้า</p>
        <div className="grid grid-cols-2 gap-2">
          {(["used_appliance", "scrap"] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeSwitch(t)}
              className={`py-3 rounded-xl border text-sm font-medium flex flex-col items-center gap-1.5 transition-colors ${
                listingType === t
                  ? t === "scrap"
                    ? "bg-green-600 border-green-600 text-white"
                    : "bg-weeeu-primary border-weeeu-primary text-white"
                  : "border-gray-200 text-gray-600 hover:border-weeeu-primary/40"
              }`}
            >
              <span className="text-xl">{t === "used_appliance" ? "📱" : "♻️"}</span>
              <span className="text-xs text-center leading-tight">
                {t === "used_appliance" ? "เครื่องใช้ไฟฟ้ามือสอง" : "ขายซาก / ชิ้นส่วน"}
              </span>
            </button>
          ))}
        </div>
        {listingType === "scrap" && (
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xs text-green-700 font-medium">♻️ โหมดขายซาก</p>
            <p className="text-xs text-green-600 mt-0.5">ขายเครื่องเก่า / ชิ้นส่วนให้กับร้านซ่อม WeeeR</p>
          </div>
        )}
      </div>

      {/* Appliance selection — used_appliance only */}
      {listingType === "used_appliance" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            เครื่องใช้ไฟฟ้า <span className="text-red-500">*</span>
          </p>
          {loadingAppliances ? (
            <p className="text-sm text-gray-400">กำลังโหลด...</p>
          ) : appliances.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">ไม่พบเครื่องใช้ไฟฟ้าที่ลงทะเบียน</p>
              <Link href="/appliances/add" className="text-xs text-weeeu-primary hover:underline">+ เพิ่มเครื่องใช้ไฟฟ้าก่อน →</Link>
            </div>
          ) : (
            <select
              value={applianceId}
              onChange={e => setApplianceId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/40 bg-white"
            >
              <option value="">— เลือกเครื่อง —</option>
              {appliances.map(a => (
                <option key={a.id} value={a.id}>
                  {a.brand} {a.model} — {a.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Working parts — scrap only */}
      {listingType === "scrap" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            ชิ้นส่วนที่ยังใช้งานได้ <span className="text-red-500">*</span>
          </p>
          <p className="text-xs text-gray-400">พิมพ์ชื่อชิ้นส่วนแล้วกด Enter หรือเลือกจากรายการ</p>

          {workingParts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {workingParts.map(p => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  {p}
                  <button type="button" onClick={() => removePart(p)} className="text-green-600 hover:text-green-800 leading-none">×</button>
                </span>
              ))}
            </div>
          )}

          <input
            ref={partInputRef}
            type="text"
            value={partInput}
            onChange={e => setPartInput(e.target.value)}
            onKeyDown={handlePartKeyDown}
            onBlur={() => partInput.trim() && addPart(partInput)}
            placeholder="เช่น คอมเพรสเซอร์"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          <div className="flex flex-wrap gap-1.5">
            {COMMON_PARTS.filter(p => !workingParts.includes(p)).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => addPart(p)}
                className="text-xs px-2.5 py-1 border border-gray-200 rounded-full text-gray-500 hover:border-green-400 hover:text-green-700 transition-colors"
              >
                + {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Condition grade */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {listingType === "scrap" ? "เกรดซาก" : "เกรดสภาพเครื่อง"} <span className="text-red-500">*</span>
        </p>
        <div className="space-y-2">
          {gradeOptions.map(g => (
            <button
              key={g.value}
              type="button"
              onClick={() => setConditionGrade(g.value)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                conditionGrade === g.value
                  ? listingType === "scrap"
                    ? "bg-green-50 border-green-400 font-medium"
                    : "bg-weeeu-surface border-weeeu-primary font-medium"
                  : "border-gray-200 text-gray-600 hover:border-weeeu-primary/40"
              }`}
            >
              {conditionGrade === g.value && <span className="mr-2">✅</span>}
              <span className={conditionGrade === g.value ? g.color : ""}>{g.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          ราคาขาย (บาท) <span className="text-red-500">*</span>
        </p>
        <input
          type="number"
          min="1"
          value={price}
          onChange={e => setPrice(e.target.value)}
          placeholder={listingType === "scrap" ? "เช่น 500" : "เช่น 3500"}
          className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 ${ringColor}`}
        />
      </div>

      {/* Delivery methods */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          วิธีจัดส่ง <span className="text-red-500">*</span>
        </p>
        <div className="space-y-2">
          {DELIVERY_OPTIONS.map(d => (
            <button
              key={d.value}
              type="button"
              onClick={() => toggleDelivery(d.value)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                deliveryMethods.includes(d.value)
                  ? "bg-weeeu-surface border-weeeu-primary text-weeeu-text font-medium"
                  : "border-gray-200 text-gray-600 hover:border-weeeu-primary/40"
              }`}
            >
              {deliveryMethods.includes(d.value) && <span className="mr-2">✅</span>}
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Warranty — used_appliance only */}
      {listingType === "used_appliance" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">การรับประกัน (เดือน)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">ประกันจากผู้ผลิต</label>
              <input
                type="number" min="0" value={sourceWarranty}
                onChange={e => setSourceWarranty(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/40"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ประกันเพิ่มเติม</label>
              <input
                type="number" min="0" value={additionalWarranty}
                onChange={e => setAdditionalWarranty(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/40"
              />
            </div>
          </div>
        </div>
      )}

      {/* Terms 3 แกน (Mockup — Resell 2.2 Blueprint) */}
      <div className="bg-white rounded-2xl border border-weeeu-primary/20 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">เงื่อนไขการขาย (Terms 3 แกน)</p>
        </div>
        <div className="bg-weeeu-surface rounded-xl p-3">
          <p className="text-xs text-weeeu-text">เงื่อนไขนี้จะแสดงให้ผู้ซื้อเห็นก่อนยื่นข้อเสนอ — เป็น Source of Truth ในกรณีข้อพิพาท</p>
        </div>

        {/* แกน 1: ค่าส่ง */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-600">🚚 ค่าส่ง <span className="text-red-500">*</span></label>
          <div className="space-y-1.5">
            {SHIPPING_POLICY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setShippingPolicy(opt.value)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                  shippingPolicy === opt.value
                    ? "bg-weeeu-surface border-weeeu-primary text-weeeu-text font-medium"
                    : "border-gray-200 text-gray-600 hover:border-weeeu-primary/40"
                }`}
              >
                {shippingPolicy === opt.value && <span className="mr-2">✅</span>}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* แกน 2: รับประกันมือสอง */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-600">🔒 รับประกันมือสอง (วัน หลังรับสินค้า)</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="0"
              value={usedWarrantyDays}
              onChange={e => setUsedWarrantyDays(e.target.value)}
              placeholder="30"
              className="w-32 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/40"
            />
            <span className="text-sm text-gray-500">วัน</span>
            <div className="flex gap-1.5 ml-2">
              {[0, 7, 14, 30, 90].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setUsedWarrantyDays(String(d))}
                  className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                    usedWarrantyDays === String(d)
                      ? "bg-weeeu-primary text-white border-weeeu-primary"
                      : "border-gray-200 text-gray-500 hover:border-weeeu-primary/40"
                  }`}
                >
                  {d === 0 ? "ไม่รับ" : `${d}ว`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* แกน 3: ความรับผิดสินค้าไม่ตรงปก */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-600">⚖️ ความรับผิดกรณีสินค้าไม่ตรงปก <span className="text-red-500">*</span></label>
          <div className="space-y-1.5">
            {LIABILITY_POLICY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLiabilityPolicy(opt.value)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                  liabilityPolicy === opt.value
                    ? "bg-weeeu-surface border-weeeu-primary text-weeeu-text font-medium"
                    : "border-gray-200 text-gray-600 hover:border-weeeu-primary/40"
                }`}
              >
                {liabilityPolicy === opt.value && <span className="mr-2">✅</span>}
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Media — 3 รูป + 1 คลิป (Mockup — local preview, create contract ยังไม่รับ media) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          รูปและคลิปสินค้า <span className="text-red-500">*</span>
        </p>
        <p className="text-xs text-gray-400">เพิ่มรูป {MAX_IMAGES} รูป + คลิปวิดีโอ 1 คลิป เพื่อให้ผู้ซื้อเห็นสภาพจริง</p>

        {/* 3 image slots */}
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: MAX_IMAGES }).map((_, slot) => {
            const img = images[slot];
            return img ? (
              <div key={slot} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={`รูปสินค้า ${slot + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(slot)}
                  className="absolute top-1 right-1 bg-black/50 text-white text-xs w-5 h-5 rounded-full leading-none flex items-center justify-center"
                >×</button>
              </div>
            ) : (
              <button
                key={slot}
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-weeeu-primary/40 hover:text-weeeu-primary transition-colors"
              >
                <span className="text-xl">📷</span>
                <span className="text-[10px] mt-0.5">รูป {slot + 1}</span>
              </button>
            );
          })}
        </div>
        <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleAddImage} className="hidden" />

        {/* 1 clip slot */}
        {clip ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-200">
            <video src={clip.url} className="w-full max-h-48 bg-black" controls />
            <button
              type="button"
              onClick={() => setClip(null)}
              className="absolute top-1 right-1 bg-black/50 text-white text-xs w-5 h-5 rounded-full leading-none flex items-center justify-center"
            >×</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => clipInputRef.current?.click()}
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center gap-2 text-gray-400 hover:border-weeeu-primary/40 hover:text-weeeu-primary transition-colors text-sm"
          >
            <span className="text-lg">🎬</span> เพิ่มคลิปวิดีโอ (1 คลิป)
          </button>
        )}
        <input ref={clipInputRef} type="file" accept="video/*" onChange={handleSetClip} className="hidden" />
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {listingType === "scrap" ? "รายละเอียดซาก" : "รายละเอียดเพิ่มเติม"}
        </p>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={listingType === "scrap"
            ? "เช่น แอร์ใช้งาน 8 ปี คอมเพรสเซอร์ยังดี แผงบางส่วนเสีย"
            : "เช่น ซื้อมา 2 ปี ใช้งานน้อย มีกล่องและอุปกรณ์ครบ"}
          rows={3}
          className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 ${ringColor} resize-none`}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className={`w-full disabled:opacity-60 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2 ${primaryColor}`}
      >
        {submitting
          ? <><span className="animate-spin">⟳</span> กำลังประกาศ...</>
          : listingType === "scrap"
            ? "♻️ ประกาศขายซาก"
            : "📦 ประกาศขาย"}
      </button>
    </div>
  );
}
