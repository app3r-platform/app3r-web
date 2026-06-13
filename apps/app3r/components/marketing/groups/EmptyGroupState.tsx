// ============================================================
// components/marketing/groups/EmptyGroupState.tsx — Round 2 W-01
// Empty-state ที่มีความหมาย + กระตุ้นการใช้งาน (เลนส์ #5)
// ใช้ร่วมทุกกลุ่มในหน้าแรก (Resell/Scrap/Repair/Maintain) แทนข้อความ "📭 ยังไม่มี..."
// isOwner = true (WeeeU view เห็นเฉพาะของตน) → ชวนลงประกาศชิ้นแรก
// ============================================================
import Link from "next/link";

interface EmptyGroupStateProps {
  icon: string;
  /** ชื่อโมดูล (เช่น "ขายมือสอง") */
  title: string;
  /** ปลายทาง browse ของโมดูล (เช่น /listings/resell) — ลิงก์จริง */
  browseHref: string;
  /** ข้อความเมื่อเป็นเจ้าของ (WeeeU) ที่ยังไม่มีของตน */
  ownerMessage: string;
  /** ข้อความเมื่อยังไม่มีประกาศในระบบ (ผู้เยี่ยมชม) */
  guestMessage: string;
  /** label ปุ่มลงประกาศ (เฉพาะ owner) */
  postLabel: string;
  isOwner: boolean;
}

export default function EmptyGroupState({
  icon,
  title,
  browseHref,
  ownerMessage,
  guestMessage,
  postLabel,
  isOwner,
}: EmptyGroupStateProps) {
  return (
    <section className="w-full px-4 py-10 border-b border-gray-100">
      {/* หัวข้อโมดูล — แยกโมดูลชัดเจนแม้ยังไม่มีรายการ */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>

      <div className="bg-gradient-to-br from-website-brand-50 to-gray-50 border border-website-brand-100 rounded-2xl p-8 text-center">
        <p className="text-4xl mb-3">{icon}</p>
        <p className="text-gray-700 font-medium mb-1">
          {isOwner ? ownerMessage : guestMessage}
        </p>
        <p className="text-gray-400 text-sm mb-5">
          {isOwner
            ? "เริ่มลงประกาศเพื่อให้ร้านค้าและช่างเห็นและยื่นข้อเสนอ"
            : "กลับมาดูใหม่เร็ว ๆ นี้ หรือเริ่มลงประกาศของคุณเอง"}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isOwner && (
            <Link
              href={browseHref}
              className="inline-flex items-center justify-center gap-1 bg-website-brand-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-website-brand-800 transition"
            >
              {postLabel}
            </Link>
          )}
          <Link
            href={browseHref}
            className="inline-flex items-center justify-center gap-1 border border-website-brand-300 text-website-brand-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-website-brand-50 transition"
          >
            ดู{title}ทั้งหมด →
          </Link>
        </div>
      </div>
    </section>
  );
}
