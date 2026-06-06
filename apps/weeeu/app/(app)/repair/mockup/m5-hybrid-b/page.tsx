import Link from "next/link";
import { FlowCard } from "../_lib/flow-card";

// ── M5 Hybrid B — In-place Repair (same machine being maintained) ─────────────
// เครื่องที่กำลังอยู่ใน Maintain job → WeeeT พบปัญหาเพิ่ม
// → WeeeR เสนอ in-place repair proposal → ต่อ escrow เดิม
// HUB Gen 52 Specs: M5 Hybrid B = same machine → in-place repair proposal
// ─────────────────────────────────────────────────────────────────────────────

const MAINTAIN_JOB = "maintain-m5-001";
const REPAIR_JOB   = "job-m5b-001";

export default function M5HybridBPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="mock-anno mock-anno-origin">
        ◀ มาจาก: <code>repair/mockup</code> (Case Index)
      </div>
      <Link href="/repair/mockup" className="text-gray-500 text-sm flex items-center gap-1 hover:text-gray-800">‹ กลับ Case Index</Link>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded-full text-sm font-mono">M5B</span>
          <h1 className="text-xl font-bold text-gray-900">M5 Hybrid B — In-place Repair</h1>
        </div>
        <p className="text-xs text-gray-500">
          เครื่องเดียวกันที่กำลังบำรุงรักษา → WeeeT พบปัญหาเพิ่มเติม → WeeeR เสนอซ่อม in-place ต่อ escrow เดิม
        </p>
      </div>

      {/* M5B Highlight */}
      <div className="bg-indigo-50 border border-indigo-300 rounded-xl p-4">
        <p className="text-sm font-bold text-indigo-800 mb-2">🔀 M5 Hybrid B — สิ่งที่ต่างจาก C6 (ONSITE)</p>
        <ul className="text-xs text-indigo-700 space-y-1.5">
          <li>• <strong>Trigger:</strong> ไม่ใช่ WeeeU สร้าง Repair job — แต่ WeeeT พบปัญหาระหว่าง Maintain job</li>
          <li>• <strong>Machine:</strong> เครื่องเดียวกับที่กำลังบำรุงอยู่ (same appliance ID)</li>
          <li>• <strong>Escrow:</strong> ต่อ escrow เดิมของ Maintain job (in-place extend)</li>
          <li>• <strong>WeeeU action:</strong> รับข้อเสนอซ่อม in-place ที่ U-04/U-05 (ไม่ต้องสร้าง Repair ใหม่)</li>
          <li>• <strong>Result:</strong> Maintain + Repair = one settlement เมื่อจบงาน</li>
        </ul>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">📋 Sample Data</p>
        <p><span className="text-gray-400 w-40 inline-block">Maintain Job</span>{MAINTAIN_JOB}</p>
        <p><span className="text-gray-400 w-40 inline-block">เครื่อง</span>เครื่องปรับอากาศ Mitsubishi Heavy SRK24YL</p>
        <p><span className="text-gray-400 w-40 inline-block">งาน Maintain</span>ล้างแอร์ + เติมน้ำยา — 500 พอยต์ทอง</p>
        <p><span className="text-gray-400 w-40 inline-block">ปัญหาที่ WeeeT พบ</span>PCB controller เสื่อม — ต้องเปลี่ยน</p>
        <p><span className="text-gray-400 w-40 inline-block">In-place Repair Job</span>{REPAIR_JOB}</p>
        <p><span className="text-gray-400 w-40 inline-block">ราคาซ่อม (M5B)</span>1,200 พอยต์ทอง</p>
        <p><span className="text-gray-400 w-40 inline-block">Escrow รวม</span>500 (Maintain) + 1,200 (Repair) = 1,700 พอยต์ทอง</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">🎯 Lens Tier-1</p>
        <ul className="text-xs text-amber-700 space-y-1">
          <li>• <strong>B3</strong> Escrow รวม ๑,๗๐๐ ตัวเลขไทย (Maintain + Repair)</li>
          <li>• <strong>A5</strong> Gold Lock extend — WeeeU ต้อง acknowledge ยอดรวมใหม่</li>
          <li>• <strong>A8</strong> In-place repair accepted = success notification</li>
          <li>• <strong>A7</strong> Sample data แสดง 2 jobs บน machine เดียวกัน</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Flow (7 ขั้นตอน)</h2>

        <FlowCard step={1} actorLabel="WeeeU→WeeeR" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="M-01→M-jobs" screenName="MAINTAIN job: created + assigned" route="/maintain/new" port={3002}
          action="WeeeU สร้าง Maintain job (ล้างแอร์ + เติมน้ำยา) → WeeeR accept → WeeeT ออกเดินทาง"
          stateAfter="maintain: in_progress"
          xapp={[
            { actor:"WeeeT", id:"T-03", name:"MAINTAIN job in-progress", route:"/jobs", port:3003 },
            { actor:"WeeeR", id:"R-11", name:"MAINTAIN-JOB-DETAIL", route:"/repair/jobs/[id]", port:3001 },
          ]}
        />

        <FlowCard step={2} actorLabel="WeeeT (ช่าง)" actorCls="bg-green-100 text-green-800"
          screenId="T-38" screenName="POST-REPAIR / POST-MAINTAIN" route="/jobs/[id]/post-repair" port={3003}
          action="ขณะทำงาน WeeeT พบว่า PCB controller เสื่อม — ล้างแอร์เสร็จแต่ต้องซ่อม PCB เพิ่ม → report ให้ WeeeR"
          stateAfter="maintain: awaiting_decision (additional issue found)"
          xapp={[
            { actor:"WeeeR", id:"R-11", name:"MAINTAIN-JOB-DETAIL (additional issue)", route:"/repair/jobs/[id]", port:3001 },
          ]}
          tier1={["A7: WeeeT report interface แสดง issue type + รูปประกอบ"]}
        />

        <FlowCard step={3} actorLabel="WeeeR (ร้านซ่อม)" actorCls="bg-orange-100 text-orange-800"
          screenId="R-11" screenName="MAINTAIN-JOB-DETAIL (create in-place repair)" route="/repair/jobs/[id]" port={3001}
          action="WeeeR สร้าง In-place Repair proposal สำหรับ PCB controller: 1,200 พอยต์ทอง → ส่งให้ WeeeU"
          stateAfter="maintain: in_progress + repair: awaiting_user"
          xapp={[
            { actor:"WeeeU", id:"U-04", name:"REPAIR-DETAIL (M5B proposal notification)", route:`/repair/${REPAIR_JOB}`, port:3002 },
          ]}
        />

        <FlowCard step={4} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-04" screenName="REPAIR-DETAIL (M5B in-place offer)" route={`/repair/${REPAIR_JOB}`} port={3002}
          action="WeeeU เห็น notification 'ช่างพบปัญหาเพิ่มเติม' → เข้าดู U-04 ที่แสดง in-place repair proposal"
          stateAfter="awaiting_user (M5B offer)"
          navTo="U-05 REPAIR-OFFERS (M5B offer)"
          tier1={["A7: U-04 แสดง: เครื่องเดียวกัน Maintain+Repair linked"]}
        />

        <FlowCard step={5} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-05" screenName="REPAIR-OFFERS (M5B — in-place)" route={`/repair/${REPAIR_JOB}/offers`} port={3002}
          action="WeeeU ดู in-place repair offer: 1,200 + acknowledge Gold Lock extend → Escrow รวม 1,700 → confirm"
          stateAfter="repair: in_progress (escrow extended)"
          navTo="U-04 REPAIR-DETAIL"
          xapp={[
            { actor:"WeeeR", id:"R-11", name:"REPAIR-JOB-DETAIL (M5B in_progress)", route:"/repair/jobs/[id]", port:3001 },
            { actor:"WeeeT", id:"T-02", name:"DIAGNOSE (M5B repair)", route:"/jobs/[id]/diagnose", port:3003 },
          ]}
          tier1={["B3: Escrow total ๑,๗๐๐ ตัวเลขไทย", "A5: acknowledge Escrow extend ก่อน confirm"]}
        />

        <FlowCard step={6} actorLabel="WeeeT (ช่าง)" actorCls="bg-green-100 text-green-800"
          screenId="T-02→T-03→T-15" screenName="DIAGNOSE → REPAIR PCB → SUCCESS" route="/jobs/[id]/diagnose" port={3003}
          action="WeeeT ซ่อม PCB controller in-place → T-03 repair → T-15 success → T-38 post-repair"
          stateAfter="repair: completed"
          xapp={[
            { actor:"WeeeU", id:"U-06", name:"REPAIR-PROGRESS (0→100%)", route:`/repair/${REPAIR_JOB}/progress`, port:3002 },
            { actor:"WeeeR", id:"R-11", name:"REPAIR-JOB-DETAIL (in-progress)", route:"/repair/jobs/[id]", port:3001 },
          ]}
        />

        <FlowCard step={7} actorLabel="WeeeU → System" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-09d→U-09→Settlement" screenName="DELIVERY → REVIEW → COMBINED SETTLEMENT" route={`/repair/${REPAIR_JOB}/delivery-receipt`} port={3002}
          action="WeeeU confirm delivery (U-09d) → U-09 review → closed · System: Escrow ปลดล็อก 1,700 → WeeeR: 500+1,200 = 1,700 พอยต์ทอง"
          stateAfter="closed ✅ (Maintain + Repair combined settlement)"
          xapp={[
            { actor:"WeeeR", id:"R-11", name:"REPAIR-JOB-DETAIL (M5B closed)", route:"/repair/jobs/[id]", port:3001 },
          ]}
          tier1={["B3: settlement รวม ๑,๗๐๐ ตัวเลขไทย", "A8: combined settlement = success confirmation"]}
        />
      </div>

      {/* M5B vs M5A comparison */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">📌 M5B vs M5A (Hybrid A)</p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-semibold text-indigo-700 mb-1">M5B (this case)</p>
            <p className="text-gray-600">เครื่องเดียวกัน → in-place → escrow extend → one settlement</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500 mb-1">M5A (Hybrid A)</p>
            <p className="text-gray-500">เครื่องต่างกัน → สร้าง Repair job ใหม่แยก → separate escrow/settlement</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/repair/mockup/c10-b1reject" className="text-sm text-gray-500 hover:text-gray-800 underline">← C10 B1 Reject</Link>
        <Link href="/repair/mockup" className="text-sm text-weeeu-primary hover:text-weeeu-dark underline">↑ Case Index</Link>
      </div>
    </div>
  );
}
