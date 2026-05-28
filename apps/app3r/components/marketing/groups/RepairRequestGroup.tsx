// ============================================================
// components/marketing/groups/RepairRequestGroup.tsx
// W-2-A: กลุ่ม 3 — แจ้งความต้องการซ่อม (Repair)
// ❌ ไม่มีรูป · group by applianceType · 4 ต่อแถว · 2 แถวต่อประเภท · เรียงล่าสุดก่อน
// ============================================================
import Link from "next/link";
import { cookies } from "next/headers";
import { repairJobs } from "@/lib/mock/repair-jobs";
import ApplianceTypeRow from "./ApplianceTypeRow";
import RoleAwareCard from "@/components/listings/RoleAwareCard";
import { getMockRoleFromCookie, MOCK_USERS } from "@/lib/auth/mock-role";
import type { AuthenticatedJobProjection } from "@/lib/types/listings-customer-jobs";

function groupByApplianceType(
  items: AuthenticatedJobProjection[]
): Record<string, AuthenticatedJobProjection[]> {
  // เรียง postedAt descending (newer first)
  const sorted = [...items].sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  return sorted.reduce<Record<string, AuthenticatedJobProjection[]>>((acc, job) => {
    const key = job.applianceType || "อื่นๆ";
    if (!acc[key]) acc[key] = [];
    acc[key].push(job);
    return acc;
  }, {});
}

/**
 * Job card without image — ใช้สำหรับ Repair/Maintain
 * แสดง: badge · title · area · postedAt · งบประมาณ
 */
function JobCardNoImage({ job, kind }: { job: AuthenticatedJobProjection; kind: "repair" | "maintain" }) {
  const badgeColor = kind === "repair" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700";
  const badgeLabel = kind === "repair" ? "ซ่อม" : "บำรุงรักษา";

  return (
    <Link
      href={`/listings/${kind}/${job.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-website-brand-300 transition group h-full"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
          {badgeLabel}
        </span>
        <span className="text-[10px] text-gray-400">{job.postedAt}</span>
      </div>
      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-website-brand-600 transition mb-2 min-h-[2.5rem]">
        {job.title}
      </h3>
      <div className="text-xs text-gray-500 flex items-center gap-1 mb-2">
        <span>📍</span>
        <span className="truncate">{job.area}</span>
      </div>
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">งบประมาณ</span>
        <span className="text-sm font-bold text-website-brand-700">
          {job.estimatedBudget.toLocaleString()} ฿
        </span>
      </div>
    </Link>
  );
}

export default async function RepairRequestGroup() {
  const cookieStore = await cookies();
  const role = getMockRoleFromCookie(cookieStore.get("mock_role")?.value);

  // กรอง ANNOUNCED status เท่านั้น (active)
  let active = repairJobs.filter((j) => j.status === "ANNOUNCED");

  // D1 role-based filter: WeeeU เห็นเฉพาะของตัวเอง
  if (role === "weeeu") {
    const myId = MOCK_USERS.weeeu.id;
    active = active.filter((j) => j.ownerId === myId);
  }

  const grouped = groupByApplianceType(active);
  const types = Object.keys(grouped);

  if (types.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-10 border-b border-gray-100">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">
            {role === "weeeu" ? "📭 คุณยังไม่มีงานซ่อมที่แจ้ง" : "📭 ยังไม่มีงานซ่อม"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 border-b border-gray-100">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🔧</span>
            <h2 className="text-2xl font-bold text-gray-900">แจ้งความต้องการซ่อม</h2>
          </div>
          <p className="text-gray-500 text-sm">งานซ่อมจากลูกค้าทั่วประเทศ · จัดกลุ่มตามประเภทเครื่อง</p>
        </div>
        <Link
          href="/listings/repair"
          className="text-sm text-website-brand-600 hover:text-website-brand-700 font-medium hidden sm:inline-flex items-center gap-1"
        >
          ดูทั้งหมด →
        </Link>
      </div>

      {types.map((type) => (
        <ApplianceTypeRow
          key={type}
          applianceType={type}
          items={grouped[type]}
          rowsPerType={2}
          renderItem={(job) => (
            <RoleAwareCard href={`/listings/repair/${job.id}`}>
              <JobCardNoImage job={job} kind="repair" />
            </RoleAwareCard>
          )}
        />
      ))}
    </section>
  );
}
