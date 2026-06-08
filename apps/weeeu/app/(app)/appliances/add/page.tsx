"use client";
// ─── เพิ่มเครื่องใช้ไฟฟ้า (/appliances/add) — CMD A3 Set 3
// แปลงจาก server component → client: เพิ่ม category select + capacity + onSubmit mock

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const categories = [
  { id: "ac",     icon: "❄️", label: "แอร์" },
  { id: "fridge", icon: "🧊", label: "ตู้เย็น" },
  { id: "washer", icon: "🫧", label: "เครื่องซักผ้า" },
  { id: "tv",     icon: "📺", label: "โทรทัศน์" },
  { id: "micro",  icon: "📡", label: "ไมโครเวฟ" },
  { id: "water",  icon: "💧", label: "เครื่องทำน้ำร้อน" },
  { id: "other",  icon: "🔌", label: "อื่นๆ" },
];

// U-34b — brand dropdown by category (3.1 brand select)
const BRANDS_BY_CATEGORY: Record<string, string[]> = {
  ac:     ["Daikin", "Mitsubishi", "Carrier", "Panasonic", "LG", "Samsung", "Sharp", "Toshiba", "อื่นๆ"],
  fridge: ["Samsung", "LG", "Sharp", "Mitsubishi", "Hitachi", "Haier", "Panasonic", "อื่นๆ"],
  washer: ["LG", "Samsung", "Panasonic", "Sharp", "Haier", "Whirlpool", "Toshiba", "อื่นๆ"],
  tv:     ["Samsung", "LG", "Sony", "Sharp", "Hisense", "TCL", "Philips", "อื่นๆ"],
  micro:  ["Samsung", "Panasonic", "Sharp", "LG", "Toshiba", "อื่นๆ"],
  water:  ["Ariston", "Rheem", "AO Smith", "Panasonic", "อื่นๆ"],
  other:  ["อื่นๆ"],
};

export default function AddAppliancePage() {
  const router = useRouter();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [selectedCat, setSelectedCat] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [capacity, setCapacity] = useState("");     // CMD A3 — ขนาด/กำลัง
  const [installDate, setInstallDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [serial, setSerial] = useState("");
  const [warrantyUntil, setWarrantyUntil] = useState("");
  const [notes, setNotes] = useState("");

  // ── Submit state ───────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  // ── onSubmit mock (CMD A3 spec) ────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setToast("บันทึกเครื่องใช้ไฟฟ้าแล้ว (Mockup)");
    setTimeout(() => {
      setSubmitting(false);
      router.push("/appliances");
    }, 1500);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-xs px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/appliances" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          ←
        </Link>
        <h1 className="text-xl font-bold text-gray-900">เพิ่มเครื่องใช้ไฟฟ้า</h1>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">ประเภทเครื่องใช้ไฟฟ้า</label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.id)}
                className={`flex flex-col items-center gap-1 p-3 border-2 rounded-xl transition-all ${
                  selectedCat === cat.id
                    ? "border-weeeu-primary bg-weeeu-surface"
                    : "border-gray-100 hover:border-weeeu-dark hover:bg-weeeu-surface"
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium text-gray-600">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเครื่อง (ตั้งเอง)</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="เช่น แอร์ห้องนอน, ตู้เย็นครัว"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-weeeu-primary text-sm"
          />
        </div>

        {/* Brand + Model */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ยี่ห้อ</label>
            {/* U-34b: brand dropdown ตามประเภทที่เลือก (3.1) */}
            <select
              value={brand}
              onChange={e => setBrand(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-weeeu-primary text-sm bg-white"
            >
              <option value="">— เลือกยี่ห้อ —</option>
              {(BRANDS_BY_CATEGORY[selectedCat] ?? BRANDS_BY_CATEGORY.other).map(b => (
                <option key={b} value={b === "อื่นๆ" ? "__other__" : b}>{b}</option>
              ))}
            </select>
            {/* แสดง text input เมื่อเลือก "อื่นๆ" */}
            {brand === "__other__" && (
              <input
                type="text"
                value=""
                onChange={e => setBrand(e.target.value)}
                placeholder="ระบุยี่ห้อ..."
                autoFocus
                className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-weeeu-primary text-sm"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รุ่น</label>
            <input
              type="text"
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder="เช่น MSY-GN13VF"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-weeeu-primary text-sm"
            />
          </div>
        </div>

        {/* Capacity (CMD A3 — ขนาด/กำลัง) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ขนาด / กำลัง</label>
          <input
            type="text"
            value={capacity}
            onChange={e => setCapacity(e.target.value)}
            placeholder="เช่น 9,000 BTU / 8 KG / 420 ลิตร"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-weeeu-primary text-sm"
          />
        </div>

        {/* Install date + Purchase price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ติดตั้ง</label>
            <input
              type="date"
              value={installDate}
              onChange={e => setInstallDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-weeeu-primary text-sm text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ราคาที่ซื้อ (บาท)</label>
            <input
              type="number"
              value={purchasePrice}
              onChange={e => setPurchasePrice(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-weeeu-primary text-sm"
            />
          </div>
        </div>

        {/* Serial + Warranty */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเลขเครื่อง (Serial Number)</label>
            <input
              type="text"
              value={serial}
              onChange={e => setSerial(e.target.value)}
              placeholder="ไม่บังคับ"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-weeeu-primary text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันหมดประกัน</label>
            <input
              type="date"
              value={warrantyUntil}
              onChange={e => setWarrantyUntil(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-weeeu-primary text-sm text-gray-500"
            />
          </div>
        </div>

        {/* Photo (mock upload UI) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพเครื่อง</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-weeeu-dark cursor-pointer transition-colors">
            <span className="text-3xl">📷</span>
            <p className="text-sm text-gray-500 mt-2">คลิกเพื่ออัปโหลดรูป (Mockup)</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG สูงสุด 5MB</p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ (ไม่บังคับ)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="รายละเอียดเพิ่มเติม..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-weeeu-primary text-sm resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Link
            href="/appliances"
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 text-center"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-[2] py-3 bg-weeeu-primary hover:bg-weeeu-dark disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <><span className="animate-spin">⟳</span> กำลังบันทึก...</> : "บันทึกเครื่องใช้ไฟฟ้า"}
          </button>
        </div>

      </form>
    </div>
  );
}
