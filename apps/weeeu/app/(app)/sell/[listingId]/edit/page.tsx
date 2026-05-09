"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { listingsApi } from "@/lib/api/listings";

const DELIVERY_OPTIONS = [
  { value: "on_site", label: "ส่งเอง / นัดรับ" },
  { value: "parcel", label: "ส่งพัสดุ (ขนส่ง)" },
];

const COMMON_PARTS = ["คอมเพรสเซอร์", "มอเตอร์", "แผงวงจร PCB", "หน้าจอ", "ปั๊มน้ำ", "ฮีตเตอร์", "ถัง", "ฝาครอบ", "สายไฟ", "รีโมท"];

export default function SellEditPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const router = useRouter();
  const partInputRef = useRef<HTMLInputElement>(null);

  const [listingType, setListingType] = useState<"used_appliance" | "scrap">("used_appliance");
  const [price, setPrice] = useState("");
  const [deliveryMethods, setDeliveryMethods] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [workingParts, setWorkingParts] = useState<string[]>([]);
  const [partInput, setPartInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listingsApi.get(listingId)
      .then(l => {
        if (l.status !== "announced") {
          router.replace(`/sell/${listingId}`);
          return;
        }
        setListingType(l.listingType);
        setPrice(String(l.price));
        setDeliveryMethods(l.deliveryMethods);
        setDescription(l.description ?? "");
        setWorkingParts(l.workingParts ?? []);
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลได้"))
      .finally(() => setLoading(false));
  }, [listingId, router]);

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

  const handleSave = async () => {
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError("กรุณาระบุราคาที่ถูกต้อง"); return;
    }
    if (deliveryMethods.length === 0) {
      setError("กรุณาเลือกวิธีจัดส่งอย่างน้อย 1 วิธี"); return;
    }
    if (listingType === "scrap" && workingParts.length === 0) {
      setError("กรุณาระบุชิ้นส่วนที่ใช้งานได้อย่างน้อย 1 รายการ"); return;
    }
    setError("");
    setSubmitting(true);
    try {
      const body: Parameters<typeof listingsApi.update>[1] = {
        price: Number(price),
        delivery_methods: deliveryMethods,
        description: description.trim() || undefined,
      };
      if (listingType === "scrap") body.working_parts = workingParts;
      const res = await listingsApi.update(listingId, body);
      if (!res.ok) throw new Error(await res.text());
      router.push(`/sell/${listingId}`);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/sell/${listingId}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">
          {listingType === "scrap" ? "แก้ไขประกาศขายซาก" : "แก้ไขประกาศ"}
        </h1>
      </div>

      {listingType === "scrap" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-xs text-green-700 font-medium">♻️ โหมดขายซาก — แก้ไขได้เฉพาะ ราคา / จัดส่ง / ชิ้นส่วน / รายละเอียด</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

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
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Delivery */}
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

      {/* Working parts — scrap only */}
      {listingType === "scrap" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            ชิ้นส่วนที่ยังใช้งานได้ <span className="text-red-500">*</span>
          </p>
          {workingParts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {workingParts.map(p => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  {p}
                  <button type="button" onClick={() => removePart(p)} className="text-green-600 hover:text-green-800">×</button>
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
            placeholder="เพิ่มชิ้นส่วน แล้วกด Enter"
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

      {/* Description */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">รายละเอียดเพิ่มเติม</p>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={submitting}
        className={`w-full disabled:opacity-60 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2 ${
          listingType === "scrap" ? "bg-green-600 hover:bg-green-700" : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        {submitting ? <><span className="animate-spin">⟳</span> กำลังบันทึก...</> : "💾 บันทึกการแก้ไข"}
      </button>
    </div>
  );
}
