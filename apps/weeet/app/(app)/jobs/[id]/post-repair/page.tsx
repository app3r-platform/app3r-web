"use client";
import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { repairApi } from "@/lib/api";

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 5;
const MIN_CLIPS = 1;
const MAX_CLIPS = 3;
const MAX_PHOTO_MB = 3;
const MAX_VIDEO_MB = 30;

type MediaEntry = { file: File; previewUrl: string };
type PartUsed = { name: string; qty: number };

export default function PostRepairPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<MediaEntry[]>([]);
  const [clips, setClips] = useState<MediaEntry[]>([]);
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([]);
  const [notes, setNotes] = useState("");
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    setSizeError(null);
    const toAdd: MediaEntry[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) { setSizeError(`${file.name} ใหญ่เกิน ${MAX_PHOTO_MB}MB`); continue; }
      if (photos.length + toAdd.length >= MAX_PHOTOS) break;
      toAdd.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setPhotos((prev) => [...prev, ...toAdd]);
  };

  const addClips = (files: FileList | null) => {
    if (!files) return;
    setSizeError(null);
    const toAdd: MediaEntry[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_VIDEO_MB * 1024 * 1024) { setSizeError(`${file.name} ใหญ่เกิน ${MAX_VIDEO_MB}MB`); continue; }
      if (clips.length + toAdd.length >= MAX_CLIPS) break;
      toAdd.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setClips((prev) => [...prev, ...toAdd]);
  };

  const removePhoto = (i: number) => setPhotos((p) => { URL.revokeObjectURL(p[i].previewUrl); return p.filter((_, idx) => idx !== i); });
  const removeClip = (i: number) => setClips((c) => { URL.revokeObjectURL(c[i].previewUrl); return c.filter((_, idx) => idx !== i); });
  const addPart = () => setPartsUsed((p) => [...p, { name: "", qty: 1 }]);
  const updatePart = (i: number, field: keyof PartUsed, val: string | number) =>
    setPartsUsed((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
  const removePart = (i: number) => setPartsUsed((prev) => prev.filter((_, idx) => idx !== i));

  const canSubmit = photos.length >= MIN_PHOTOS && clips.length >= MIN_CLIPS && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    photos.forEach((p) => fd.append("post_repair_photos", p.file));
    clips.forEach((c) => fd.append("post_repair_clips", c.file));
    partsUsed.forEach((p, i) => {
      fd.append(`parts_used[${i}][name]`, p.name);
      fd.append(`parts_used[${i}][qty]`, String(p.qty));
    });
    fd.append("notes", notes);
    try {
      await repairApi.postRepair(id, fd);
      router.replace(`/jobs/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-6">
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">←</button>
        <div>
          <h1 className="font-bold text-white">T5 — บันทึกหลังซ่อม</h1>
          <p className="text-xs text-gray-400">รูป {MIN_PHOTOS}+ ใบ + คลิป {MIN_CLIPS}+ คลิป (บังคับ)</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Photos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">📸 รูปหลังซ่อม <span className="text-red-400">*</span></h2>
            <span className="text-xs text-gray-400">{photos.length}/{MAX_PHOTOS}</span>
          </div>
          <input ref={photoRef} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={(e) => addPhotos(e.target.files)} />
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">✕</button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button onClick={() => photoRef.current?.click()}
                className="aspect-square bg-gray-800 border border-dashed border-gray-600 hover:border-green-500 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-green-400 transition-colors">
                <span className="text-2xl">📷</span><span className="text-xs">เพิ่มรูป</span>
              </button>
            )}
          </div>
          {photos.length < MIN_PHOTOS && <p className="text-xs text-amber-400">⚠️ ต้องการอีก {MIN_PHOTOS - photos.length} รูป</p>}
        </div>

        {/* Clips */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">🎥 คลิปหลังซ่อม <span className="text-red-400">*</span></h2>
            <span className="text-xs text-gray-400">{clips.length}/{MAX_CLIPS}</span>
          </div>
          <input ref={videoRef} type="file" accept="video/*" multiple capture="environment" className="hidden" onChange={(e) => addClips(e.target.files)} />
          <div className="grid grid-cols-3 gap-2">
            {clips.map((c, i) => (
              <div key={i} className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-600 flex items-center justify-center">
                <span className="text-3xl">🎬</span>
                <button onClick={() => removeClip(i)} className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">✕</button>
              </div>
            ))}
            {clips.length < MAX_CLIPS && (
              <button onClick={() => videoRef.current?.click()}
                className="aspect-square bg-gray-800 border border-dashed border-gray-600 hover:border-green-500 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-green-400 transition-colors">
                <span className="text-2xl">🎥</span><span className="text-xs">เพิ่มคลิป</span>
              </button>
            )}
          </div>
          {clips.length < MIN_CLIPS && <p className="text-xs text-amber-400">⚠️ ต้องการอีก {MIN_CLIPS - clips.length} คลิป</p>}
          <p className="text-xs text-gray-500">สูงสุด {MAX_VIDEO_MB}MB / ไฟล์, ไม่เกิน 60 วินาที</p>
        </div>

        {/* Parts used */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">🔩 อะไหล่ที่ใช้</h2>
            <button onClick={addPart} className="text-xs text-orange-400 hover:text-orange-300">+ เพิ่ม</button>
          </div>
          {partsUsed.map((p, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={p.name} onChange={(e) => updatePart(i, "name", e.target.value)}
                placeholder="ชื่ออะไหล่" className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none" />
              <input type="number" value={p.qty} min="1" onChange={(e) => updatePart(i, "qty", parseInt(e.target.value))}
                className="w-14 bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none text-center" />
              <button onClick={() => removePart(i)} className="text-red-400 text-xs">✕</button>
            </div>
          ))}
          {partsUsed.length === 0 && <p className="text-xs text-gray-500">ไม่ระบุก็ได้ (ถ้าไม่ได้ใช้อะไหล่)</p>}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-white">📝 หมายเหตุหลังซ่อม</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="สรุปงานที่ทำ ผลการทดสอบ..." rows={3}
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none" />
        </div>

        {sizeError && <p className="text-amber-400 text-xs bg-amber-950/40 border border-amber-700 rounded-lg px-3 py-2">⚠️ {sizeError}</p>}
        {error && <p className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-xl px-4 py-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? <><span className="animate-spin">⏳</span> กำลังส่ง...</> : "📸 ส่งบันทึกหลังซ่อม"}
        </button>
      </div>
    </div>
  );
}
