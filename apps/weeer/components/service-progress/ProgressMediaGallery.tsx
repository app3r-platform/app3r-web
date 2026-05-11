"use client";

// ── ProgressMediaGallery — Phase C-5 ─────────────────────────────────────────

import { useState } from "react";
import Image from "next/image";

interface ProgressMediaGalleryProps {
  media: string[];
}

export function ProgressMediaGallery({ media }: ProgressMediaGalleryProps) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!media.length) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        {media.map((url, i) => (
          <button
            key={i}
            onClick={() => setLightbox(url)}
            className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-green-400 transition-colors shrink-0"
          >
            <Image
              src={url}
              alt={`ภาพที่ ${i + 1}`}
              width={64}
              height={64}
              className="w-full h-full object-cover"
              unoptimized
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightbox}
              alt="ขยาย"
              width={800}
              height={600}
              className="w-full rounded-xl object-contain"
              unoptimized
            />
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
