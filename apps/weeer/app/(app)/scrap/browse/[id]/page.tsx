"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { scrapApi } from "../../_lib/api";
import type { ScrapItem } from "../../_lib/types";
import { CONDITION_GRADE_LABEL, CONDITION_GRADE_COLOR, SCRAP_ITEM_STATUS_LABEL } from "../../_lib/types";

export default function ScrapItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [item, setItem] = useState<ScrapItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState("");

  useEffect(() => {
    scrapApi.getItem(id)
      .then(setItem)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBuy = async () => {
    if (!item) return;
    setBuying(true);
    setBuyError("");
    try {
      const { scrapJobId } = await scrapApi.buyItem(id);
      router.push(`/scrap/jobs/${scrapJobId}`);
    } catch (e) {
      setBuyError((e as Error).message);
      setBuying(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ {error}</div>;
  if (!item) return null;

  const canBuy = item.status === "available";

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/scrap/browse" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">รายละเอียดซาก</h1>
      </div>

      {/* Photos */}
      {item.photos.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto">
          {item.photos.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt={`photo-${i}`} className="h-40 w-40 object-cover rounded-xl shrink-0" />
          ))}
        </div>
      ) : (
        <div className="w-full h-40 bg-gray-50 flex items-center justify-center rounded-xl text-5xl text-gray-300">♻️</div>
      )}

      {/* Info */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONDITION_GRADE_COLOR[item.conditionGrade]}`}>
            {CONDITION_GRADE_LABEL[item.conditionGrade]}
          </span>
          <span className="text-xs text-gray-400">{SCRAP_ITEM_STATUS_LABEL[item.status]}</span>
        </div>

        <div>
          <p className="text-xs text-gray-400">รายละเอียด</p>
          <p className="text-gray-800">{item.description}</p>
        </div>

        {item.workingParts.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-1">ชิ้นส่วนที่ยังใช้ได้</p>
            <div className="flex flex-wrap gap-1">
              {item.workingParts.map(p => (
                <span key={p} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{p}</span>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-50 pt-3 flex items-center justify-between">
          <p className="text-xs text-gray-400">ราคา</p>
          <p className="text-2xl font-bold text-indigo-700">{item.price.toLocaleString()} pts</p>
        </div>
      </div>

      {/* Buy button */}
      {buyError && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-sm">{buyError}</div>
      )}

      <button
        onClick={handleBuy}
        disabled={!canBuy || buying}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors
          ${canBuy && !buying
            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
        {buying ? "กำลังซื้อ…"
          : !canBuy ? `ไม่สามารถซื้อได้ (${SCRAP_ITEM_STATUS_LABEL[item.status]})`
          : "🛒 ซื้อซากนี้"}
      </button>

      <p className="text-center text-xs text-gray-400">
        เมื่อยืนยันซื้อ ระบบจะสร้าง ScrapJob ให้เลือกวิธีจัดการซาก
      </p>
    </div>
  );
}
