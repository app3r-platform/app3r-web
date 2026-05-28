"use client";
// ============================================================
// components/listings/RoleAwareCard.tsx
// W-2-B (D1): role-based click interceptor
// - Anonymous: intercept click → redirect /register/weeer (เพื่อสมัคร)
// - WeeeU/WeeeR/WeeeT: ปล่อยให้ inner Link ทำงานปกติ (ไป detail page)
//
// Implementation: ใช้ onClickCapture เพื่อ intercept ก่อน Link's onClick
// ============================================================
import { useRouter } from "next/navigation";
import { ReactNode, MouseEvent } from "react";
import { useMockRole } from "@/lib/auth/useMockRole";

interface RoleAwareCardProps {
  href: string;
  children: ReactNode;
}

export default function RoleAwareCard({ href, children }: RoleAwareCardProps) {
  const router = useRouter();
  const { role, mounted } = useMockRole();

  function handleClickCapture(e: MouseEvent<HTMLDivElement>) {
    if (!mounted) return;
    if (role === "anonymous") {
      // Anonymous: intercept ก่อน inner Link จะ navigate
      e.preventDefault();
      e.stopPropagation();
      router.push("/register/weeer");
    }
    // role อื่นๆ: ปล่อยให้ inner Link ทำงานปกติ
  }

  return (
    <div onClickCapture={handleClickCapture} className="h-full">
      {children}
    </div>
  );
}
