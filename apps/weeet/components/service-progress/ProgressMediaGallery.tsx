"use client";
import { useState } from "react";
import type { ProgressStepMedia } from "@/lib/types/service-progress";

export function ProgressMediaGallery({ media }: { media: ProgressStepMedia }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!media.images.length && !media.videos.length) return null;

  return (
    <div className="space-y-2">
      {media.images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {media.images.map((img) => (
            <button
              key={img.id}
              onClick={() => setLightbox(img.url)}
              className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-700 hover:border-weeet-primary transition-colors"
              type="button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.caption ?? "รูปประกอบ"} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {media.videos.length > 0 && (
        <div className="space-y-2">
          {media.videos.map((vid) => (
            <div key={vid.id} className="space-y-1">
              {/* B8 — ป้ายกำกับคลิปก่อน/หลังซ่อม */}
              {vid.caption && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-weeet-primary bg-weeet-surface/15 border border-weeet-dark/30 rounded-full px-2 py-0.5">
                  🎬 {vid.caption}
                </span>
              )}
              <video
                src={vid.url}
                controls
                className="w-full rounded-lg max-h-48 bg-black"
              />
            </div>
          ))}
        </div>
      )}
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="ขยาย" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
