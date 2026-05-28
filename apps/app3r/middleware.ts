// ============================================================
// middleware.ts — Production guard for mock_role cookie
// W-2-B (D3): R4 mitigation — reject mock_role ใน production
//
// 🚨 CRITICAL R4 (Risk Register HIGH):
//   ป้องกัน mock auth ไม่ให้ leak สู่ production
//   1. ใน production (NODE_ENV=production + DEV_NAV ไม่เปิด) → ลบ cookie ทันที
//   2. log warning ถ้าพบ mock_role cookie ใน production
// ============================================================
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const isProd = process.env.NODE_ENV === "production";
  const devNavEnabled = process.env.NEXT_PUBLIC_DEV_NAV === "true";
  const mockRoleCookie = request.cookies.get("app3r-mock-role");

  // R4 GUARD: ถ้าอยู่ production + DEV_NAV ไม่เปิด + พบ mock_role cookie
  // → ลบ cookie ทันที (กัน mock auth leak)
  if (isProd && !devNavEnabled && mockRoleCookie) {
    response.cookies.delete("app3r-mock-role");
    // log warning (จะเห็นใน serverless runtime logs)
    console.warn(
      "[R4 GUARD] Stripped mock_role cookie in production environment. " +
      "This cookie should never appear in production builds. " +
      "Path: " + request.nextUrl.pathname
    );
  }

  return response;
}

export const config = {
  // ทำงานเฉพาะ HTML routes (ข้าม API, _next/static, images)
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)",
  ],
};
