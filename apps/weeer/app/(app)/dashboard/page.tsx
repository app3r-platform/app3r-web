import type { Metadata } from "next";
import Link from "next/link";
import { MultiJobDashboard } from "../../../components/service-progress/MultiJobDashboard";
import { MockAnnoNav, MockAnnoXApp } from "@/components/MockAnno";
import JobListPlaceholder from "@/components/JobListPlaceholder";

export const metadata: Metadata = { title: "Dashboard — WeeeR" };

const STATS = [
  { label: "พอยต์เงิน",   value: "350",    suffix: "พอยต์", icon: "🪙",  bg: "bg-gray-50",   text: "text-gray-700" },
  { label: "พอยต์ทอง",   value: "2,055",  suffix: "พอยต์", icon: "⭐",  bg: "bg-yellow-50",  text: "text-yellow-700" },
  { label: "งานเดือนนี้",  value: "37",     suffix: "งาน",  icon: "📋",  bg: "bg-blue-50",    text: "text-blue-700" },
  { label: "WeeeT ใช้งาน", value: "3",      suffix: "คน",   icon: "👷",  bg: "bg-[#FFF1ED]",   text: "text-[#D63B12]" },
];

// RECENT_JOBS / STATUS_STYLE / STATUS_LABEL ย้ายไป components/JobListPlaceholder.tsx (Wave1)

const WEEET_LIST = [
  { id: "R001-T00", name: "ร้าน ABC (ตัวเอง)", type: "default", status: "active" },
  { id: "R001-T01", name: "นายวิทยา ซ่อมเก่ง",  type: "rented",  status: "active" },
  { id: "R001-T02", name: "นายสมชาย ช่างดี",    type: "rented",  status: "active" },
  { id: "R001-T03", name: "นายมาลัย ไฟฟ้า",     type: "rented",  status: "suspended" },
];

const SHOP = {
  name: "ร้านซ่อมแอร์ ABC",
  status: "active", // active / pending / suspended
  gold: 1800,
};

const ACTIVE_REPAIR_JOBS = [
  { id: "RJ-001", appliance_name: "แอร์ Mitsubishi",     status: "awaiting_decision" as const, weeet_name: "นายวิทยา ซ่อมเก่ง" },
  { id: "RJ-002", appliance_name: "ตู้เย็น Samsung",      status: "in_progress"        as const, weeet_name: "นายสมชาย ช่างดี"   },
];

const ACTIVE_MAINTAIN_JOBS = [
  { id: "MJ-001", serviceCode: "M-2026-001", applianceType: "AC" as const,            status: "in_progress" as const, technicianId: "R001-T01" },
  { id: "MJ-002", serviceCode: "M-2026-002", applianceType: "WashingMachine" as const, status: "assigned"    as const, technicianId: undefined    },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* §5 Origin: R-01 = entry screen, no origin banner */}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{SHOP.name}</h1>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">เปิดใช้งาน</span>
        </div>
        <MockAnnoNav to="R-49">
          <Link href="/manage-technicians" className="flex items-center gap-1.5 bg-[#FF663A] hover:bg-[#F04E20] text-white text-sm px-4 py-2 rounded-xl transition-colors">
            👷 จัดการ WeeeT
          </Link>
        </MockAnnoNav>
      </div>

      {/* R6 · G6 role banner — WeeeR ก็ขายมือสองได้ + เข้าโมดูลขายต่อ (C11) */}
      <div className="bg-gradient-to-r from-[#FFF1ED] to-[#FFE0D6] border border-[#FFD0BF] rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#D63B12]">🏪 WeeeR ก็ขายมือสองได้!</p>
          <p className="text-xs text-gray-600 mt-1">
            ร้าน/บริษัทของคุณลงประกาศขายเครื่องใช้ไฟฟ้ามือสอง อะไหล่ และซากได้โดยตรง
          </p>
        </div>
        <MockAnnoNav to="R-67b">
          <Link
            href="/resell/listings/new"
            className="shrink-0 bg-[#FF663A] hover:bg-[#F04E20] text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-colors"
          >
            ลงประกาศขาย
          </Link>
        </MockAnnoNav>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {STATS.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-xl font-bold ${s.text}`}>{s.value} <span className="text-sm font-normal">{s.suffix}</span></div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Gold warning for WeeeT hire */}
      {SHOP.gold < 200 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
          <span>⚠️</span> พอยต์ทอง (Gold) เหลือน้อย — ต้องมีอย่างน้อย 100 พอยต์ทอง เพื่อจ้าง WeeeT เพิ่ม
        </div>
      )}

      {/* Quick nav */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: "/jobs/queue",     icon: "📋", label: "คิวงาน" },
          { href: "/jobs/listings",  icon: "📢", label: "ประกาศ" },
          { href: "/wallet",         icon: "💰", label: "กระเป๋า" },
        ].map((n) => (
          <Link key={n.href} href={n.href} className="bg-white border border-gray-100 rounded-2xl p-4 text-center hover:border-[#FFD0BF] hover:bg-[#FFF1ED] transition-colors shadow-sm">
            <div className="text-2xl mb-1">{n.icon}</div>
            <div className="text-xs font-medium text-gray-600">{n.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent Jobs — Wave1 placeholder (Wave2 จะดึงจาก api-client จริง) */}
      <JobListPlaceholder />

      {/* Active Jobs Progress (D79 C-5) */}
      <MultiJobDashboard
        repairJobs={ACTIVE_REPAIR_JOBS}
        maintainJobs={ACTIVE_MAINTAIN_JOBS}
      />

      {/* WeeeT summary */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">WeeeT ของฉัน</h2>
          <Link href="/manage-technicians" className="text-sm text-[#D63B12] hover:underline">จัดการ →</Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {WEEET_LIST.slice(0, 4).map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center gap-2">
              <span className="text-xl">👷</span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-gray-800 truncate">{t.name}</div>
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.type === "default" ? "bg-green-100 text-green-700" : "bg-[#FFE0D6] text-[#D63B12]"}`}>
                    {t.type === "default" ? "ตัวเอง" : "เช่า"}
                  </span>
                  {t.status === "suspended" && <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">ระงับ</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings shortcut */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {[
          { href: "/profile",       icon: "🏪", label: "ข้อมูลร้าน",              to: "R-37" },
          { href: "/wallet",        icon: "💳", label: "บัญชีธนาคาร & กระเป๋า",   to: "R-36" },
          { href: "/notifications", icon: "🔔", label: "แจ้งเตือน",               to: "R-50" },
        ].map((item) => (
          <MockAnnoNav key={item.href} to={item.to}>
            <Link href={item.href} className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFF1ED] transition-colors">
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm text-gray-700">{item.label}</span>
              <span className="ml-auto text-gray-300 text-sm">›</span>
            </Link>
          </MockAnnoNav>
        ))}
      </div>

      {/* §8 Cross-app panel */}
      <MockAnnoXApp
        entries={[
          { app: "WeeeU",  screen: "U-01 แดชบอร์ดผู้ใช้",      url: "http://localhost:3002/dashboard" },
          { app: "WeeeT",  screen: "T-01 แดชบอร์ดช่าง",         url: "http://localhost:3003/dashboard" },
          { app: "Admin",  screen: "A-01 Admin Dashboard",       url: "http://localhost:3000/dashboard" },
        ]}
      />
    </div>
  );
}
