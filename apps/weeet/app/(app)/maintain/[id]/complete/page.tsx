"use client";
import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { maintainApi } from "@/lib/api";
import { SignaturePad } from "@/components/SignaturePad";

const MAX_PHOTOS = 4;
const MIN_PHOTOS = 2;
const MAX_FILE_MB = 3;

type PhotoEntry = { file: File; previewUrl: string };

export default function MaintainCompletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [custSig, setCustSig] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = photos.length >= MIN_PHOTOS && !!custSig && !submitting;

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    setSizeError(null);
    const toAdd: PhotoEntry[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setSizeError(`${file.name} ใหญ่เกิน ${MAX_FILE_MB}MB`);
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
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    photos.forEach((p) => fd.append("complete_photos", p.file));
    fd.append("customer_signature", custSig!);
    try {
      await maintainApi.complete(id, fd);
      router.replace("/maintain");
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-6">
      <div className="sticky top-[41px] bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">←</button>
        <div>
          <h1 className="font-bold text-white">M4 — เสร็จงาน</h1>
          <p className="text-xs text-gray-400">ถ่ายรูปหลังล้าง + รับลายเซ็นลูกค้า</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* After-cleaning photos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              📸 รูปหลังล้างเครื่อง <span className="text-red-400">*</span>
            </h2>
            <span className="text-xs text-gray-400">{photos.length}/{MAX_PHOTOS}</span>
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
          {photos.length < MIN_PHOTOS && (
            <p className="text-xs text-amber-400">⚠️ ต้องการอีก {MIN_PHOTOS - photos.length} รูป</p>
          )}
          {sizeError && (
            <p className="text-amber-400 text-xs bg-amber-950/40 border border-amber-700 rounded-lg px-3 py-2">⚠️ {sizeError}</p>
          )}
        </div>

        {/* Customer signature */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white">
            ✍️ ลายเซ็นลูกค้า <span className="text-red-400">*</span>
          </h2>
          <SignaturePad label="ลายเซ็นลูกค้า" onChange={setCustSig} />
          {!custSig && (
            <p className="text-xs text-amber-400">⚠️ ต้องให้ลูกค้าเซ็นชื่อก่อนส่ง</p>
          )}
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <><span className="animate-spin">⏳</span> กำลังส่ง...</>
          ) : (
            "✅ ยืนยันงานเสร็จสมบูรณ์"
          )}
        </button>
      </div>
    </div>
  );
}
