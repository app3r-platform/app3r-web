"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { scrapApi } from "../../../_lib/api";
import type { ScrapJob } from "../../../_lib/types";

export default function ResellAsScrapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<ScrapJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    scrapApi.getJob(id)
      .then(setJob)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      setSubmitError("กรุณาระบุราคาที่ถูกต้อง");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      await scrapApi.submitResellAsScrap(id, {
        price: priceNum,
        description: description.trim() || undefined,
      });
      router.push(`/scrap/jobs/${id}`);
    } catch (e) {
      setSubmitError((e as Error).message);
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ {error}</div>;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href={`/scrap/jobs/${id}`} className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">🏷 ขายต่อซาก</h1>
      </div>

      {job && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
          ซาก: {job.scrapItemDescription ?? job.scrapItemId}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">ราคาที่ต้องการขาย (pts) <span className="text-red-400">*</span></label>
          <input
            type="number" min="1" value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="0"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">รายละเอียดเพิ่มเติม (ไม่บังคับ)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
            placeholder="เช่น สภาพ, ชิ้นส่วนที่รวม, เงื่อนไขการรับ..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-500">
        ระบบจะสร้างประกาศขายซากใน Marketplace (Listing type: scrap) — ผู้ซื้อจะเห็นโดยตรง
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-sm">{submitError}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors
          ${submitting ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}>
        {submitting ? "กำลังสร้างประกาศ…" : "✅ สร้างประกาศขายซาก"}
      </button>
    </div>
  );
}
