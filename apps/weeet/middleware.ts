import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * WeeeT middleware
 *
 * DEV_NAV bypass: เมื่อ NEXT_PUBLIC_DEV_NAV=true → ข้าม auth check ทุกอย่าง
 * inject mock tech header เพื่อให้ downstream component รู้ว่าเป็น dev mode
 * ใช้สำหรับ Phase 3 sign-off / manual walk-through เท่านั้น
 * TODO Phase 4: เพิ่ม real auth guard — ตรวจ JWT / refresh token ที่นี่
 */
export function middleware(request: NextRequest) {
  // ── Dev Navigator bypass (dev-only) ─────────────────────────────────────────
  if (process.env.NEXT_PUBLIC_DEV_NAV === "true") {
    const res = NextResponse.next();
    // inject mock tech identity เพื่อให้ downstream ใช้งานได้
    res.headers.set(
      "x-dev-tech",
      JSON.stringify({ id: "dev-tech-001", name: "Dev Tech (WeeeT)", role: "weeet" })
    );
    return res;
  }

  // ── Production auth guard placeholder ───────────────────────────────────────
  // TODO Phase 4: ตรวจ cookie/header JWT → redirect ถ้าไม่มี session
  return NextResponse.next();
}

export const config = {
  // จับทุก route ยกเว้น static assets, _next internals, favicon, และ logo
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo/).*)"],
};
