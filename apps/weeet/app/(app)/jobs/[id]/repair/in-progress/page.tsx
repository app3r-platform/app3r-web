"use client";
import { use, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { pickupApi } from "@/lib/api";

export default function RepairInProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [repairLog, setRepairLog] = useState("");
  const [partsText, setPartsText] = useState("");
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
    if (!repairLog.trim()) {
      setError("กรุณาบันทึกรายงานการซ่อม");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Use atShop endpoint for transitioning to tested_ok state
      // Backend: POST /jobs/{id}/repair/complete → tested_ok
      const fd = new FormData();
      fd.append("repair_log", repairLog.trim());
      if (partsText.trim()) fd.append("parts_used", partsText.trim());
      photos.forEach((f) => fd.append("photos", f));
      // POST to repair complete endpoint — transitions appliance_at_shop → tested_ok
      await pickupApi.atShop(id); // placeholder: backend should expose /repair/complete
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
          <h1 className="text-white font-bold text-lg">บันทึกการซ่อม</h1>
          <p className="text-xs text-gray-400">บันทึกงานซ่อมและอะไหล่ที่ใช้</p>
        </div>
      </div>

      {/* Repair log */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-white">
          รายงานการซ่อม <span className="text-red-400">*</span>
        </label>
        <textarea
          rows={5}
          placeholder="บันทึกสิ่งที่ซ่อม, ปัญหาที่พบ, วิธีแก้ไข..."
          value={repairLog}
          onChange={(e) => setRepairLog(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
        />
      </div>

      {/* Parts used */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-white">
          อะไหล่ที่ใช้ <span className="text-gray-500 font-normal">(ถ้ามี)</span>
        </label>
        <input
          type="text"
          placeholder="เช่น คอมเพรสเซอร์ × 1, น้ำยา R32 × 2"
          value={partsText}
          onChange={(e) => setPartsText(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* Photos after repair */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">
            รูปหลังซ่อม <span className="text-gray-500 font-normal">({photos.length} รูป)</span>
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
        disabled={loading || !repairLog.trim()}
        className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors"
      >
        {loading ? "กำลังบันทึก..." : "🔧 ยืนยันซ่อมเสร็จ + ทดสอบผ่าน"}
      </button>
    </div>
  );
}
