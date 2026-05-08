"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { pickupApi } from "@/lib/api";
import { SignaturePad } from "@/components/SignaturePad";
import { PICKUP_CONDITION_ITEMS } from "@/lib/types";
import type { PickupConditionItem } from "@/lib/types";

export default function PickupReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [serialNumber, setSerialNumber] = useState("");
  const [accessories, setAccessories] = useState("");
  const [conditionCheck, setConditionCheck] = useState<PickupConditionItem[]>([]);
  const [notes, setNotes] = useState("");
  const [techSig, setTechSig] = useState<string | null>(null);
  const [custSig, setCustSig] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCondition(item: PickupConditionItem) {
    setConditionCheck((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }

  async function handleSubmit() {
    if (!techSig) {
      setError("กรุณาเซ็นชื่อช่างก่อน");
      return;
    }
    if (!custSig) {
      setError("กรุณาให้ลูกค้าเซ็นชื่อก่อน");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      if (serialNumber.trim()) fd.append("serial_number", serialNumber.trim());
      const accList = accessories
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      accList.forEach((a) => fd.append("accessories", a));
      conditionCheck.forEach((c) => fd.append("condition_check", c));
      fd.append("tech_signature", techSig);
      fd.append("customer_signature", custSig);
      if (notes.trim()) fd.append("notes", notes.trim());
      await pickupApi.pickupReceipt(id, fd);
      router.replace(`/jobs/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pt-5 pb-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white text-lg"
        >
          ←
        </button>
        <div>
          <h1 className="text-white font-bold text-lg">ใบรับมอบเครื่อง</h1>
          <p className="text-xs text-gray-400">บันทึกข้อมูลและรับลายเซ็น</p>
        </div>
      </div>

      {/* Serial number */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-white">
          Serial Number <span className="text-gray-500 font-normal">(ถ้ามี)</span>
        </label>
        <input
          type="text"
          placeholder="เช่น SN1234567890"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* Accessories */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-white">
          อุปกรณ์ที่มาพร้อมกัน <span className="text-gray-500 font-normal">(คั่นด้วยจุลภาค)</span>
        </label>
        <input
          type="text"
          placeholder="เช่น สายไฟ, รีโมท, คู่มือ"
          value={accessories}
          onChange={(e) => setAccessories(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* Condition checklist */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-white">ตรวจสอบสภาพ</p>
        <div className="space-y-2">
          {PICKUP_CONDITION_ITEMS.map((item) => (
            <button
              key={item}
              onClick={() => toggleCondition(item)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-colors ${
                conditionCheck.includes(item)
                  ? "bg-green-900/40 border-green-700 text-green-300"
                  : "bg-gray-800 border-gray-700 text-gray-300"
              }`}
            >
              <span className="text-lg leading-none">
                {conditionCheck.includes(item) ? "✅" : "⬜"}
              </span>
              <span>{item}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-white">
          หมายเหตุ <span className="text-gray-500 font-normal">(ถ้ามี)</span>
        </label>
        <textarea
          rows={3}
          placeholder="บันทึกเพิ่มเติม..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
        />
      </div>

      {/* Tech signature */}
      <SignaturePad label="ลายเซ็นช่าง" onChange={setTechSig} />

      {/* Customer signature */}
      <SignaturePad label="ลายเซ็นลูกค้า" onChange={setCustSig} />

      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !techSig || !custSig}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors"
      >
        {loading ? "กำลังบันทึก..." : "📋 ยืนยันใบรับมอบเครื่อง"}
      </button>
    </div>
  );
}
