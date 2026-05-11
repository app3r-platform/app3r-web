"use client";

import { useState } from "react";
import type { ProgressStepMedia } from "@/lib/types/service-progress";

interface Props {
  media: ProgressStepMedia;
}

export function ProgressMediaGallery({ media }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (media.images.length === 0 && media.videos.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Images */}
      {media.images.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">รูปภาพ ({media.images.length})</p>
          <div className="grid grid-cols-3 gap-2">
            {media.images.map((img) => (
              <button
                key={img.id}
                onClick={() => setLightbox(img.url)}
                className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.caption ?? "progress image"}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Videos */}
      {media.videos.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">วิดีโอ ({media.videos.length})</p>
          <div className="space-y-2">
            {media.videos.map((vid) => (
              <div
                key={vid.id}
                className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100"
              >
                <span className="text-2xl">▶️</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">
                    {vid.caption ?? "วิดีโอ"}
                  </p>
                  {vid.duration_seconds != null && (
                    <p className="text-xs text-gray-400">
                      {Math.floor(vid.duration_seconds / 60)}:{String(vid.duration_seconds % 60).padStart(2, "0")} น.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox overlay */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="enlarged"
            className="max-w-full max-h-full rounded-xl object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl leading-none"
            onClick={() => setLightbox(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
