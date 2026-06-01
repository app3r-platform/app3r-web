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
            {/* WeeeU — ลูกค้าทั่วไปลงขาย */}
            <RoleAwareCTA
              intent="sell"
              variant="primary"
              className="flex-1"
              overrides={{
                anonymous: { label: "🛒 ลงขาย (ลูกค้า WeeeU)" },
                weeeu: { label: "🛒 ลงขายมือสอง" },
                weeer: { label: "🛒 ลงขายในนามร้าน" },
              }}
            />
            {/* WeeeR — ร้านลงขาย/รับซื้อ */}
            <RoleAwareCTA
              intent="post-resell"
              variant="outline"
              className="flex-1"
              overrides={{
                anonymous: { label: "🏪 สมัครเป็นร้าน (WeeeR)", target: "/register/weeer" },
                weeeu: { label: "🏪 เปิดร้าน WeeeR", target: "/register/weeer" },
                weeer: { label: "🏪 ลงขายในร้าน" },
              }}
            />
          </div>
        </div>

        {/* แจ้งความต้องการซ่อม / บำรุงรักษา */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl shrink-0">🔧</span>
            <div>
              <p className="font-bold text-blue-900 text-sm sm:text-base">
                แจ้งความต้องการซ่อม / บำรุงรักษา
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                แจ้งงานช่าง รับข้อเสนอจากร้านที่ผ่านการรับรอง
              </p>
            </div>
          </div>
          <RoleAwareCTA
            intent="post-repair"
            variant="primary"
            className="w-full sm:w-auto"
            overrides={{
              anonymous: { label: "🔧 แจ้งงานช่าง (เริ่มที่นี่)" },
              weeeu: { label: "🔧 แจ้งงานซ่อม/บำรุงรักษา" },
              weeer: { label: "🔧 ดูงานซ่อมที่ประกาศ" },
            }}
          />
        </div>
      </div>
    </section>
  );
}
