// ============================================================
// components/marketing/groups/MaintainRequestGroup.tsx
// W-2-A: กลุ่ม 4 — แจ้งความต้องการบำรุงรักษา (Maintain)
// ❌ ไม่มีรูป · group by applianceType · 4 ต่อแถว · 2 แถวต่อประเภท · เรียงล่าสุดก่อน
// ============================================================
import Link from "next/link";
import { cookies } from "next/headers";
import { maintainJobs } from "@/lib/mock/maintain-jobs";
import CategoryFilterRows, { type RenderedItem } from "./CategoryFilterRows";
import RoleAwareCard from "@/components/listings/RoleAwareCard";
import EmptyGroupState from "./EmptyGroupState";
import { getMockRoleFromCookie, MOCK_USERS } from "@/lib/auth/mock-role";
import type { AuthenticatedJobProjection } from "@/lib/types/listings-customer-jobs";

function groupByApplianceType(
  items: AuthenticatedJobProjection[]
): Record<string, AuthenticatedJobProjection[]> {
  const sorted = [...items].sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  return sorted.reduce<Record<string, AuthenticatedJobProjection[]>>((acc, job) => {
    const key = job.applianceType || "อื่นๆ";
    if (!acc[key]) acc[key] = [];
    acc[key].push(job);
    return acc;
  }, {});
}

function JobCardNoImage({ job }: { job: AuthenticatedJobProjection }) {
  return (
    <Link
      href={`/listings/maintain/${job.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-website-brand-300 transition group h-full"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
          บำรุงรักษา
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

export default async function MaintainRequestGroup() {
  const cookieStore = await cookies();
  const role = getMockRoleFromCookie(cookieStore.get("app3r-mock-role")?.value);

  let active = maintainJobs.filter((j) => j.status === "ANNOUNCED");

  // D1 role-based filter: WeeeU เห็นเฉพาะของตัวเอง
  if (role === "weeeu") {
    const myId = MOCK_USERS.weeeu.id;
    active = active.filter((j) => j.ownerId === myId);
  }

  const grouped = groupByApplianceType(active);
  const types = Object.keys(grouped);

  // Pre-render nodes (server-side) สำหรับ client dropdown
  const renderedGrouped: Record<string, RenderedItem[]> = {};
  for (const type of types) {
    renderedGrouped[type] = grouped[type].map((job) => ({
      id: job.id,
      node: (
        <RoleAwareCard href={`/listings/maintain/${job.id}`}>
          <JobCardNoImage job={job} />
        </RoleAwareCard>
      ),
    }));
  }

  if (types.length === 0) {
    return (
      <EmptyGroupState
        icon="🛡️"
        title="แจ้งความต้องการบำรุงรักษา"
        browseHref="/listings/maintain"
        isOwner={role === "weeeu"}
        ownerMessage="คุณยังไม่มีงานบำรุงรักษาที่แจ้ง"
        guestMessage="ยังไม่มีงานบำรุงรักษาที่ประกาศในตอนนี้"
        postLabel="แจ้งงานบำรุงรักษา"
      />
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 border-b border-gray-100">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🛡️</span>
            <h2 className="text-2xl font-bold text-gray-900">แจ้งความต้องการบำรุงรักษา</h2>
          </div>
          <p className="text-gray-500 text-sm">งานบำรุงรักษาเชิงป้องกัน · จัดกลุ่มตามประเภทเครื่อง</p>
        </div>
        <Link
          href="/listings/maintain"
          className="text-sm text-website-brand-600 hover:text-website-brand-700 font-medium hidden sm:inline-flex items-center gap-1"
        >
          ดูทั้งหมด →
        </Link>
      </div>

      <CategoryFilterRows
        grouped={renderedGrouped}
        rowsPerType={2}
        filterLabel="ประเภทเครื่อง"
      />
    </section>
  );
}
