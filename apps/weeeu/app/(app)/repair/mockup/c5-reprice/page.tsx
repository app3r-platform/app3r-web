import Link from "next/link";
import { FlowCard } from "../_lib/flow-card";

// ── C5 Re-price Accept (B1 accept) ───────────────────────────────────────────
// WeeeR ตรวจพบต้องอะไหล่เพิ่ม → B1.2 เสนอราคาใหม่
// WeeeU ตกลง → ซ่อมต่อ → U-08 fee-settle → U-09 review
// ─────────────────────────────────────────────────────────────────────────────

const JOB = "job-c5-001";

export default function C5RepricePage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="mock-anno mock-anno-origin">
        ◀ มาจาก: <code>repair/mockup</code> (Case Index)
      </div>
      <Link href="/repair/mockup" className="text-gray-500 text-sm flex items-center gap-1 hover:text-gray-800">
        ‹ กลับ Case Index
      </Link>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="bg-yellow-100 text-yellow-800 font-bold px-3 py-1 rounded-full text-sm font-mono">C5</span>
          <h1 className="text-xl font-bold text-gray-900">Re-price Accept (B1 accept)</h1>
        </div>
        <p className="text-xs text-gray-500">WeeeR พบอะไหล่เพิ่ม → B1.2 เสนอราคาใหม่ → WeeeU ตกลง → ซ่อมต่อ → fee-settle → closed</p>
      </div>

      {/* B1 Decision highlight */}
      <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
        <p className="text-sm font-bold text-yellow-800 mb-1">⚠️ B1 Branch — Re-pricing</p>
        <p className="text-xs text-yellow-700">
          WeeeR ส่ง B1.2 offer → state: <code className="font-mono">awaiting_user</code> + <code className="font-mono">decision_branch=B1.2</code><br/>
          WeeeU ตัดสินใจที่ <strong>U-52a</strong> → ✅ ตกลง → in_progress → ซ่อมต่อ<br/>
          เมื่อซ่อมเสร็จ WeeeU ชำระส่วนต่างที่ <strong>U-08</strong> (fee-settle) → review → closed
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">📋 Sample Data</p>
        <p><span className="text-gray-400 w-36 inline-block">เครื่อง</span>เครื่องซักผ้า LG WD-1480</p>
        <p><span className="text-gray-400 w-36 inline-block">ราคาเดิม</span>800 พอยต์ทอง</p>
        <p><span className="text-gray-400 w-36 inline-block">ราคาใหม่ (B1.2)</span>1,350 พอยต์ทอง</p>
        <p><span className="text-gray-400 w-36 inline-block">อะไหล่เพิ่ม</span>มอเตอร์ปั่นแห้ง LG WD-14 (450) + สายพาน (100)</p>
        <p><span className="text-gray-400 w-36 inline-block">ส่วนต่าง</span>+550 พอยต์ทอง</p>
        <p><span className="text-gray-400 w-36 inline-block">รอบต่อรอง</span>รอบที่ 1/2</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">🎯 Lens Tier-1</p>
        <ul className="text-xs text-amber-700 space-y-1">
          <li>• <strong>B1</strong> U-52a: แสดงราคาเดิม vs ราคาใหม่ + รายการอะไหล่ที่เพิ่ม</li>
          <li>• <strong>B3</strong> ราคาใหม่ ๑,๓๕๐ ตัวเลขไทย</li>
          <li>• <strong>A1</strong> ตกลง → in_progress (success notification)</li>
          <li>• <strong>A8</strong> U-08 fee-settle → success ก่อน U-09 review</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Flow (9 ขั้นตอน)</h2>

        <FlowCard step={1} actorLabel="WeeeU→WeeeR" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-03→R-03→U-05" screenName="CREATE → BID → OFFERS" route="/repair/new" port={3002}
          action="แจ้งซ่อม ONSITE → WeeeR ยื่น offer 800 พอยต์ทอง → WeeeU เลือก → assigned"
          stateAfter="assigned"
          xapp={[{ actor:"WeeeR", id:"R-09", name:"REPAIR-JOBS", route:"/repair/jobs", port:3001 }]}
        />

        <FlowCard step={2} actorLabel="WeeeT (ช่าง)" actorCls="bg-green-100 text-green-800"
          screenId="T-02" screenName="DIAGNOSE" route="/jobs/[id]/diagnose" port={3003}
          action="WeeeT ถึงบ้าน → ตรวจวินิจฉัย: พบมอเตอร์ปั่นแห้ง + สายพานเสีย ต้องเพิ่มอะไหล่ → รายงาน WeeeR"
          stateAfter="awaiting_decision"
          xapp={[
            { actor:"WeeeR", id:"R-11", name:"REPAIR-JOB-DETAIL (awaiting_decision)", route:"/repair/jobs/[id]", port:3001 },
            { actor:"WeeeU", id:"U-04", name:"REPAIR-DETAIL (inspecting)", route:`/repair/${JOB}`, port:3002 },
          ]}
        />

        <FlowCard step={3} actorLabel="WeeeR (ร้านซ่อม)" actorCls="bg-orange-100 text-orange-800"
          screenId="R-11" screenName="REPAIR-JOB-DETAIL (propose B1.2)" route="/repair/jobs/[id]" port={3001}
          action="WeeeR เสนอราคาใหม่ B1.2: 1,350 พอยต์ทอง + รายการอะไหล่ที่ต้องเพิ่ม"
          stateAfter="awaiting_user (decision_branch=B1.2)"
          xapp={[{ actor:"WeeeU", id:"U-52a", name:"REPAIR-B1-DECISION (notification)", route:`/repair/${JOB}/decision/b1-2`, port:3002 }]}
          tier1={["B1: B1.2 proposal ต้องมี: ราคาเดิม / ราคาใหม่ / รายการอะไหล่"]}
        />

        <FlowCard step={4} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-52a" screenName="REPAIR-B1-DECISION" route={`/repair/${JOB}/decision/b1-2`} port={3002}
          action="ดูข้อเสนอ B1.2: ราคาเดิม 800 → ราคาใหม่ 1,350 (+550) + รายการอะไหล่ → ✅ อนุมัติราคาใหม่"
          stateAfter="in_progress (re-approved)"
          navTo="U-04 REPAIR-DETAIL"
          tier1={["B1: decision แสดง price comparison + parts list + หากปฏิเสธ = deposit policy", "B3: ราคาใหม่ ๑,๓๕๐ ตัวเลขไทย"]}
        />

        <FlowCard step={5} actorLabel="WeeeT (ช่าง)" actorCls="bg-green-100 text-green-800"
          screenId="T-03" screenName="REPAIR IN-PROGRESS" route="/jobs/[id]" port={3003}
          action="WeeeT สั่งอะไหล่ + ติดตั้งมอเตอร์ + สายพาน → T-15 ซ่อมเสร็จ → T-38 post-repair"
          stateAfter="completed → awaiting_review"
          xapp={[
            { actor:"WeeeU", id:"U-06", name:"REPAIR-PROGRESS (60→100%)", route:`/repair/${JOB}/progress`, port:3002 },
            { actor:"WeeeR", id:"R-11", name:"REPAIR-JOB-DETAIL", route:"/repair/jobs/[id]", port:3001 },
          ]}
        />

        <FlowCard step={6} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-09d" screenName="REPAIR-DELIVERY (ยืนยันส่งมอบงาน)" route={`/repair/${JOB}/delivery-receipt`} port={3002}
          action="ช่างส่งมอบงาน → WeeeU confirm delivery [state: awaiting_review]"
          stateAfter="awaiting_review"
          navTo="U-08 REPAIR-C5-FEE (ชำระส่วนต่าง)"
        />

        <FlowCard step={7} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-08" screenName="REPAIR-C5-FEE (fee-settle)" route={`/repair/${JOB}/fee-settle`} port={3002}
          action="ชำระส่วนต่างค่าอะไหล่ 550 พอยต์ทอง (จากบัญชี Gold) → confirm"
          stateAfter="fee_settled"
          navTo="U-09 REPAIR-REVIEW"
          tier1={["A8: fee-settle confirm → success before review", "B3: ส่วนต่าง ๕๕๐ ตัวเลขไทย"]}
        />

        <FlowCard step={8} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-09" screenName="REPAIR-REVIEW" route={`/repair/${JOB}/review`} port={3002}
          action="ตรวจรับงาน + ⭐⭐⭐⭐⭐ → submit → closed ✅"
          stateAfter="closed ✅"
          xapp={[{ actor:"WeeeR", id:"R-11", name:"REPAIR-JOB-DETAIL (closed)", route:"/repair/jobs/[id]", port:3001 }]}
          tier1={["A1: review → closed"]}
        />

        <FlowCard step={9} actorLabel="System" actorCls="bg-gray-100 text-gray-700"
          screenId="—" screenName="Settlement" route="/repair" port={3002}
          action="System: Escrow ปลดล็อก → โอน 1,350 พอยต์ทอง ให้ WeeeR · Gold balance WeeeU หัก 1,350"
          stateAfter="closed ✅ (settled)"
          tier1={["B3: settlement แสดงตัวเลขไทย"]}
        />
      </div>

      <div className="flex gap-3">
        <Link href="/repair/mockup/c4-scrap" className="text-sm text-gray-500 hover:text-gray-800 underline">← C4 Scrap</Link>
        <Link href="/repair/mockup/c6-onsite" className="text-sm text-weeeu-primary hover:text-weeeu-dark underline">C6 ONSITE →</Link>
      </div>
    </div>
  );
}
