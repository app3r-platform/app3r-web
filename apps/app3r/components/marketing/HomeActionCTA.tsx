// ============================================================
// components/marketing/HomeActionCTA.tsx
// W-01 (D2): CTA block เหนือ HomeListings
// - "ลงประกาศขาย" แยกเป็น 2 ทาง: WeeeU (ลูกค้า) / WeeeR (ร้าน) ผ่าน RoleAwareCTA
// - "แจ้งความต้องการซ่อม/บำรุงรักษา" ผ่าน RoleAwareCTA (role-aware)
// RoleAwareCTA จัดการ login/role/ปลายทาง cross-app (ENV stub) ให้เอง — ไม่มี dead link
// ============================================================
import { RoleAwareCTA } from "@/components/common";

export default function HomeActionCTA() {
  return (
    <section className="max-w-7xl mx-auto px-4 -mt-6 mb-2 relative z-10">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ลงประกาศขาย — แยก WeeeU / WeeeR */}
        <div className="rounded-xl bg-website-brand-50 border border-website-brand-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl shrink-0">📦</span>
            <div>
              <p className="font-bold text-website-brand-900 text-sm sm:text-base">
                ลงประกาศขายเครื่องใช้ไฟฟ้ามือสอง
              </p>
              <p className="text-xs text-website-brand-700 mt-0.5">
                เลือกช่องทางที่ตรงกับคุณ — ลูกค้าทั่วไป หรือร้านค้า
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* ขายมือสอง — WeeeU ลูกค้า / WeeeR ร้าน (anonymous = signup) */}
            <RoleAwareCTA
              intent="sell"
              variant="primary"
              className="flex-1"
              overrides={{
                weeeu: { label: "🛒 ลงขายมือสอง" },
                weeer: { label: "🛒 ลงขายในนามร้าน" },
              }}
            />
            {/* ปุ่มที่ 2: anonymous=สมัครร้าน · weeeu=ลงขาย/ทิ้งซาก · weeer=ลงขายอะไหล่ */}
            <RoleAwareCTA
              intent="post-resell"
              variant="outline"
              className="flex-1"
              overrides={{
                anonymous: { label: "🏪 สมัครในนามร้าน/บริษัท (WeeeR)", target: "/register/weeer" },
                weeeu: { label: "♻️ ลงขาย/ทิ้งซาก" },
                weeer: { label: "🏪 ลงขายอะไหล่ในร้าน" },
              }}
            />
          </div>
        </div>

        {/* แจ้งความต้องการซ่อม / บำรุงรักษาเครื่องใช้ไฟฟ้า */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl shrink-0">🔧</span>
            <div>
              <p className="font-bold text-blue-900 text-sm sm:text-base">
                แจ้งความต้องการซ่อม / บำรุงรักษาเครื่องใช้ไฟฟ้า
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                แจ้งงานช่าง รับข้อเสนอจากร้านที่ผ่านการรับรอง
              </p>
            </div>
          </div>
          {/* 2 ปุ่มแยกหน้า: ซ่อม / บำรุงรักษา (WeeeR #5) */}
          <div className="flex flex-col sm:flex-row gap-2">
            <RoleAwareCTA
              intent="post-repair"
              variant="primary"
              className="flex-1"
              overrides={{
                anonymous: { label: "🏢 เสนอให้บริการ (ร้าน/บริษัท)", target: "/register/weeer" },
                weeeu: { label: "🔧 แจ้งงานซ่อม" },
                weeer: { label: "🔧 ดูงานที่ยื่นข้อเสนอให้บริการซ่อม" },
              }}
            />
            <RoleAwareCTA
              intent="post-repair"
              variant="outline"
              className="flex-1"
              overrides={{
                anonymous: { label: "🛒 แจ้งความต้องการใช้บริการ (ทั่วไป)" },
                weeeu: { label: "🛡️ แจ้งงานบำรุงรักษา" },
                weeer: { label: "🛡️ ดูงานบำรุงรักษาที่ประกาศ" },
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
