"use client";
import { useRef, useState } from "react";
import { mockUploadImage, mockUploadVideo } from "@/lib/utils/mock-upload";
import type { ProgressStepMedia } from "@/lib/types/service-progress";

interface Props {
  onMediaAdded: (media: Partial<ProgressStepMedia>) => void;
}

export function MockMediaUploader({ onMediaAdded }: Props) {
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await mockUploadImage(file);
      onMediaAdded({
        images: [
          {
            id: result.id,
            url: result.url,
            uploaded_by: "weeet",
            uploaded_at: new Date().toISOString(),
          },
        ],
        videos: [],
      });
    } finally {
      setUploading(false);
      if (imageRef.current) imageRef.current.value = "";
    }
  }

  async function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await mockUploadVideo(file);
      onMediaAdded({
        images: [],
        videos: [
          {
            id: result.id,
            url: result.url,
            duration_seconds: result.duration_seconds,
            uploaded_by: "weeet",
            uploaded_at: new Date().toISOString(),
          },
        ],
      });
    } finally {
      setUploading(false);
      if (videoRef.current) videoRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-400">แนบสื่อ (Mock — Phase 2)</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => imageRef.current?.click()}
          className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-200 text-xs py-2 rounded-lg transition-colors"
        >
          {uploading ? "กำลังอัปโหลด..." : "📷 เพิ่มรูป"}
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={() => videoRef.current?.click()}
          className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-200 text-xs py-2 rounded-lg transition-colors"
        >
          {uploading ? "..." : "🎬 เพิ่มวิดีโอ"}
        </button>
      </div>
      <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
      <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
      <p className="text-xs text-gray-600 italic">
        ⚠️ Phase 2: ใช้ Lorem Picsum แทน real upload (D76 defer Phase D)
      </p>
    </div>
  );
}
