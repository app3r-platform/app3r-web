// ============================================================
// components/marketing/HomeListings.tsx
// W-2-A: Parent component — orchestrates 4 groups (D1)
// ลำดับ: Resell (มีรูป) → Scrap (มีรูป) → Repair (ไม่มีรูป) → Maintain (ไม่มีรูป)
// Each group: group by appliance type · 4 cards/row · sorted newest first
// ============================================================
import HomeActionCTA from "./HomeActionCTA";
import ResellGroup from "./groups/ResellGroup";
import ScrapGroup from "./groups/ScrapGroup";
import RepairRequestGroup from "./groups/RepairRequestGroup";
import MaintainRequestGroup from "./groups/MaintainRequestGroup";

export default function HomeListings() {
  return (
    <div className="bg-gray-50">
      {/* W-2-B D2: 2 CTA buttons (sell / repair-request) */}
      <HomeActionCTA />
      <ResellGroup />
      <ScrapGroup />
      <RepairRequestGroup />
      <MaintainRequestGroup />
    </div>
  );
}
