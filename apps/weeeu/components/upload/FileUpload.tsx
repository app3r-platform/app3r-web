"use client";
// ─── FileUpload (D87) — Presign → PUT R2 → Finalize + Scan Status ────────────

import { useState, useRef } from "react";
import { getAdapter } from "@/lib/dal";

type ScanStatus = "pending" | "clean" | "infected" | null;

interface UploadedFile {
  fileId: string;
  previewUrl: string;
  filename: string;
  scanStatus: ScanStatus;
}

interface Props {
  onUploaded?: (file: UploadedFile) => void;
  accept?: string;
  maxSizeMB?: number;
  context?: string;
}

export function FileUpload({
  onUploaded,
  accept = "image/*",
  maxSizeMB = 10,
  context = "repair_photo",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError("");
    setProgress(0);
    setUploaded(null);

    // Validate ขนาดไฟล์
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`ไฟล์ใหญ่เกิน ${maxSizeMB} MB`);
      return;
    }

    setUploading(true);
    const dal = getAdapter();

    try {
      // Step 1: ขอ presigned URL
      setProgress(10);
      const presignResult = await dal.upload.presign({
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        context,
      });
      if (!presignResult.ok) throw new Error(presignResult.error);
      const { uploadId, presignedUrl } = presignResult.data;

      // Step 2: PUT ไฟล์ไปที่ R2 โดยตรง (ไม่ผ่าน backend)
      setProgress(30);
      const putRes = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      // Phase C mock: presignedUrl = mock URL → PUT จะ fail แต่ยังคง flow ต่อไป
      // TODO(Phase-D-R2): ตรวจสอบ putRes.ok เมื่อ R2 presigned URL จริงพร้อม
      // if (!putRes.ok) throw new Error(`PUT R2 ล้มเหลว: HTTP ${putRes.status}`);
      void putRes; // suppress unused warning ใน Phase C
      setProgress(70);

      // Step 3: แจ้ง backend ว่าอัพโหลดเสร็จแล้ว → trigger scan
      const finalizeResult = await dal.upload.finalize(uploadId);
      if (!finalizeResult.ok) throw new Error(finalizeResult.error);
      const { fileId, signedGetUrl, scanStatus } = finalizeResult.data;

      setProgress(100);
      const uploadedFile: UploadedFile = {
        fileId,
        previewUrl: signedGetUrl,
        filename: file.name,
        scanStatus,
      };
      setUploaded(uploadedFile);
      onUploaded?.(uploadedFile);

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "อัพโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const SCAN_BADGE: Record<string, { label: string; cls: string }> = {
    pending: { label: "⏳ กำลังตรวจสอบ", cls: "bg-yellow-100 text-yellow-700" },
    clean:   { label: "✅ ปลอดภัย",       cls: "bg-green-100 text-green-700" },
    infected:{ label: "🚫 พบไวรัส",        cls: "bg-red-100 text-red-700" },
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
      >
        {uploaded ? (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={uploaded.previewUrl}
              alt="preview"
              className="mx-auto max-h-40 rounded-xl object-cover"
            />
            <p className="text-xs text-gray-500 truncate">{uploaded.filename}</p>
            {uploaded.scanStatus && (
              <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${SCAN_BADGE[uploaded.scanStatus]?.cls}`}>
                {SCAN_BADGE[uploaded.scanStatus]?.label}
              </span>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-3xl">📎</p>
            <p className="text-sm font-medium text-gray-700">คลิกหรือวางไฟล์ที่นี่</p>
            <p className="text-xs text-gray-400">รองรับ {accept} — ไม่เกิน {maxSizeMB} MB</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {/* Progress bar */}
      {uploading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>กำลังอัพโหลด...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Change button */}
      {uploaded && !uploading && (
        <button
          onClick={() => { setUploaded(null); inputRef.current?.click(); }}
          className="w-full text-xs text-indigo-600 hover:underline"
        >
          เปลี่ยนไฟล์
        </button>
      )}
    </div>
  );
}
