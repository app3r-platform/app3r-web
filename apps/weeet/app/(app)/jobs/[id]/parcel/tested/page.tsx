"use client";
import { use, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { parcelApi } from "@/lib/api";

export default function ParcelTestedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [testResult, setTestResult] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files);
    setPhotos((prev) => [...prev, ...newFiles]);
    newFiles.forEach((f) => setPreviews((prev) => [...prev, URL.createObjectURL(f)]));
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function handleSubmit() {
    if (!testResult.trim()) {
      setError("กรุณาบันทึกผลการทดสอบ");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("test_result", testResult.trim());
      if (notes.trim()) fd.append("notes", notes.trim());
      photos.forEach((f) => fd.append("post_photos", f));
      await parcelApi.tested(id, fd);
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
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">
          ←
        </button>
        <div>
          <h1 className="text-white font-bold text-lg">ผลทดสอบ + ส่งกลับ WeeeR</h1>
          <p className="text-xs text-gray-400">บันทึกผลและโอนงานกลับให้ร้านจัดส่ง</p>
        </div>
      </div>

      {/* Parcel badge */}
      <div className="bg-teal-950/50 border border-teal-800/60 rounded-xl px-4 py-2 flex items-center gap-2">
        <span className="text-teal-300 text-sm">📦</span>
        <span className="text-teal-300 text-sm font-medium">
          ซ่อมเสร็จ — ส่งกลับ WeeeR เพื่อจัดส่งคืนลูกค้า
        </span>
      </div>

      {/* Test result */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-white">
          ผลการทดสอบ <span className="text-red-400">*</span>
        </label>
        <textarea
          rows={4}
          placeholder="เช่น ทดสอบเปิด-ปิด 5 ครั้ง ผ่าน, ฟังก์ชันครบ, ไม่มีปัญหา..."
          value={testResult}
          onChange={(e) => setTestResult(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-white">
          หมายเหตุสำหรับ WeeeR <span className="text-gray-500 font-normal">(ถ้ามี)</span>
        </label>
        <textarea
          rows={3}
          placeholder="เช่น ระวังบรรจุภัณฑ์, แนบใบรับประกัน, คำแนะนำพิเศษ..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
        />
      </div>

      {/* Post-repair photos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">
            รูปหลังซ่อม{" "}
            <span className="text-gray-500 font-normal">({photos.length} รูป)</span>
          </span>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-lg"
          >
            + เพิ่มรูป
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {previews.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`p${i}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-black/70 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500"
            >
              <span className="text-2xl">+</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-28 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500"
          >
            <span className="text-2xl">📷</span>
            <span className="text-xs">แตะเพื่อถ่ายรูป</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !testResult.trim()}
        className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors"
      >
        {loading ? "กำลังบันทึก..." : "✅ ยืนยันทดสอบผ่าน + ส่งกลับ WeeeR"}
      </button>
    </div>
  );
}
