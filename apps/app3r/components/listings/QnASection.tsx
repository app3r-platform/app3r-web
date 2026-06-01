"use client";

// ============================================================
// components/listings/QnASection.tsx
// Client bridge: reads useMockRole() and renders QnAThread (C6) with
// MOCK role-based visibility. Lets Server Components include the Q&A box.
// ============================================================
import { useMockRole } from "@/lib/auth/useMockRole";
import QnAThread, { type QnAItem } from "@/components/listings/QnAThread";

interface QnASectionProps {
  questions: QnAItem[];
  /**
   * บอกว่าผู้ชม (จาก cookie ฝั่ง server) เป็นเจ้าของประกาศหรือ admin หรือไม่ —
   * ใช้ override ให้เห็นทุกคำถาม (owner view). client useMockRole มีแค่ 4 role
   * จึงรับค่านี้เสริมจาก server.
   */
  forceOwnerView?: boolean;
  className?: string;
}

export default function QnASection({
  questions,
  forceOwnerView = false,
  className = "",
}: QnASectionProps) {
  const { role } = useMockRole();
  // owner view: เจ้าของประกาศ (weeeu-owner) หรือ admin → เห็นทุกคำถาม
  const isOwner = forceOwnerView;

  return (
    <QnAThread
      questions={questions}
      currentRole={role}
      isOwner={isOwner}
      className={className}
    />
  );
}
