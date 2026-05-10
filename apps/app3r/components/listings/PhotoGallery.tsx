"use client";

// ============================================================
// components/listings/PhotoGallery.tsx — Image gallery
// ============================================================
import { useState } from "react";
import Image from "next/image";

interface PhotoGalleryProps {
  images: string[];
  alt: string;
}

export default function PhotoGallery({ images, alt }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-[4/3]">
        <Image
          src={images[selectedIndex]}
          alt={`${alt} รูปที่ ${selectedIndex + 1}`}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 600px"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 transition ${
                i === selectedIndex
                  ? "border-purple-600"
                  : "border-transparent hover:border-purple-300"
              }`}
            >
              <Image
                src={src}
                alt={`thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
