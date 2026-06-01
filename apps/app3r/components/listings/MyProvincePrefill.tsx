"use client";

// ============================================================
// components/listings/MyProvincePrefill.tsx
// W-07: prefill จังหวัดจาก mock profile (ยังเลือกดูทุกจังหวัดได้)
// - อ่าน role จาก useMockRole(); profile province เป็น stub (mock only).
// - ถ้ายังไม่ได้เลือก area → auto-apply จังหวัดของฉันครั้งเดียว.
// - มีปุ่ม "ดูทุกจังหวัด" ให้ override ได้เสมอ.
// ============================================================
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useMockRole } from "@/lib/auth/useMockRole";

// Mock profile province ต่อ role (stub — ไม่มี DB จริง)
const MOCK_PROFILE_PROVINCE: Record<string, string> = {
  weeeu: "กรุงเทพมหานคร",
  weeer: "เชียงใหม่",
};

interface MyProvincePrefillProps {
  /** ชื่อ query param พื้นที่ (default "area") */
  paramKey?: string;
}

export default function MyProvincePrefill({ paramKey = "area" }: MyProvincePrefillProps) {
  const { role, mounted } = useMockRole();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const appliedRef = useRef(false);

  const myProvince = MOCK_PROFILE_PROVINCE[role];
  const currentArea = searchParams.get(paramKey) ?? "";

  // auto-apply ครั้งเดียวเมื่อ mount ถ้ายังไม่ได้เลือกพื้นที่
  useEffect(() => {
    if (!mounted || appliedRef.current) return;
    if (!myProvince) return;
    if (currentArea) return; // เคารพ choice เดิมของผู้ใช้
    appliedRef.current = true;
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramKey, myProvince);
    router.replace(`${pathname}?${params.toString()}`);
  }, [mounted, myProvince, currentArea, paramKey, pathname, router, searchParams]);

  if (!mounted || !myProvince) return null;

  const isMine = currentArea === myProvince;

  return (
    <div className="rounded-lg bg-website-brand-50 border border-website-brand-200 px-3 py-2 text-xs text-website-brand-800">
      {isMine ? (
        <span className="flex items-center justify-between gap-2">
          <span>📍 แสดงจังหวัดของฉัน: <strong>{myProvince}</strong></span>
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete(paramKey);
              router.push(`${pathname}?${params.toString()}`);
            }}
            className="font-medium underline hover:no-underline"
          >
            ดูทุกจังหวัด
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set(paramKey, myProvince);
            router.push(`${pathname}?${params.toString()}`);
          }}
          className="font-medium underline hover:no-underline"
        >
          📍 ใช้จังหวัดของฉัน ({myProvince})
        </button>
      )}
    </div>
  );
}
