"use client";
// ============================================================
// lib/auth/useMockRole.ts — Client-side hook
// W-2-B: read mock role from localStorage + cookie (sync)
// ⚠️ R4 mitigation: บังคับ env check ก่อน return role อื่นนอกจาก "anonymous"
// ============================================================
import { useEffect, useState } from "react";
import type { MockRole } from "./mock-role";
import { MOCK_ROLE_STORAGE, isDevNavEnabled } from "./mock-role";

export function useMockRole(): { role: MockRole; mounted: boolean } {
  const [role, setRole] = useState<MockRole>("anonymous");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // R4 guard: ถ้า DEV_NAV ไม่ active → role = anonymous เสมอ
    if (!isDevNavEnabled()) {
      setRole("anonymous");
      return;
    }
    try {
      const stored = localStorage.getItem(MOCK_ROLE_STORAGE) as MockRole | null;
      if (stored && ["anonymous", "weeeu", "weeer", "weeet"].includes(stored)) {
        setRole(stored);
      }
    } catch {
      // localStorage may not be available
    }
  }, []);

  return { role, mounted };
}

// NOTE: getMockRoleFromCookie() ย้ายไป mock-role.ts (server-safe, ไม่มี "use client")
// import จาก @/lib/auth/mock-role แทน
