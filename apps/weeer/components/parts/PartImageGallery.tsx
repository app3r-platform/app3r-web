"use client";

import { useState } from "react";
import Image from "next/image";

interface PartImageGalleryProps {
  images: string[];
  name: string;
}

export function PartImageGallery({ images, name }: PartImageGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const list = images.length > 0 ? images : [`https://picsum.photos/400/300?seed=${name}`];

  return (
    <>
      {/* รูปหลัก */}
      <div
        className="relative w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden cursor-zoom-in"
        onClick={() => setLightbox(true)}
      >
        <Image src={list[selected]} alt={name} fill className="object-cover" unoptimized />
        {list.length > 1 && (
          <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full">
            {selected + 1}/{list.length}
          </span>
        )}
      </div>

      {/* Thumbnails (ภาพขนาดเล็ก) */}
      {list.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {list.map((url, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                i === selected ? "border-green-500" : "border-transparent"
              }`}
            >
              <Image src={url} alt={`${name} ${i + 1}`} width={56} height={56} className="w-full h-full object-cover" unoptimized />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox (ขยายรูป) */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <Image src={list[selected]} alt={name} width={800} height={600} className="w-full rounded-xl object-contain" unoptimized />
            <button onClick={() => setLightbox(false)} className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">✕</button>
          </div>
        </div>
      )}
    </>
  );
}
