"use client";

// ── Stale Parts Order Detail → redirect (burn-down Gen78) ─────────────────────
// หน้านี้เป็น buyer view เก่า (vocab fulfilled/held) — canonical คือ /parts/my-orders
// redirect ไป /parts/my-orders เสมอ (subroutes orders/[id]/dispute + /rate ยังคงอยู่)

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StalePartsOrderRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/parts/my-orders");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
      กำลังนำทางไปคำสั่งซื้อของฉัน…
    </div>
  );
}
