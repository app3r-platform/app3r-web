"use client";
import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { maintainApi } from "@/lib/api";
import { MAINTAIN_CHECKLIST_ITEMS } from "@/lib/types";
import { mockParts } from "@/lib/mock-data";

const MAX_PHOTOS = 4;
const MIN_PHOTOS = 2;
const MAX_FILE_MB = 3;

type PhotoEntry = { file: File; previewUrl: string };
type PartUsed = { name: string; qty: number };

// cleaningType passed via searchParams (optional — default to general)
export default function MaintainChecklistPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = use(params);
  const { type } = use(searchParams);
  const cleaningType = (type as "general" | "deep" | "sanitize") ?? "general";
  const checklistItems = MAINTAIN_CHECKLIST_ITEMS[cleaningType];

  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([]);
  const [showPartModal, setShowPartModal] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allChecked = checklistItems.every((_, i) => checked[i]);
  const canSubmit = allChecked && photos.length >= MIN_PHOTOS && !submitting;

  const toggleItem = (i: number) =>
    setChecked((prev) => ({ ...prev, [i]: !prev[i] }));

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

  const addPartFromMock = (name: string) => {
    setPartsUsed((prev) => {
      const existing = prev.findIndex((p) => p.name === name);
      if (existing >= 0) {
        return prev.map((p, i) => i === existing ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { name, qty: 1 }];
    });
    setShowPartModal(false);
  };

  const updatePartQty = (i: number, qty: number) =>
    setPartsUsed((prev) => prev.map((p, idx) => idx === i ? { ...p, qty: Math.max(1, qty) } : p));

  const removePart = (i: number) =>
    setPartsUsed((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    photos.forEach((p) => fd.append("checklist_photos", p.file));
    checklistItems.forEach((item) => fd.append("checklist", item));
    partsUsed.forEach((p, i) => {
      fd.append(`parts_used[${i}][name]`, p.name);
      fd.append(`parts_used[${i}][qty]`, String(p.qty));
    });
    if (notes.trim()) fd.append("notes", notes.trim());
    try {
      await maintainApi.inProgress(id, fd);
      router.replace(`/maintain/${id}/complete`);
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
          <h1 className="font-bold text-white">M3 — ตรวจสภาพ + ล้างเครื่อง</h1>
          <p className="text-xs text-gray-400">ทำครบ checklist + ถ่ายรูประหว่างล้าง</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Checklist */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white">
            ✅ Checklist ({Object.values(checked).filter(Boolean).length}/{checklistItems.length})
          </h2>
          {checklistItems.map((item, i) => (
            <button
              key={i}
              onClick={() => toggleItem(i)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-colors ${
                checked[i]
                  ? "bg-teal-900/40 border-teal-700 text-teal-200"
                  : "bg-gray-800 border-gray-700 text-gray-300"
              }`}
            >
              <span className="text-lg leading-none">{checked[i] ? "✅" : "⬜"}</span>
              <span>{item}</span>
            </button>
          ))}
          {!allChecked && (
            <p className="text-xs text-amber-400">⚠️ ต้องทำครบทุกข้อก่อนส่ง</p>
          )}
        </div>

        {/* Photos during work */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              📸 รูประหว่างล้าง <span className="text-red-400">*</span>
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

        {/* Parts usage (mock D50) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">🔩 อะไหล่/น้ำยาที่ใช้</h2>
            <button
              onClick={() => setShowPartModal(true)}
              className="text-xs text-teal-400 hover:text-teal-300 border border-teal-800 rounded-lg px-2 py-1"
            >
              + เลือกอะไหล่
            </button>
          </div>
          {partsUsed.length === 0 ? (
            <p className="text-xs text-gray-500">ไม่ระบุก็ได้ (ถ้าไม่ได้ใช้)</p>
          ) : (
            <div className="space-y-2">
              {partsUsed.map((p, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2">
                  <span className="flex-1 text-sm text-white">{p.name}</span>
                  <button
                    onClick={() => updatePartQty(i, p.qty - 1)}
                    className="w-6 h-6 bg-gray-700 rounded text-white text-xs"
                  >-</button>
                  <span className="w-6 text-center text-sm text-white">{p.qty}</span>
                  <button
                    onClick={() => updatePartQty(i, p.qty + 1)}
                    className="w-6 h-6 bg-gray-700 rounded text-white text-xs"
                  >+</button>
                  <button onClick={() => removePart(i)} className="text-red-400 text-xs ml-1">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-white">📝 หมายเหตุ</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="สรุปงานที่ทำ สภาพเครื่องหลังล้าง..."
            rows={3}
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 resize-none"
          />
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
            "🧹 ยืนยันล้างเครื่องเสร็จ"
          )}
        </button>
      </div>

      {/* Parts modal */}
      {showPartModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end">
          <div className="w-full bg-gray-900 border-t border-gray-700 rounded-t-2xl p-4 space-y-3 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">เลือกอะไหล่/น้ำยา</h3>
              <button onClick={() => setShowPartModal(false)} className="text-gray-400 text-lg">✕</button>
            </div>
            {mockParts.map((part) => (
              <button
                key={part.id}
                onClick={() => addPartFromMock(part.name)}
                className="w-full flex items-center justify-between bg-gray-800 border border-gray-700 hover:border-teal-600 rounded-xl px-4 py-3 text-left transition-colors"
              >
                <div>
                  <p className="text-sm text-white">{part.name}</p>
                  <p className="text-xs text-gray-400">{part.sku} • {part.unit}</p>
                </div>
                <span className="text-xs text-teal-400 font-medium">฿{part.price}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
