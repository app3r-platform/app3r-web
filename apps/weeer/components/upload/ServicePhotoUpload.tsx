"use client";
// ── ServicePhotoUpload — D-2 Upload UI ────────────────────────────────────────
// อัพโหลดรูปภาพสำหรับงานบริการ (repair / maintenance photos)
// POST /api/v1/upload → คืน { url: string }[]

import { useRef, useState } from "react";
import { apiFetch } from "../../lib/api-client";

interface UploadedPhoto {
  url: string;
  name: string;
}

interface ServicePhotoUploadProps {
  /** label แสดงเหนือ upload zone */
  label?: string;
  /** max จำนวนไฟล์ */
  maxFiles?: number;
  /** callback เมื่อ upload สำเร็จ — ส่ง URL list ออกไป */
  onUpload?: (urls: string[]) => void;
  /** รายการ URL ที่มีอยู่แล้ว (แก้ไข mode) */
  existingUrls?: string[];
}

export default function ServicePhotoUpload({
  label = "รูปภาพงาน",
  maxFiles = 5,
  onUpload,
  existingUrls = [],
}: ServicePhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<UploadedPhoto[]>(
    existingUrls.map((url) => ({ url, name: url.split("/").pop() ?? "photo" })),
  );
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = maxFiles - photos.length;
    if (remaining <= 0) {
      setError(`อัพโหลดได้สูงสุด ${maxFiles} ไฟล์`);
      return;
    }

    setError(null);
    setUploading(true);

    const toUpload = Array.from(files).slice(0, remaining);
    const newPhotos: UploadedPhoto[] = [];

    for (const file of toUpload) {
      if (!file.type.startsWith("image/")) {
        setError("รองรับเฉพาะไฟล์รูปภาพ (jpg, png, webp)");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("context", "service_photo");

      try {
        const res = await apiFetch("/api/v1/upload", { method: "POST", body: formData });
        if (!res.ok) {
          setError(`อัพโหลดล้มเหลว: HTTP ${res.status}`);
          continue;
        }
        const data = (await res.json()) as { url: string };
        newPhotos.push({ url: data.url, name: file.name });
      } catch {
        setError("เชื่อมต่อ server ล้มเหลว — กรุณาลองอีกครั้ง");
      }
    }

    setUploading(false);
    if (newPhotos.length > 0) {
      const updated = [...photos, ...newPhotos];
      setPhotos(updated);
      onUpload?.(updated.map((p) => p.url));
    }
  }

  function removePhoto(url: string) {
    const updated = photos.filter((p) => p.url !== url);
    setPhotos(updated);
    onUpload?.(updated.map((p) => p.url));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-400">{photos.length}/{maxFiles} ไฟล์</span>
      </div>

      {/* Upload zone */}
      {photos.length < maxFiles && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span className="text-sm">กำลังอัพโหลด...</span>
            </div>
          ) : (
            <>
              <div className="text-3xl mb-2">📸</div>
              <div className="text-sm text-gray-600">แตะเพื่อเลือกรูป</div>
              <div className="text-xs text-gray-400 mt-1">jpg / png / webp, สูงสุด 5MB ต่อไฟล์</div>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Error */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          ⚠️ {error}
        </div>
      )}

      {/* Photo thumbnails */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div key={photo.url} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(photo.url)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
