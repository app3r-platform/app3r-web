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
    setError("");
    setSubmitting(true);
    try {
      const body: Parameters<typeof listingsApi.create>[0] = {
        listing_type: listingType,
        condition_grade: conditionGrade,
        price: Number(price),
        delivery_methods: deliveryMethods,
        description: description.trim() || undefined,
      };
      if (listingType === "used_appliance") {
        body.appliance_id = applianceId;
        if (sourceWarranty) body.source_warranty = Number(sourceWarranty);
        if (additionalWarranty) body.additional_warranty = Number(additionalWarranty);
      } else {
        body.working_parts = workingParts;
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
                    : "bg-indigo-600 border-indigo-600 text-white"
                  : "border-gray-200 text-gray-600 hover:border-indigo-300"
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
            <p className="text-sm text-gray-400">ไม่พบเครื่องใช้ไฟฟ้าที่ลงทะเบียน</p>
          ) : (
            <select
              value={applianceId}
              onChange={e => setApplianceId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
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

          {/* Chips */}
          {workingParts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {workingParts.map(p => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  {p}
                  <button
                    type="button"
                    onClick={() => removePart(p)}
                    className="text-green-600 hover:text-green-800 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Text input */}
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

          {/* Quick-add common parts */}
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
                    : "bg-indigo-50 border-indigo-400 font-medium"
                  : "border-gray-200 text-gray-600 hover:border-indigo-200"
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
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                  ? "bg-indigo-50 border-indigo-400 text-indigo-800 font-medium"
                  : "border-gray-200 text-gray-600 hover:border-indigo-200"
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
                type="number"
                min="0"
                value={sourceWarranty}
                onChange={e => setSourceWarranty(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ประกันเพิ่มเติม</label>
              <input
                type="number"
                min="0"
                value={additionalWarranty}
                onChange={e => setAdditionalWarranty(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
        </div>
      )}

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
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
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
        className={`w-full disabled:opacity-60 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2 ${
          listingType === "scrap"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-indigo-600 hover:bg-indigo-700"
        }`}
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
