import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * WeeeU middleware
 *
 * DEV_NAV bypass: เมื่อ NEXT_PUBLIC_DEV_NAV=true → ข้าม auth check ทุกอย่าง
 * ใช้สำหรับ Phase 3 sign-off / manual walk-through เท่านั้น
 * TODO: เพิ่ม real auth guard (Phase 4) — ตรวจ JWT / refresh token ที่นี่
 */
export function middleware(request: NextRequest) {
  // ── Dev Navigator bypass (dev-only) ─────────────────────────────────────────
  if (process.env.NEXT_PUBLIC_DEV_NAV === "true") {
    return NextResponse.next();
  }

  // ── Production auth guard placeholder ───────────────────────────────────────
  // TODO Phase 4: ตรวจ cookie/header JWT → redirect ถ้าไม่มี session
  return NextResponse.next();
}

export const config = {
  // จับทุก route ยกเว้น static assets, _next internals, และ favicon
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo/).*)"],
};