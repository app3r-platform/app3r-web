"use client";

// ── WeeeR Resell Buy — B6 Used Pricing Wizard + Barcode (2.2 Mockup) ─────────
// B6: ร้านตีราคารับซื้อมือสองจากลูกค้า (U→R)
// Wizard: iPhone / Notebook / เครื่องซักผ้า / แอร์
// Barcode: สแกน SKU เพิ่มเข้า inventory (mock)

import { useState } from "react";
import Link from "next/link";

// ── Mock pricing tables (Mockup) ──────────────────────────────────────────────
type DeviceType = "iphone" | "notebook" | "washing_machine" | "ac";
type Condition = "like_new" | "good" | "fair" | "broken";

const DEVICE_TYPES: { value: DeviceType; label: string; icon: string }[] = [
  { value: "iphone", label: "iPhone",      icon: "📱" },
  { value: "notebook", label: "โน้ตบุ๊ก",  icon: "💻" },
  { value: "washing_machine", label: "เครื่องซักผ้า", icon: "🫧" },
  { value: "ac", label: "แอร์",           icon: "❄️" },
];

const CONDITION_OPTS: { value: Condition; label: string; multiplier: number }[] = [
  { value: "like_new", label: "เหมือนใหม่ (95%+)", multiplier: 0.75 },
  { value: "good",     label: "สภาพดี (80-94%)",   multiplier: 0.60 },
  { value: "fair",     label: "พอใช้ (60-79%)",     multiplier: 0.45 },
  { value: "broken",   label: "เสีย/ซ่อม",          multiplier: 0.20 },
];

// Mock base prices (Mockup)
const BASE_PRICES: Record<DeviceType, Record<string, number>> = {
  iphone: {
    "iPhone 16 Pro Max": 42000,
    "iPhone 16 Pro": 37000,
    "iPhone 15 Pro Max": 33000,
    "iPhone 15 Pro": 28000,
    "iPhone 14 Pro": 22000,
    "iPhone 13 Pro": 16000,
    "iPhone 13": 12000,
    "iPhone SE (2022)": 8000,
  },
  notebook: {
    "MacBook Pro M3 14\"": 55000,
    "MacBook Air M2": 32000,
    "MacBook Air M1": 22000,
    "Dell XPS 15 (2023)": 35000,
    "Asus ROG Zephyrus G14": 28000,
    "Lenovo ThinkPad X1": 24000,
    "HP Spectre x360": 20000,
  },
  washing_machine: {
    "Samsung 15kg Front Load": 18000,
    "LG 12kg TWINWash": 14000,
    "Panasonic 10kg Top Load": 8000,
    "Sharp 9kg Top Load": 6000,
  },
  ac: {
    "Daikin Inverter 18000BTU": 16000,
    "Mitsubishi 18000BTU": 14000,
    "LG Inverter 12000BTU": 10000,
    "Samsung 9000BTU": 7000,
  },
};

// Mock barcode DB
const BARCODE_DB: Record<string, { name: string; brand: string; sku: string; suggestedPrice: number }> = {
  "8851234567890": { name: "Samsung Galaxy Tab S9", brand: "Samsung", sku: "SKU-TAB-001", suggestedPrice: 15000 },
  "8851234567891": { name: "Sony WH-1000XM5", brand: "Sony", sku: "SKU-AUD-002", suggestedPrice: 8500 },
  "8851234567892": { name: "iPad Pro 11\" M2", brand: "Apple", sku: "SKU-TAB-002", suggestedPrice: 18000 },
  "0194252708988": { name: "iPhone 14 Pro 256GB", brand: "Apple", sku: "SKU-PHN-003", suggestedPrice: 22000 },
};

type WizardStep = 1 | 2 | 3 | 4;

