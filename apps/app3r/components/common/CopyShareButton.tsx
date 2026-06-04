"use client";
// ============================================================
// components/common/CopyShareButton.tsx — Round 2 WP-1
// ปุ่มคัดลอก/แชร์ลิงก์ประกาศ (เลนส์ #4 · กฎธุรกิจ §11)
//
// ใช้ลิงก์จริงของหน้าปัจจุบัน (ไม่ใช่ mock): resolve path → absolute URL ผ่าน
// window.location.origin. รองรับ Web Share API (มือถือ) + clipboard fallback.
// ทุกหน้ารายละเอียดประกาศต้องมีปุ่มนี้ (W-07/08/09/10).
// ============================================================
import { useState } from "react";

interface CopyShareButtonProps {
  /** path หรือ absolute URL ที่จะแชร์ (default = URL หน้าปัจจุบัน) */
  url?: string;
  /** ชื่อประกาศ — ใช้กับ Web Share API */
  title?: string;
  /** รูปแบบ: ปุ่มเต็ม หรือไอคอนอย่างเดียว */
  variant?: "button" | "icon";
  className?: string;
}

export default function CopyShareButton({
  url,
  title = "ประกาศบน App3R",
  variant = "button",
  className = "",
}: CopyShareButtonProps) {
  const [copied, setCopied] = useState(false);

  function resolveUrl(): string {
    if (typeof window === "undefined") return url ?? "";
    if (!url) return window.location.href;
    // absolute already?
    if (/^https?:\/\//i.test(url)) return url;
    return new URL(url, window.location.origin).toString();
  }

  async function handleShare() {
    const shareUrl = resolveUrl();
    // Web Share API (มือถือ) — ถ้ามี ให้เปิด native share sheet
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        // ผู้ใช้ยกเลิก share → fallback ไป clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard ไม่พร้อม (เช่น non-secure context) — prompt fallback
      window.prompt("คัดลอกลิงก์นี้:", shareUrl);
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleShare}
        aria-label={copied ? "คัดลอกลิงก์แล้ว" : "คัดลอกลิงก์ประกาศ"}
        title={copied ? "คัดลอกแล้ว!" : "คัดลอก/แชร์ลิงก์"}
        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 text-gray-600 hover:border-website-brand-500 hover:text-website-brand-700 transition ${className}`}
      >
        {copied ? "✓" : "🔗"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="คัดลอก/แชร์ลิงก์ประกาศ"
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:border-website-brand-500 hover:text-website-brand-700 transition ${className}`}
    >
      <span>{copied ? "✓" : "🔗"}</span>
      <span>{copied ? "คัดลอกลิงก์แล้ว" : "คัดลอก / แชร์ลิงก์"}</span>
    </button>
  );
}
