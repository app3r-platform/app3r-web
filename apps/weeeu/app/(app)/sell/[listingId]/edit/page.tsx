"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { listingsApi } from "@/lib/api/listings";

const DELIVERY_OPTIONS = [
  { value: "on_site", label: "ส่งเอง / นัดรับ" },
  { value: "parcel", label: "ส่งพัสดุ (ขนส่ง)" },
];

export default function SellEditPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const router = useRouter();

  const [price, setPrice] = useState("");
  const [deliveryMethods, setDeliveryMethods] = useState<string[]>([]);
  const [description, setDescription] = useState("");
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
        setPrice(String(l.price));
        setDeliveryMethods(l.deliveryMethods);
        setDescription(l.description ?? "");
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลได้"))
      .finally(() => setLoading(false));
  }, [listingId, router]);

  const toggleDelivery = (v: string) => {
    setDeliveryMethods(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    );
  };

  const handleSave = async () => {
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError("กรุณาระบุราคาที่ถูกต้อง"); return;
    }
    if (deliveryMethods.length === 0) {
      setError("กรุณาเลือกวิธีจัดส่งอย่างน้อย 1 วิธี"); return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await listingsApi.update(listingId, {
        price: Number(price),
        delivery_methods: deliveryMethods,
        description: description.trim() || undefined,
      });
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
        <h1 className="text-xl font-bold text-gray-900">แก้ไขประกาศ</h1>
      </div>

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
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
      >
        {submitting ? <><span className="animate-spin">⟳</span> กำลังบันทึก...</> : "💾 บันทึกการแก้ไข"}
      </button>
    </div>
  );
}
