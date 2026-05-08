"use client";
import { use, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { pickupApi } from "@/lib/api";

const MIN_PHOTOS = 2;

export default function PickupArrivedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files);
    setPhotos((prev) => [...prev, ...newFiles]);
    newFiles.forEach((f) => {
      const url = URL.createObjectURL(f);
      setPreviews((prev) => [...prev, url]);
    });
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function handleSubmit() {
    if (photos.length < MIN_PHOTOS) {
      setError(`ต้องถ่ายรูปอย่างน้อย ${MIN_PHOTOS} รูป`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      photos.forEach((f) => fd.append("photos", f));
      await pickupApi.arrivedPickup(id, fd);
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
          <h1 className="text-white font-bold text-lg">ถึงที่ — ถ่ายรูปเครื่อง</h1>
          <p className="text-xs text-gray-400">
            บันทึกสภาพเครื่องก่อนรับ (ต้องถ่ายอย่างน้อย {MIN_PHOTOS} รูป)
          </p>
        </div>
      </div>

      {/* Photo upload */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">
            รูปสภาพเครื่อง{" "}
            <span
              className={
                photos.length >= MIN_PHOTOS
                  ? "text-green-400"
                  : "text-orange-400"
              }
            >
              ({photos.length}/{MIN_PHOTOS}+)
            </span>
          </span>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-lg transition-colors"
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

        {previews.length === 0 ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-36 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-orange-500/60 transition-colors"
          >
            <span className="text-3xl">📷</span>
            <span className="text-sm">แตะเพื่อถ่ายรูป</span>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`photo-${i}`}
                  className="w-full h-full object-cover"
                />
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
              className="aspect-square rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500 hover:border-orange-500/60 transition-colors"
            >
              <span className="text-2xl">+</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || photos.length < MIN_PHOTOS}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors"
      >
        {loading ? "กำลังบันทึก..." : "📍 บันทึกถึงที่ + รูปเครื่อง"}
      </button>
    </div>
  );
}
