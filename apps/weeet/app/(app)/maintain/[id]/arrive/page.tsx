"use client";
import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { maintainApi } from "@/lib/api";

const MAX_PHOTOS = 3;
const MIN_PHOTOS = 2;
const MAX_FILE_MB = 3;

type PhotoEntry = { file: File; previewUrl: string };

export default function MaintainArrivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    setSizeError(null);
    const toAdd: PhotoEntry[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setSizeError(`ไฟล์ ${file.name} ใหญ่เกิน ${MAX_FILE_MB}MB`);
        continue;
      }
      if (photos.length + toAdd.length >= MAX_PHOTOS) break;
      toAdd.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setPhotos((prev) => [...prev, ...toAdd]);
  };

  const removePhoto = (i: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[i].previewUrl);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const handleSubmit = async () => {
    if (photos.length < MIN_PHOTOS) return;
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    photos.forEach((p) => fd.append("arrival_photos", p.file));
    try {
      await maintainApi.arrive(id, fd);
      router.replace(`/maintain/${id}/checklist`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  const canSubmit = photos.length >= MIN_PHOTOS && !submitting;

  return (
    <div className="pb-6">
      <div className="sticky top-[41px] bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">←</button>
        <div>
          <h1 className="font-bold text-white">M2 — บันทึกถึงที่</h1>
          <p className="text-xs text-gray-400">ถ่ายรูป {MIN_PHOTOS}-{MAX_PHOTOS} ใบ ก่อนเริ่มล้างเครื่อง</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="bg-teal-950/30 border border-teal-800/50 rounded-xl p-3 text-xs text-teal-300 space-y-1">
          <p className="font-semibold">📸 ต้องถ่ายอย่างน้อย 2 รูป:</p>
          <p>1. รูปเครื่องก่อนล้าง (สภาพเริ่มต้น)</p>
          <p>2. รูปร่วมกับลูกค้าหรือสถานที่</p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => addPhotos(e.target.files)}
        />

        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div key={i} className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              onClick={() => fileRef.current?.click()}
              className="aspect-square bg-gray-800 border border-dashed border-gray-600 hover:border-teal-500 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-teal-400 transition-colors"
            >
              <span className="text-2xl">📷</span>
              <span className="text-xs">เพิ่มรูป</span>
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500">
          {photos.length}/{MAX_PHOTOS} รูป (ต้องการอย่างน้อย {MIN_PHOTOS} รูป) • สูงสุด {MAX_FILE_MB}MB/รูป
        </p>

        {sizeError && (
          <p className="text-amber-400 text-xs bg-amber-950/40 border border-amber-700 rounded-lg px-3 py-2">
            ⚠️ {sizeError}
          </p>
        )}

        {error && (
          <p className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <><span className="animate-spin">⏳</span> กำลังส่ง...</>
          ) : (
            `📍 ยืนยันถึงที่ (${photos.length}/${MIN_PHOTOS} รูป)`
          )}
        </button>
      </div>
    </div>
  );
}
