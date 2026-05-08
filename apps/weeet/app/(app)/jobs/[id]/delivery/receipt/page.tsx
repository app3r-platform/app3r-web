"use client";
import { use, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { pickupApi } from "@/lib/api";
import { SignaturePad } from "@/components/SignaturePad";

export default function DeliveryReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [techSig, setTechSig] = useState<string | null>(null);
  const [custSig, setCustSig] = useState<string | null>(null);
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
      photos.forEach((f) => fd.append("post_photos", f));
      fd.append("tech_signature", techSig);
      fd.append("customer_signature", custSig);
      if (notes.trim()) fd.append("notes", notes.trim());
      await pickupApi.deliveryReceipt(id, fd);
      router.replace(`/jobs/${id}/delivery/completed`);
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
          <h1 className="text-white font-bold text-lg">ใบส่งมอบเครื่อง</h1>
          <p className="text-xs text-gray-400">ถ่ายรูปและรับลายเซ็นส่งคืน</p>
        </div>
      </div>

      {/* Post-delivery photos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">
            รูปเครื่องที่ส่งคืน{" "}
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

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-white">
          หมายเหตุ <span className="text-gray-500 font-normal">(ถ้ามี)</span>
        </label>
        <textarea
          rows={3}
          placeholder="บันทึกเพิ่มเติมการส่งมอบ..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
        />
      </div>

      {/* Tech signature */}
      <SignaturePad label="ลายเซ็นช่าง" onChange={setTechSig} />

      {/* Customer signature */}
      <SignaturePad label="ลายเซ็นลูกค้า (รับเครื่อง)" onChange={setCustSig} />

      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !techSig || !custSig}
        className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors"
      >
        {loading ? "กำลังบันทึก..." : "📋 ยืนยันส่งมอบเครื่อง"}
      </button>
    </div>
  );
}
