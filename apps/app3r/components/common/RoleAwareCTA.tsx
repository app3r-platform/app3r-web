"use client";

// ============================================================
// components/common/RoleAwareCTA.tsx — C1
// Role-aware CTA (call-to-action) button/link using useMockRole().
// MOCKUP ONLY — cross-app targets via ENV stub, never hardcode a real domain.
// ============================================================
import Link from "next/link";
import { useMockRole } from "@/lib/auth/useMockRole";
import type { MockRole } from "@/lib/auth/mock-role";
import { crossAppUrls } from "@/lib/config/urls";

// Cross-app URL stubs — resolved via crossAppUrls (no hardcoded localhost).
const WEEEU_URL = crossAppUrls.weeeu.base;
const WEEER_URL = crossAppUrls.weeer.base;

/** Intent ของปุ่ม CTA — ใช้เลือกข้อความ default ต่อบริบท */
export type CTAIntent =
  | "sell" // ลงขายมือสอง
  | "interest" // สนใจ/ยื่นข้อเสนอ
  | "post-repair" // ลงประกาศงานซ่อม
  | "post-resell" // ลงขาย (alias สำหรับหน้า resell)
  | "generic"; // ทั่วไป

/** override ราย role (ถ้าต้องการปรับข้อความ/ปลายทางเฉพาะจุด) */
export interface RoleCTAOverride {
  label?: string;
  /** สำหรับ disabled role (weeet) — ข้อความอธิบาย */
  message?: string;
  /** ปลายทาง (internal path หรือ absolute URL) */
  target?: string;
}

export interface RoleAwareCTAProps {
  /** ข้อความหลักของปุ่ม (default ตาม intent) */
  label?: string;
  /** บริบทของ CTA — กำหนด default label/target */
  intent?: CTAIntent;
  /** override ราย role — additive, optional */
  overrides?: Partial<Record<MockRole, RoleCTAOverride>>;
  /** ขนาด/สไตล์ */
  variant?: "primary" | "outline";
  /** className เพิ่มเติม */
  className?: string;
}

const intentLabel: Record<CTAIntent, string> = {
  sell: "ลงขายสินค้า",
  interest: "สนใจรายการนี้",
  "post-repair": "ลงประกาศงานซ่อม",
  "post-resell": "ลงขายมือสอง",
  generic: "เริ่มใช้งาน",
};

// ปลายทาง default ตาม role + intent (mockup · deep-link navigate-only — ลิงก์จริง ไม่ dead)
// intent="interest" (สนใจ/ยื่นข้อเสนอซื้อ) → ส่งไปหน้าซื้อของแต่ละบริการ:
//   weeeu → /listings (ดู/ซื้อมือสองฝั่ง WeeeU)
//   weeer → /resell (ตลาดมือสองฝั่ง WeeeR เพื่อยื่นข้อเสนอซื้อ — หน้าจริง · เดิมชี้
//           /buy-offers/new ที่ยังไม่มี → 404; เปลี่ยนปลายทางจริงเมื่อ BE สร้าง phase ถัดไป)
function defaultTarget(role: MockRole, intent: CTAIntent): string {
  switch (role) {
    case "weeeu":
      return intent === "interest" ? crossAppUrls.weeeu.listings : WEEEU_URL;
    case "weeer":
      return intent === "interest" ? crossAppUrls.weeer.resell : WEEER_URL;
    default:
      return "#";
  }
}

const baseBtn =
  "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition";
const primaryBtn = `${baseBtn} bg-website-brand-500 text-white hover:bg-website-brand-600`;
const outlineBtn = `${baseBtn} border border-website-brand-500 text-website-brand-700 hover:bg-website-brand-50`;
const disabledBtn = `${baseBtn} bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed`;

export default function RoleAwareCTA({
  label,
  intent = "generic",
  overrides,
  variant = "primary",
  className = "",
}: RoleAwareCTAProps) {
  const { role, mounted } = useMockRole();
  const btnClass = variant === "primary" ? primaryBtn : outlineBtn;

  // หลีกเลี่ยง hydration mismatch — ก่อน mount แสดง placeholder กลาง (anonymous view)
  const effectiveRole: MockRole = mounted ? role : "anonymous";
  const ov = overrides?.[effectiveRole];
  const resolvedLabel = ov?.label ?? label ?? intentLabel[intent];

  // weeet — disabled (เป็นผู้ปฏิบัติ ไม่มี action ฝั่งนี้)
  if (effectiveRole === "weeet") {
    return (
      <span
        role="note"
        aria-disabled="true"
        className={`${disabledBtn} ${className}`}
        title={ov?.message ?? "ทำไม่ได้ (เป็นผู้ปฏิบัติ)"}
      >
        🔒 {ov?.message ?? "ทำไม่ได้ (เป็นผู้ปฏิบัติ — WeeeT)"}
      </span>
    );
  }

  // anonymous — เสนอทางเลือกสมัคร/เข้าสู่ระบบ (WeeeU vs WeeeR)
  if (effectiveRole === "anonymous") {
    // WeeeU สมัคร → /signup/email (canonical · เดิมชี้ /register = 404)
    const weeeuTarget = ov?.target ?? crossAppUrls.weeeu.signup;
    const weeerTarget = "/register/weeer"; // internal
    return (
      <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
        <Link href={weeerTarget} className={primaryBtn}>
          🔧 สมัครเป็นร้าน (WeeeR)
        </Link>
        <a href={weeeuTarget} className={outlineBtn}>
          🛒 สมัคร/เข้าสู่ระบบ (WeeeU)
        </a>
      </div>
    );
  }

  // weeeu / weeer — link to cross-app (ENV stub) หรือ override target
  const target = ov?.target ?? defaultTarget(effectiveRole, intent);
  const isInternal = target.startsWith("/");

  if (isInternal) {
    return (
      <Link href={target} className={`${btnClass} ${className}`}>
        {resolvedLabel}
      </Link>
    );
  }

  return (
    <a href={target} className={`${btnClass} ${className}`}>
      {resolvedLabel}
    </a>
  );
}
