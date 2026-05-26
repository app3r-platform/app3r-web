import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * WeeeR middleware
 *
 * DEV_NAV bypass: เมื่อ NEXT_PUBLIC_DEV_NAV=true → ข้าม auth check ทุกอย่าง
 * + inject mock shop headers สำหรับ Phase 3 sign-off / manual walk-through
 * TODO: เพิ่ม real auth guard (Phase 4) — ตรวจ JWT / session ที่นี่
 */
export function middleware(request: NextRequest) {
  // ── Dev Navigator bypass (dev-only) ─────────────────────────────────────────
  if (process.env.NEXT_PUBLIC_DEV_NAV === "true") {
    const response = NextResponse.next();
    // inject mock shop identity ให้ pages อ่านผ่าน request headers
    response.headers.set("x-dev-shop-id",   "dev-shop-001");
    response.headers.set("x-dev-shop-name", "Dev Shop (WeeeR)");
    response.headers.set("x-dev-shop-role", "weeer");
    return response;
  }

  // ── Production auth guard placeholder ───────────────────────────────────────
  // TODO Phase 4: ตรวจ cookie/header JWT → redirect ถ้าไม่มี session
  return NextResponse.next();
}

export const config = {
  // จับทุก route ยกเว้น static assets, _next internals, และ favicon
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo/).*)"],
};
