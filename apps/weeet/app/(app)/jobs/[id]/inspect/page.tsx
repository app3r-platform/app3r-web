"use client";
import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { repairApi } from "@/lib/api";

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 5;
const MAX_CLIPS = 3;
const MAX_PHOTO_MB = 3;
const MAX_VIDEO_MB = 30;

type MediaEntry = { file: File; previewUrl: string; type: "photo" | "video" };

export default function InspectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<MediaEntry[]>([]);
  const [clips, setClips] = useState<MediaEntry[]>([]);
  const [notes, setNotes] = useState("");
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    setSizeError(null);
    const toAdd: MediaEntry[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
        setSizeError(`${file.name} ใหญ่เกิน ${MAX_PHOTO_MB}MB`);
        continue;
      }
      if (photos.length + toAdd.length >= MAX_PHOTOS) break;
      toAdd.push({ file, previewUrl: URL.createObjectURL(file), type: "photo" });
    }
    setPhotos((prev) => [...prev, ...toAdd]);
  };

  const addClips = (files: FileList | null) => {
    if (!files) return;
    setSizeError(null);
    const toAdd: MediaEntry[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
        setSizeError(`${file.name} ใหญ่เกิน ${MAX_VIDEO_MB}MB`);
        continue;
      }
      if (clips.length + toAdd.length >= MAX_CLIPS) break;
      toAdd.push({ file, previewUrl: URL.createObjectURL(file), type: "video" });
    }
    setClips((prev) => [...prev, ...toAdd]);
  };

  const removePhoto = (i: number) => {
    setPhotos((prev) => { URL.revokeObjectURL(prev[i].previewUrl); return prev.filter((_, idx) => idx !== i); });
  };

  const removeClip = (i: number) => {
    setClips((prev) => { URL.revokeObjectURL(prev[i].previewUrl); return prev.filter((_, idx) => idx !== i); });
  };

  const handleSubmit = async () => {
    if (photos.length < MIN_PHOTOS) return;
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    photos.forEach((p) => fd.append("pre_inspection_photos", p.file));
    clips.forEach((c) => fd.append("pre_inspection_clips", c.file));
    fd.append("notes", notes);
    try {
      await repairApi.preInspect(id, fd);
      router.replace(`/jobs/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  const canSubmit = photos.length >= MIN_PHOTOS && !submitting;

  return (
    <div className="pb-6">
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">←</button>
        <div>
          <h1 className="font-bold text-white">T3 — รายงานตรวจสอบ</h1>
          <p className="text-xs text-gray-400">รูป {MIN_PHOTOS}-{MAX_PHOTOS} ใบ + คลิป 0-{MAX_CLIPS} (ก่อนซ่อม)</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Photos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">📸 รูปภาพ (บังคับ)</h2>
            <span className="text-xs text-gray-400">{photos.length}/{MAX_PHOTOS}</span>
          </div>
          <input ref={photoRef} type="file" accept="image/*" multiple capture="environment" className="hidden"
            onChange={(e) => addPhotos(e.target.files)} />
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">✕</button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button onClick={() => photoRef.current?.click()}
                className="aspect-square bg-gray-800 border border-dashed border-gray-600 hover:border-orange-500 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-orange-400 transition-colors">
                <span className="text-2xl">📷</span>
                <span className="text-xs">เพิ่มรูป</span>
              </button>
            )}
          </div>
          {photos.length < MIN_PHOTOS && (
            <p className="text-xs text-amber-400">⚠️ ต้องการอีก {MIN_PHOTOS - photos.length} รูป</p>
          )}
        </div>

        {/* Clips */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">🎥 วิดีโอ (ไม่บังคับ)</h2>
            <span className="text-xs text-gray-400">{clips.length}/{MAX_CLIPS}</span>
          </div>
          <input ref={videoRef} type="file" accept="video/*" multiple capture="environment" className="hidden"
            onChange={(e) => addClips(e.target.files)} />
          <div className="grid grid-cols-3 gap-2">
            {clips.map((c, i) => (
              <div key={i} className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-600 flex items-center justify-center">
                <span className="text-3xl">🎬</span>
                <p className="absolute bottom-1 left-0 right-0 text-center text-xs text-gray-300">{c.file.name.slice(0, 10)}</p>
                <button onClick={() => removeClip(i)}
                  className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">✕</button>
              </div>
            ))}
            {clips.length < MAX_CLIPS && (
              <button onClick={() => videoRef.current?.click()}
                className="aspect-square bg-gray-800 border border-dashed border-gray-600 hover:border-blue-500 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-blue-400 transition-colors">
                <span className="text-2xl">🎥</span>
                <span className="text-xs">เพิ่มคลิป</span>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">สูงสุด {MAX_VIDEO_MB}MB / ไฟล์, ไม่เกิน 60 วินาที</p>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-white">📝 หมายเหตุการตรวจ</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="บรรยายสภาพเครื่อง ปัญหาที่พบ..."
            rows={4}
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
          />
        </div>

        {sizeError && (
          <p className="text-amber-400 text-xs bg-amber-950/40 border border-amber-700 rounded-lg px-3 py-2">⚠️ {sizeError}</p>
        )}
        {error && (
          <p className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? <><span className="animate-spin">⏳</span> กำลังส่ง...</> : "🔍 ส่งรายงานตรวจสอบ"}
        </button>
      </div>
    </div>
  );
}
