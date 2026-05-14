"use client";
/**
 * components/service-progress/ProgressUpdateForm.tsx
 * Sub-5 Wave 2 — Service Progress Tracker D79
 *
 * WeeeT write form: status + note + photo (R2)
 * POST /api/v1/service-progress/ (create) หรือ
 * PATCH /api/v1/service-progress/:id (update)
 */
import { useState, useRef } from "react";
import { getAdapter } from "@/lib/dal";
import type { ServiceProgressRecord, ServiceProgressStatus } from "@/lib/dal/types";

const STATUS_OPTIONS: { value: ServiceProgressStatus; label: string; color: string }[] = [
  { value: "pending",     label: "⏳ รอดำเนินการ",    color: "text-gray-300" },
  { value: "accepted",    label: "✅ รับงานแล้ว",      color: "text-blue-300" },
  { value: "in_progress", label: "🔧 กำลังดำเนินการ", color: "text-orange-300" },
  { value: "paused",      label: "⏸ หยุดชั่วคราว",   color: "text-amber-300" },
  { value: "completed",   label: "🎉 เสร็จสิ้น",      color: "text-green-300" },
  { value: "cancelled",   label: "❌ ยกเลิก",          color: "text-red-300" },
];

interface Props {
  serviceId: string;
  /** ถ้ามี existingEntry = PATCH mode (อัพเดต), ไม่มี = POST mode (สร้างใหม่) */
  existingEntry?: ServiceProgressRecord;
  onSuccess?: (record: ServiceProgressRecord) => void;
  onCancel?: () => void;
}

export function ProgressUpdateForm({ serviceId, existingEntry, onSuccess, onCancel }: Props) {
  const [status, setStatus] = useState<ServiceProgressStatus>(
    existingEntry?.status ?? "in_progress"
  );
  const [progressPercent, setProgressPercent] = useState<number>(
    existingEntry?.progressPercent ?? 0
  );
  const [note, setNote] = useState<string>(existingEntry?.note ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUpdateMode = !!existingEntry;
  const dal = getAdapter().serviceProgress;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Security: ตรวจ file type + size (Rule #5)
    const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
    const MAX_MB = 10;
    if (!ALLOWED.includes(file.type)) {
      setError("รองรับเฉพาะ JPG / PNG / WebP เท่านั้น");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`ขนาดไฟล์ต้องไม่เกิน ${MAX_MB} MB`);
      return;
    }
    setPhotoFile(file);
    setRemovePhoto(false);
    setError(null);
    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleRemovePhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemovePhoto(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result: Awaited<ReturnType<typeof dal.createProgress>>;

      if (isUpdateMode) {
        result = await dal.updateProgress(existingEntry!.id, {
          status,
          progressPercent,
          note: note.trim() || undefined,
          photoFile: removePhoto ? null : (photoFile ?? undefined),
        });
      } else {
        result = await dal.createProgress({
          serviceId,
          status,
          progressPercent,
          note: note.trim() || undefined,
          photoFile: photoFile ?? undefined,
        });
      }

      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSuccess?.(result.data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Status */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
          สถานะงาน
        </label>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-left ${
                status === opt.value
                  ? "border-orange-500 bg-orange-950/40 text-orange-300"
                  : "border-gray-700 bg-gray-800/60 text-gray-400 hover:border-gray-600"
              }`}
            >
              <span className={opt.color}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Progress percent */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide flex justify-between">
          <span>ความคืบหน้า</span>
          <span className="text-orange-400 font-bold">{progressPercent}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={progressPercent}
          onChange={(e) => setProgressPercent(Number(e.target.value))}
          className="w-full accent-orange-500 cursor-pointer"
        />
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
          บันทึก (ไม่บังคับ)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="รายละเอียดความคืบหน้า เช่น ถอดฝาครอบแล้ว กำลังตรวจ motor..."
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 resize-none"
        />
      </div>

      {/* Photo upload */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
          รูปภาพ (ไม่บังคับ — อัพโหลดไป R2)
        </label>

        {/* Preview ถ้ามี */}
        {(photoPreview || (existingEntry?.photoR2Key && !removePhoto && !photoFile)) && (
          <div className="relative">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="preview"
                className="w-full max-h-48 object-cover rounded-xl border border-gray-700"
              />
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex items-center gap-2">
                <span className="text-gray-400 text-sm">📷</span>
                <span className="text-gray-400 text-xs font-mono truncate">
                  {existingEntry?.photoR2Key}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="absolute top-2 right-2 bg-red-900/80 hover:bg-red-800 text-red-300 rounded-full w-6 h-6 flex items-center justify-center text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* File input */}
        {!photoFile && !(!removePhoto && existingEntry?.photoR2Key) && (
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-orange-500/50 transition-colors bg-gray-800/30">
            <span className="text-2xl mb-1">📷</span>
            <span className="text-xs text-gray-500">แตะเพื่อเลือกรูป (JPG/PNG/WebP ≤10MB)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-xl px-3 py-2.5 text-sm text-red-300">
          ⚠️ {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 text-sm font-medium hover:border-gray-500 transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {loading
            ? (isUpdateMode ? "กำลังอัพเดต..." : "กำลังบันทึก...")
            : (isUpdateMode ? "💾 อัพเดต Progress" : "✅ บันทึก Progress")}
        </button>
      </div>
    </form>
  );
}
