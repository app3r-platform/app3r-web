"use client";
// ============================================================
// components/marketing/AboutCTA.tsx — Fix-Wave A · W-02
// CTA "พร้อมเริ่มต้น?" แบบ role-conditional:
//   - visitor (anonymous): แสดง "สมัคร WeeeU" + "ติดต่อเรา"
//   - logged-in (weeeu/weeer/weeet): ปิด section ทั้งหมด (เป็นสมาชิกแล้ว)
// ============================================================
import Link from "next/link";
import { useMockRole } from "@/lib/auth/useMockRole";
import { crossAppUrls } from "@/lib/config/urls";

export default function AboutCTA() {
  const { role, mounted } = useMockRole();

  // logged-in (mock) → ไม่แสดง CTA สมัคร (กัน hydration: render สำหรับ anonymous ก่อน mount)
  if (mounted && role !== "anonymous") return null;

  return (
    <div className="mt-10 bg-website-brand-50 border border-website-brand-200 rounded-2xl p-8 text-center space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">พร้อมเริ่มต้นแล้วหรือยัง?</h2>
      <p className="text-gray-600">สมัครฟรี เริ่มใช้งานได้ทันที</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={crossAppUrls.weeeu.signup}
          className="bg-website-brand-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-website-brand-800 transition"
        >
          สมัคร WeeeU (ผู้ใช้ทั่วไป)
        </a>
        <Link
          href="/contact"
          className="border border-website-brand-700 text-website-brand-700 px-6 py-3 rounded-xl font-semibold hover:bg-website-brand-50 transition"
        >
          ติดต่อเรา
        </Link>
      </div>
      <p className="text-xs text-gray-500">
        เป็นร้านซ่อม/บริษัท?{" "}
        <Link href="/register/weeer" className="text-website-brand-700 underline font-medium">
          สมัครในนามร้าน/บริษัท (WeeeR)
        </Link>
      </p>
    </div>
  );
}
