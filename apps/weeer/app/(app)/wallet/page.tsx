// ── Wallet — WeeeR (D-2 Earner Payment UI + Manual Bank Transfer D-3) ──────────
// WeeeR = ผู้รับเงิน (earner) — รับเงินจาก WeeeU escrow release
// D-3: เพิ่ม Manual Bank Transfer — deposit/withdraw/history pages
// Decision Record C: 360813ec-7277-8143-9011-ca6cd91b621d
import Link from "next/link";
import type { Metadata } from "next";
import { MockAnnoOrigin, MockAnnoNav } from "@/components/MockAnno";
import { HelpTip } from "@app3r/ui";
import { GoldBalance } from "@/components/wallet/GoldBalance";

export const metadata: Metadata = { title: "กระเป๋าเงิน — WeeeR" };

export default function WalletPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* §5 Origin */}
      <MockAnnoOrigin from="R-01" />
      <h1 className="text-xl font-bold text-gray-900">กระเป๋าเงิน</h1>

      {/* ยอดคงเหลือ — พอยต์ทอง = real balance (suppress ถ้าไม่พร้อม) · พอยต์เงิน suppressed (ไม่มี real endpoint) */}
      <div className="grid grid-cols-1 gap-4">
        <GoldBalance variant="headline" />
      </div>

      {/* Payment Earner Info (D-2) */}
      <div className="bg-[#FFF1ED] rounded-2xl border border-[#FFE0D6] p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">💰</span>
          <div>
            <div className="text-sm font-semibold text-[#B8300E] mb-1">วิธีรับเงิน (WeeeR Earner)</div>
            <ul className="text-xs text-[#D63B12] space-y-1">
              <li>• งานบริการ (Repair / Maintain): WeeeU ยืนยัน → ปลดพักเงินกลาง (Escrow)<HelpTip content="เงินของคุณจะถูกเก็บไว้ในระบบกลางอย่างปลอดภัย จนกว่างานเสร็จและคุณยืนยัน จึงโอนให้ปลายทาง" /> → ได้รับ พอยต์ทอง อัตโนมัติ</li>
              <li>• B2B Parts: ผู้ซื้อกด "รับของ" → ปลดพักเงินกลาง → หักค่าธรรมเนียม 3% → รับ พอยต์ทอง{/* PHASE-4: D81 */}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick actions — Sub-6: เพิ่ม Settlements (Settlement API) */}
      <div className="grid grid-cols-3 gap-3">
        <MockAnnoNav to="R-74">
          <Link
            href="/wallet/deposit"
            className="bg-[#FFF1ED] border border-[#FFE0D6] rounded-2xl p-4 text-center hover:bg-[#FFE0D6] transition-colors block"
          >
            <div className="text-2xl mb-1">📥</div>
            <div className="text-xs font-semibold text-[#B8300E]">เติมแต้ม</div>
            <div className="text-xs text-[#F04E20] mt-0.5">โอนเงิน</div>
          </Link>
        </MockAnnoNav>
        <MockAnnoNav to="R-77">
          <Link
            href="/wallet/withdraw"
            className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center hover:bg-gray-100 transition-colors block"
          >
            <div className="text-2xl mb-1">📤</div>
            <div className="text-xs font-semibold text-gray-800">ถอนแต้ม</div>
            <div className="text-xs text-gray-500 mt-0.5">Settlement</div>
          </Link>
        </MockAnnoNav>
        <MockAnnoNav to="R-76">
          <Link
            href="/wallet/settlements"
            className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center hover:bg-gray-100 transition-colors block"
          >
            <div className="text-2xl mb-1">💸</div>
            <div className="text-xs font-semibold text-gray-800">ประวัติถอน</div>
            <div className="text-xs text-gray-500 mt-0.5">Settlements</div>
          </Link>
        </MockAnnoNav>
      </div>

      {/* ประวัติธุรกรรม — suppress fake list (ยังไม่มี transactions endpoint · D-FE-NO-FAKE-DISPLAY) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">ประวัติธุรกรรม</h3>
        <p className="text-sm text-gray-400 text-center py-6">ยังไม่มีประวัติธุรกรรม</p>
      </div>
    </div>
  );
}
