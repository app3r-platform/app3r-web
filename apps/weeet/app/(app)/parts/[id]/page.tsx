"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { partsApi } from "@/lib/api";
import type { Part } from "@/lib/types";

const CONDITION_LABELS: Record<Part["condition"], string> = {
  new: "ใหม่",
  used: "มือสอง",
  refurbished: "ซ่อมแล้ว",
};

const CONDITION_COLORS: Record<Part["condition"], string> = {
  new: "bg-green-900/40 border-green-700 text-green-300",
  used: "bg-yellow-900/40 border-yellow-700 text-yellow-300",
  refurbished: "bg-blue-900/40 border-blue-700 text-blue-300",
};

export default function PartDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    partsApi.get(id)
      .then((data) => {
        setPart(data);
        setLoading(false);
      })
      .catch(() => {
        setApiError(true);
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="pb-6">
      <div className="sticky top-[41px] bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">←</button>
        <h1 className="font-bold text-white">{loading ? "อะไหล่" : (part?.name ?? "ไม่พบข้อมูล")}</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Loading */}
        {loading && (
          <div className="space-y-3 animate-pulse">
            <div className="bg-gray-800 rounded-xl h-40" />
            <div className="bg-gray-800 rounded-xl h-24" />
            <div className="bg-gray-800 rounded-xl h-16" />
          </div>
        )}

        {/* Error */}
        {!loading && apiError && (
          <div className="text-center py-12 space-y-2">
            <p className="text-3xl">🔩</p>
            <p className="text-gray-400 text-sm">ระบบอะไหล่กำลังพัฒนา</p>
            <p className="text-gray-600 text-xs">ไม่สามารถโหลดข้อมูลได้ในขณะนี้</p>
          </div>
        )}

        {/* Part detail */}
        {!loading && part && (
          <>
            {/* Image placeholder / actual image */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
              {part.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={part.imageUrl} alt={part.name} className="w-full h-full object-contain" />
              ) : (
                <div className="text-center space-y-2 text-gray-500">
                  <p className="text-4xl">🔩</p>
                  <p className="text-xs">ไม่มีรูปภาพ</p>
                </div>
              )}
            </div>

            {/* Info card */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-white text-lg">{part.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{part.sku}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${CONDITION_COLORS[part.condition]}`}>
                  {CONDITION_LABELS[part.condition]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-gray-900 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">ราคา/หน่วย</p>
                  <p className="text-orange-400 font-bold text-lg">฿{part.unitPrice.toLocaleString()}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">คงเหลือ</p>
                  <p className={`font-bold text-lg ${part.stockQty > 5 ? "text-green-400" : "text-red-400"}`}>
                    {part.stockQty} <span className="text-sm font-normal text-gray-400">{part.unit}</span>
                  </p>
                </div>
                <div className="bg-gray-900 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">หมวดหมู่</p>
                  <p className="text-white text-sm">{part.category}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">จองแล้ว</p>
                  <p className="text-gray-300 text-sm">{part.reservedQty} {part.unit}</p>
                </div>
              </div>
            </div>

            {/* Source info */}
            {part.source && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">แหล่งที่มา</p>
                <p className="text-sm text-white">
                  {part.source.type === "purchase" ? "🛒 ซื้อเข้า" : "♻️ แยกจากซาก"}
                  {part.source.refId && <span className="text-gray-400 ml-2">({part.source.refId})</span>}
                </p>
              </div>
            )}

            <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-3 text-xs text-amber-300">
              📋 หน้านี้แสดงข้อมูลอ่านอย่างเดียว — การเบิกอะไหล่ทำผ่านหน้า checklist งาน
            </div>
          </>
        )}
      </div>
    </div>
  );
}
