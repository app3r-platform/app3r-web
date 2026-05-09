"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { resellApi } from "../../_lib/api";
import type { ApplianceCondition } from "../../_lib/types";
import { useBarcodeScanner } from "../../_hooks/useBarcodeScanner";

const CATEGORIES = ["เครื่องปรับอากาศ", "ตู้เย็น", "เครื่องซักผ้า", "ทีวี", "อื่นๆ"];

export default function ResellInventoryNewPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState<ApplianceCondition>("good");
  const [costPrice, setCostPrice] = useState("");
  const [suggestedPrice, setSuggestedPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { supported, state: scanState, result: scanResult, videoRef, startScan, stopScan } = useBarcodeScanner();
  const [showScanner, setShowScanner] = useState(false);

  function handleScanResult(value: string) {
    setSku(value);
    setShowScanner(false);
    // Try SKU lookup
    resellApi.inventoryLookupSku(value)
      .then(d => {
        if (d?.name) setName(d.name);
        if (d?.brand) setBrand(d.brand ?? "");
        if (d?.model) setModel(d.model ?? "");
      })
      .catch(() => {/* silent */});
  }

  // When scanner returns result, apply it
  if (scanResult && sku !== scanResult) {
    handleScanResult(scanResult);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "กรุณากรอกชื่อสินค้า";
    if (!costPrice || Number(costPrice) < 0) e.costPrice = "กรุณากรอกราคาทุน";
    if (!suggestedPrice || Number(suggestedPrice) < 0) e.suggestedPrice = "กรุณากรอกราคาขาย";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    setError("");
    try {
      const created = await resellApi.inventoryCreate({
        name: name.trim(),
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        sku: sku.trim() || undefined,
        category,
        condition,
        costPrice: Number(costPrice),
        suggestedPrice: Number(suggestedPrice),
        imageUrl: imageUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        source: { type: "manual" },
      });
      router.push(`/resell/inventory/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/resell/inventory" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">เพิ่มสินค้ามือสอง</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-100 rounded-2xl p-5">

        {/* SKU + Barcode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Barcode</label>
          <div className="flex gap-2">
            <input type="text" value={sku} onChange={e => setSku(e.target.value)}
              placeholder="กรอก SKU หรือสแกน Barcode"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400" />
            {supported ? (
              <button type="button"
                onClick={() => { setShowScanner(s => !s); if (!showScanner) startScan(); else stopScan(); }}
                className="shrink-0 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
                {showScanner ? "ปิด" : "📷 สแกน"}
              </button>
            ) : (
              <span className="shrink-0 text-xs text-gray-400 self-center px-2">ไม่รองรับสแกน</span>
            )}
          </div>
          {/* Camera feed */}
          {showScanner && (
            <div className="mt-2 rounded-xl overflow-hidden border border-blue-200 bg-black relative">
              <video ref={videoRef} className="w-full max-h-48 object-cover" muted playsInline />
              {scanState === "scanning" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-blue-400 w-40 h-24 rounded-lg opacity-60" />
                </div>
              )}
              {scanState === "error" && (
                <p className="text-xs text-red-400 text-center p-2">เปิดกล้องไม่ได้ — กรอก SKU เอง</p>
              )}
            </div>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ชื่อสินค้า <span className="text-red-500">*</span>
          </label>
          <input type="text" value={name} onChange={e => { setName(e.target.value); setFormErrors(f => ({ ...f, name: "" })); }}
            placeholder="เช่น เครื่องปรับอากาศ Samsung 9000 BTU"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${formErrors.name ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
        </div>

        {/* Brand + Model */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ยี่ห้อ</label>
            <input type="text" value={brand} onChange={e => setBrand(e.target.value)}
              placeholder="Samsung"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รุ่น</label>
            <input type="text" value={model} onChange={e => setModel(e.target.value)}
              placeholder="AR09TYHQASINST"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Condition */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">สภาพ</p>
          <div className="flex gap-2">
            {([
              { value: "like_new", label: "เหมือนใหม่" },
              { value: "good", label: "สภาพดี" },
              { value: "fair", label: "พอใช้" },
            ] as { value: ApplianceCondition; label: string }[]).map(c => (
              <label key={c.value}
                className={`flex-1 text-center py-2 rounded-xl border-2 cursor-pointer text-xs font-medium transition-all
                  ${condition === c.value ? "border-blue-300 bg-blue-50 text-blue-800" : "border-gray-100 text-gray-600"}`}>
                <input type="radio" className="sr-only" checked={condition === c.value} onChange={() => setCondition(c.value)} />
                {c.label}
              </label>
            ))}
          </div>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ราคาทุน (pts) <span className="text-red-500">*</span>
            </label>
            <input type="number" min={0} value={costPrice}
              onChange={e => { setCostPrice(e.target.value); setFormErrors(f => ({ ...f, costPrice: "" })); }}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${formErrors.costPrice ? "border-red-400" : "border-gray-200"}`} />
            {formErrors.costPrice && <p className="text-xs text-red-500 mt-1">{formErrors.costPrice}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ราคาขาย (pts) <span className="text-red-500">*</span>
            </label>
            <input type="number" min={0} value={suggestedPrice}
              onChange={e => { setSuggestedPrice(e.target.value); setFormErrors(f => ({ ...f, suggestedPrice: "" })); }}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${formErrors.suggestedPrice ? "border-red-400" : "border-gray-200"}`} />
            {formErrors.suggestedPrice && <p className="text-xs text-red-500 mt-1">{formErrors.suggestedPrice}</p>}
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL รูปภาพ (ถ้ามี)</label>
          <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
            placeholder="https://…"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            rows={2} placeholder="รายละเอียดเพิ่มเติม สภาพจริง ข้อบกพร่อง ฯลฯ"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
          {submitting ? "กำลังบันทึก…" : "📦 เพิ่มสินค้า"}
        </button>
      </form>
    </div>
  );
}