export default function ResellBuyPage() {
  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [deviceType, setDeviceType] = useState<DeviceType>("iphone");
  const [model, setModel] = useState("");
  const [condition, setCondition] = useState<Condition>("good");
  const [notes, setNotes] = useState("");
  const [offerPrice, setOfferPrice] = useState<number | null>(null);
  const [wizardDone, setWizardDone] = useState(false);

  // Barcode state
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeResult, setBarcodeResult] = useState<typeof BARCODE_DB[string] | null>(null);
  const [barcodeNotFound, setBarcodeNotFound] = useState(false);
  const [barcodeDone, setBarcodeDone] = useState(false);

  const models = Object.keys(BASE_PRICES[deviceType] ?? {});
  const basePrice = model ? (BASE_PRICES[deviceType]?.[model] ?? 0) : 0;
  const condMult = CONDITION_OPTS.find(c => c.value === condition)?.multiplier ?? 0.6;
  const estimatedBuy = Math.round(basePrice * condMult / 100) * 100;

  function handleWizardNext() {
    if (wizardStep === 2) {
      setOfferPrice(estimatedBuy);
      setWizardStep(3);
    } else if (wizardStep === 3) {
      setWizardStep(4);
    } else if (wizardStep === 4) {
      setWizardDone(true);
    } else {
      setWizardStep((wizardStep + 1) as WizardStep);
    }
  }

  function lookupBarcode() {
    const found = BARCODE_DB[barcodeInput.trim()];
    if (found) {
      setBarcodeResult(found);
      setBarcodeNotFound(false);
    } else {
      setBarcodeResult(null);
      setBarcodeNotFound(true);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/resell" className="text-gray-400 hover:text-gray-600">←</Link>
        <div>
          {/* §7 เคส B6 */}
          <h1 className="text-xl font-bold text-gray-900">📥 รับซื้อมือสอง</h1>
          <p className="text-xs text-gray-500 mt-0.5">ตีราคารับซื้อ + สแกนบาร์โค้ด (Barcode) เพิ่มเข้าสต๊อก</p>
        </div>
      </div>

      {/* ────────────── B6 Pricing Wizard Entry Point (Generic-First) ──── */}
      <Link href="/resell/buy/wizard"
        className="flex items-center justify-between bg-[#FCEAE3] border border-[#FFD5C4] rounded-2xl p-5 hover:bg-[#FAD9CB] transition-colors group">
        <div className="space-y-1">
          <p className="text-sm font-bold text-[#4A1B0C]">🧮 ประเมินราคารับซื้อ — ตัวช่วยทั่วไป (Generic Wizard)</p>
          <p className="text-xs text-[#7A3A20]">5 ขั้น · แบบทั่วไปก่อน (Generic-First) · รองรับทุกประเภทสินค้า</p>
          <p className="text-xs text-[#AA5030]">applies_when · reject_rules ทำงานอัตโนมัติ</p>
        </div>
        <span className="text-[#FF663A] text-2xl group-hover:translate-x-1 transition-transform">→</span>
      </Link>

      {/* ────────────── B6 WIZARD (Legacy 4-step Hardcoded) ─────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-bold text-[#FF663A]">ตัวช่วย B6 (Wizard)</span>
          <span className="text-xs text-gray-400">— ตีราคารับซื้อ U→R</span>
          {[1,2,3,4].map(s => (
            <div key={s} className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold
              ${wizardStep >= s ? "bg-[#FF663A] text-white" : "bg-gray-100 text-gray-400"}`}>
              {s}
            </div>
          ))}
        </div>

        {wizardDone ? (
          <div className="text-center py-6 space-y-3">
            <span className="text-4xl">✅</span>
            <p className="text-base font-bold text-gray-800">เพิ่มเข้าสต๊อกแล้ว</p>
            <p className="text-sm text-gray-500">{model} · รับซื้อ {offerPrice?.toLocaleString()} pts</p>
            <div className="flex gap-2 justify-center mt-2">
              <Link href="/resell/inventory"
                className="text-xs bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold px-4 py-2 rounded-lg transition-colors">
                ดู Inventory
              </Link>
              <button onClick={() => { setWizardStep(1); setModel(""); setWizardDone(false); setOfferPrice(null); }}
                className="text-xs border border-gray-200 text-gray-600 font-medium px-4 py-2 rounded-lg hover:bg-gray-50">
                รับซื้อชิ้นต่อไป
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Step 1: เลือกประเภท */}
            {wizardStep === 1 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">ขั้น 1: เลือกประเภทอุปกรณ์</p>
                <div className="grid grid-cols-2 gap-2">
                  {DEVICE_TYPES.map(d => (
                    <button key={d.value} onClick={() => { setDeviceType(d.value); setModel(""); }}
                      className={`p-3 rounded-xl border-2 text-left transition-all
                        ${deviceType === d.value ? "border-[#FF663A] bg-[#FCEAE3]" : "border-gray-100 hover:border-gray-200"}`}>
                      <p className="text-xl">{d.icon}</p>
                      <p className="text-sm font-medium text-gray-800 mt-1">{d.label}</p>
                    </button>
                  ))}
                </div>
                <button onClick={handleWizardNext}
                  className="w-full bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold py-3 rounded-xl transition-colors">
                  ถัดไป →
                </button>
              </div>
            )}

            {/* Step 2: กรอกรุ่น + สภาพ */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-700">ขั้น 2: รุ่น + สภาพ</p>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">รุ่น</label>
                  <select value={model} onChange={e => setModel(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]/30">
                    <option value="">— เลือกรุ่น —</option>
                    {models.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">สภาพ</label>
                  <div className="space-y-2">
                    {CONDITION_OPTS.map(c => (
                      <label key={c.value}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition-all
                          ${condition === c.value ? "border-[#FF663A] bg-[#FCEAE3]" : "border-gray-100"}`}>
                        <input type="radio" className="sr-only" checked={condition === c.value} onChange={() => setCondition(c.value)} />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                          ${condition === c.value ? "border-[#FF663A]" : "border-gray-300"}`}>
                          {condition === c.value && <div className="w-2 h-2 rounded-full bg-[#FF663A]" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{c.label}</p>
                        </div>
                        <span className="text-xs text-gray-400">{Math.round(c.multiplier * 100)}%</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">หมายเหตุ (ถ้ามี)</label>
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="เช่น มีตำหนิที่หน้าจอ, ไม่มีกล่อง…"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]/30" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setWizardStep(1)}
                    className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50">
                    ← ย้อนกลับ
                  </button>
                  <button onClick={handleWizardNext} disabled={!model}
                    className="flex-1 bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                    ดูราคา →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: ราคาประเมิน */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-700">ขั้น 3: ราคาประเมิน</p>
                <div className="bg-[#FCEAE3] border border-[#FFD5C4] rounded-2xl p-5 text-center">
                  <p className="text-xs text-gray-500 mb-1">{model}</p>
                  <p className="text-xs text-gray-400 mb-3">สภาพ: {CONDITION_OPTS.find(c=>c.value===condition)?.label}</p>
                  <p className="text-4xl font-bold text-[#FF663A]">{estimatedBuy.toLocaleString()}</p>
                  <p className="text-sm text-[#FF9C80] mt-1">pts (ราคาตีรับซื้อ)</p>
                  <p className="text-xs text-gray-400 mt-2">ราคาตลาด ~{basePrice.toLocaleString()} pts · {Math.round(condMult*100)}%</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">ปรับราคาเอง (ถ้าต้องการ)</label>
                  <input type="number" value={offerPrice ?? estimatedBuy}
                    onChange={e => setOfferPrice(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]/30" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setWizardStep(2)}
                    className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50">
                    ← ย้อนกลับ
                  </button>
                  <button onClick={handleWizardNext}
                    className="flex-1 bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                    ยืนยันราคา →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: ยืนยัน + เพิ่ม inventory */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-700">ขั้น 4: ยืนยันและเพิ่มสต๊อก</p>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">ประเภท</span>
                    <span className="font-medium">{DEVICE_TYPES.find(d=>d.value===deviceType)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">รุ่น</span>
                    <span className="font-medium">{model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">สภาพ</span>
                    <span className="font-medium">{CONDITION_OPTS.find(c=>c.value===condition)?.label}</span>
                  </div>
                  {notes && <div className="flex justify-between"><span className="text-gray-500">หมายเหตุ</span><span className="font-medium">{notes}</span></div>}
                  <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                    <span className="text-gray-700 font-semibold">ราคาตีรับซื้อ</span>
                    <span className="font-bold text-[#FF663A] text-lg">{(offerPrice ?? estimatedBuy).toLocaleString()} pts</span>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs text-amber-700">📋 สินค้านี้จะถูกเพิ่มเข้า inventory ด้วยสถานะ <strong>in_stock</strong> — สามารถประกาศขายต่อได้ทันที</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setWizardStep(3)}
                    className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50">
                    ← ย้อนกลับ
                  </button>
                  <button onClick={handleWizardNext}
                    className="flex-1 bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                    ✅ บันทึกรับซื้อ
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ────────────── BARCODE SCANNER ───────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <p className="text-sm font-bold text-gray-800 mb-1">📷 สแกนบาร์โค้ด (Barcode) / SKU</p>
        <p className="text-xs text-gray-400 mb-4">พิมพ์บาร์โค้ด (barcode) หรือ SKU เพื่อค้นหาและเพิ่มเข้าคลัง (inventory)</p>

        <div className="flex gap-2 mb-4">
          <input type="text" value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && lookupBarcode()}
            placeholder="พิมพ์ barcode / SKU…"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF663A]/30" />
          <button onClick={lookupBarcode}
            className="bg-[#FF663A] hover:bg-[#D8491F] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
            ค้นหา
          </button>
        </div>

        <div className="text-xs text-gray-400 mb-3">ทดลอง: <code className="bg-gray-100 px-1 rounded">8851234567890</code> · <code className="bg-gray-100 px-1 rounded">0194252708988</code></div>

        {barcodeNotFound && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-700">❌ ไม่พบสินค้าในระบบ — เพิ่มด้วยตัวช่วย B6 (Wizard) หรือ <Link href="/resell/inventory/new" className="underline">เพิ่มด้วยตนเอง</Link></p>
          </div>
        )}

        {barcodeResult && !barcodeDone && (
          <div className="bg-[#FCEAE3] border border-[#FFD5C4] rounded-xl p-4 space-y-3">
            <p className="text-sm font-bold text-[#4A1B0C]">✅ พบสินค้า</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><p className="text-xs text-gray-400">ชื่อ</p><p className="font-medium">{barcodeResult.name}</p></div>
              <div><p className="text-xs text-gray-400">ยี่ห้อ</p><p className="font-medium">{barcodeResult.brand}</p></div>
              <div><p className="text-xs text-gray-400">SKU</p><p className="font-medium font-mono">{barcodeResult.sku}</p></div>
              <div><p className="text-xs text-gray-400">ราคาแนะนำ</p><p className="font-bold text-[#FF663A]">{barcodeResult.suggestedPrice.toLocaleString()} pts</p></div>
            </div>
            <button onClick={() => setBarcodeDone(true)}
              className="w-full bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
              ✅ ยืนยันรับซื้อ + เพิ่ม Inventory
            </button>
          </div>
        )}

        {barcodeDone && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-base font-bold text-green-700">✅ เพิ่มเข้าคลังสินค้า (Inventory) แล้ว</p>
            <p className="text-xs text-gray-500 mt-1">{barcodeResult?.name}</p>
            <button onClick={() => { setBarcodeDone(false); setBarcodeResult(null); setBarcodeInput(""); }}
              className="mt-3 text-xs text-[#FF663A] hover:underline">สแกนชิ้นต่อไป</button>
          </div>
        )}
      </div>
    </div>
  );
}
