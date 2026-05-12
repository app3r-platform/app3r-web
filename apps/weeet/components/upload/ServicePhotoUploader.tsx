"use client";
/**
 * components/upload/ServicePhotoUploader.tsx
 * Phase D-2 — อัปโหลดรูปภาพงาน / ใบเสร็จ via DAL upload module
 */
import { useState, useRef, useCallback } from "react";
import { getAdapter } from "@/lib/dal";
import type { UploadedFile } from "@/lib/dal/types";

const MAX_SIZE_MB = 5;

interface UploadedItem { file: UploadedFile; caption?: string; }

interface Props {
  jobId: string;
  mode?: "photo" | "receipt";
  onUploaded?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  label?: string;
}

export function ServicePhotoUploader({ jobId, mode = "photo", onUploaded, maxFiles = 5, label }: Props) {
  const [uploaded, setUploaded] = useState<UploadedItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const newFiles = Array.from(files);
    if (uploaded.length + newFiles.length > maxFiles) { setError(`อัปโหลดได้สูงสุด ${maxFiles} ไฟล์`); return; }
    for (const f of newFiles) {
      if (f.size > MAX_SIZE_MB * 1024 * 1024) { setError(`ไฟล์ "${f.name}" ใหญ่เกิน ${MAX_SIZE_MB}MB`); return; }
    }
    setUploading(true);
    const dal = getAdapter();
    try {
      const results: UploadedItem[] = [];
      for (const file of newFiles) {
        const r = mode === "photo" ? await dal.upload.uploadServicePhoto(jobId, file, caption || undefined) : await dal.upload.uploadReceipt(jobId, file);
        if (r.ok) results.push({ file: r.data, caption: caption || undefined }); else setError(r.error);
      }
      const next = [...uploaded, ...results];
      setUploaded(next); setCaption(""); onUploaded?.(next.map((i) => i.file));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [jobId, mode, caption, uploaded, maxFiles, onUploaded]);

  const displayLabel = label ?? (mode === "photo" ? "รูปภาพงาน" : "ใบเสร็จ / เอกสาร");

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 font-medium">{displayLabel}</p>
      {mode === "photo" && (
        <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="คำอธิบายรูป (optional)" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500" />
      )}
      <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${uploading ? "border-gray-600 pointer-events-none" : "border-gray-600 hover:border-orange-500"}`} onClick={() => !uploading && fileRef.current?.click()}>
        {uploading ? (
          <p className="text-sm text-gray-400 flex items-center justify-center gap-2"><span className="animate-spin">⏳</span> กำลังอัปโหลด...</p>
        ) : (
          <><p className="text-2xl mb-1">{mode === "photo" ? "📷" : "📄"}</p><p className="text-xs text-gray-400">แตะเพื่อเลือกไฟล์</p><p className="text-xs text-gray-600 mt-0.5">สูงสุด {MAX_SIZE_MB}MB</p></>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple={mode === "photo"} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      {error && <p className="text-xs text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">{error}</p>}
      {uploaded.length > 0 && (
        <div className="space-y-2">
          {uploaded.map((item, idx) => (
            <div key={item.file.fileId} className="flex items-center gap-3 bg-gray-700/50 rounded-xl px-3 py-2">
              {item.file.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.file.url} alt="" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
              ) : <span className="text-2xl flex-shrink-0">📄</span>}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{item.caption ?? (mode === "receipt" ? "ใบเสร็จ" : "รูปภาพงาน")}</p>
                <p className="text-xs text-gray-500">{(item.file.sizeBytes / 1024).toFixed(0)} KB · ✅</p>
              </div>
              <button onClick={() => { const n = uploaded.filter((_, i) => i !== idx); setUploaded(n); onUploaded?.(n.map((i) => i.file)); }} className="text-red-400 text-sm flex-shrink-0">×</button>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-600">{uploaded.length}/{maxFiles} ไฟล์</p>
    </div>
  );
}
