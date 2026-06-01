// ============================================================
// components/common/ConditionalSection.tsx — C7
// Renders children only if `data` is a non-empty array.
// Empty / undefined / null → renders nothing. Server-friendly.
// ============================================================
import type { ReactNode } from "react";

export interface ConditionalSectionProps {
  /** ข้อมูลที่ใช้ตัดสินใจ render — ว่าง/null/undefined = ไม่ render */
  data: unknown[] | undefined | null;
  children: ReactNode;
}

export default function ConditionalSection({ data, children }: ConditionalSectionProps) {
  if (!data || data.length === 0) return null;
  return <>{children}</>;
}
