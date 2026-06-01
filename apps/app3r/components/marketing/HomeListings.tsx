// ============================================================
// components/marketing/HomeListings.tsx
// W-2-A: Parent component — orchestrates 4 groups (D1)
// ลำดับ: Resell (มีรูป) → Scrap (มีรูป) → Repair (ไม่มีรูป) → Maintain (ไม่มีรูป)
// Each group: group by appliance type · 4 cards/row · sorted newest first
// ============================================================
import { Suspense } from "react";
import HomeActionCTA from "./HomeActionCTA";
import ResellGroup from "./groups/ResellGroup";
import ScrapGroup from "./groups/ScrapGroup";
import RepairRequestGroup from "./groups/RepairRequestGroup";
import MaintainRequestGroup from "./groups/MaintainRequestGroup";
import GroupSkeleton from "./groups/GroupSkeleton";

export default function HomeListings() {
  return (
    <div className="bg-gray-50">
      {/* W-2-B D2: 2 CTA buttons (sell split WeeeU/WeeeR · repair-request) */}
      <HomeActionCTA />
      {/* W-01: แต่ละ section มี loading skeleton (Suspense) ขณะ resolve ฝั่ง server */}
      <Suspense fallback={<GroupSkeleton />}>
        <ResellGroup />
      </Suspense>
      <Suspense fallback={<GroupSkeleton />}>
        <ScrapGroup />
      </Suspense>
      <Suspense fallback={<GroupSkeleton />}>
        <RepairRequestGroup />
      </Suspense>
      <Suspense fallback={<GroupSkeleton />}>
        <MaintainRequestGroup />
      </Suspense>
    </div>
  );
}
