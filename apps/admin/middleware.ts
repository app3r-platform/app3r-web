import { NextRequest, NextResponse } from "next/server";

// ═══════════════════════════════════════════════════════════════════
// Admin Middleware — Auth gate + DEV bypass
// งาน C — Phase 3 Sign-off Prep (HUB Gen 33)
// ═══════════════════════════════════════════════════════════════════

export function middleware(request: NextRequest) {
  // DEV bypass: NEXT_PUBLIC_DEV_NAV=true → ข้ามการตรวจ auth ทั้งหมด
  // inject mock admin identity ผ่าน response header
  if (process.env.NEXT_PUBLIC_DEV_NAV === "true") {
    const response = NextResponse.next();
    response.headers.set(
      "x-dev-admin",
      JSON.stringify({ id: "dev-admin-001", name: "Dev Admin", role: "admin" })
    );
    return response;
  }

  // Production: ผ่านไปตามปกติ (auth ตรวจใน lib/auth.ts ฝั่ง client)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|login).*)"],
};
