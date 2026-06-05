"use client";
/**
 * FallbackImg — D1 media fallback สำหรับรูปภาพ mockup (picsum / external URL)
 * ใช้ใน Server Component แทน <img onError> ที่ใช้ใน Client Component ไม่ได้
 */

const FALLBACK_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect fill='%23f3f4f6' width='100%25' height='100%25'/%3E%3Ctext fill='%239ca3af' font-size='12' font-family='sans-serif' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3Eรูปภาพ%3C/text%3E%3C/svg%3E";

interface FallbackImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

export function FallbackImg({ src, alt, className, ...rest }: FallbackImgProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        const t = e.target as HTMLImageElement;
        t.onerror = null; // ป้องกัน infinite loop
        t.src = FALLBACK_SVG;
      }}
      {...rest}
    />
  );
}
