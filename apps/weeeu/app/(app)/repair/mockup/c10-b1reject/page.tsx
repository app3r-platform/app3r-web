import Link from "next/link";
import { FlowCard } from "../_lib/flow-card";

// ── C10 B1 Reject → Cancel ────────────────────────────────────────────────────
// WeeeR เสนอราคาใหม่ B1.2 → ลูกค้าปฏิเสธ → งานยกเลิก ค่าตรวจถูกหัก
// ─────────────────────────────────────────────────────────────────────────────

const JOB = "job-c10-001";

export default function C10B1RejectPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="mock-anno mock-anno-origin">
        ◀ มาจาก: <code>repair/mockup</code> (Case Index)
      </div>
      <Link href="/repair/mockup" className="text-gray-500 text-sm flex items-center gap-1 hover:text-gray-800">‹ กลับ Case Index</Link>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="bg-rose-100 text-rose-800 font-bold px-3 py-1 rounded-full text-sm font-mono">C10</span>
          <h1 className="text-xl font-bold text-gray-900">B1 Reject → Cancel</h1>
        </div>
        <p className="text-xs text-gray-500">B1.2 เสนอ → WeeeU ปฏิเสธ → cancelled · ค่าตรวจ + ค่าเดินทางถูกหัก (ตาม deposit policy)</p>
      </div>

      <div className="bg-rose-50 border border-rose-300 rounded-xl p-4">
        <p className="text-sm font-bold text-rose-800 mb-1">❌ B1 Reject Branch</p>
        <p className="text-xs text-rose-700">
          WeeeR ส่ง B1.2 → WeeeU เลือก 'ปฏิเสธ — ยกเลิกงาน' ที่ U-52a<br/>
          ค่าที่หัก = ค่าตรวจ (inspection_fee) + ค่าเดินทาง (travel_fee ถ้ามี)<br/>
          Gold คืน = Escrow ที่ lock − ค่าที่หัก<br/>
          State: <code className="font-mono">cancelled</code>
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">📋 Sample Data</p>
        <p><span className="text-gray-400 w-36 inline-block">เครื่อง</span>เครื่องซักผ้า LG WD-1480</p>
        <p><span className="text-gray-400 w-36 inline-block">ราคาเดิม</span>800 พอยต์ทอง</p>
        <p><span className="text-gray-400 w-36 inline-block">B1.2 ราคาใหม่</span>1,350 พอยต์ทอง (+550)</p>
        <p><span className="text-gray-400 w-36 inline-block">WeeeU ตัดสิน</span>❌ ปฏิเสธ (แพงเกินไป)</p>
        <p><span className="text-gray-400 w-36 inline-block">ค่าที่หัก</span>ค่าตรวจ 150 + ค่าเดินทาง 100 = 250 พอยต์ทอง</p>
        <p><span className="text-gray-400 w-36 inline-block">Gold คืน</span>Escrow 1,100 − 250 = 850 พอยต์ทอง</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">🎯 Lens Tier-1</p>
        <ul className="text-xs text-amber-700 space-y-1">
          <li>• <strong>B1</strong> U-52a: แสดง reject penalty อย่างชัดเจนก่อน confirm</li>
          <li>• <strong>B3</strong> ค่าหัก ๒๕๐ · Gold คืน ๘๕๐ ตัวเลขไทย</li>
          <li>• <strong>A1</strong> ยืนยันปฏิเสธ → cancelled state notification</li>
          <li>• <strong>A3</strong> Back button ใน confirm dialog</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Flow (6 ขั้นตอน)</h2>

        <FlowCard step={1} actorLabel="WeeeU→WeeeR→WeeeT" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="C5 steps 1–3" screenName="Create → Bid → Assign → Diagnose" route="/repair/new" port={3002}
          action="C5 ขั้นตอน 1–3: แจ้งซ่อม → WeeeR bid → assign → WeeeT วินิจฉัย → พบต้องอะไหล่เพิ่ม"
          stateAfter="awaiting_decision"
        />

        <FlowCard step={2} actorLabel="WeeeR (ร้านซ่อม)" actorCls="bg-orange-100 text-orange-800"
          screenId="R-11" screenName="REPAIR-JOB-DETAIL (B1.2 proposal)" route="/repair/jobs/[id]" port={3001}
          action="WeeeR เสนอราคาใหม่ B1.2: 1,350 พอยต์ทอง + รายการอะไหล่"
          stateAfter="awaiting_user (decision_branch=B1.2)"
          xapp={[{ actor:"WeeeU", id:"U-52a", name:"REPAIR-B1-DECISION (notification)", route:`/repair/${JOB}/decision/b1-2`, port:3002 }]}
          tier1={["B1: B1.2 proposal ต้องมีรายการอะไหล่ + ราคาเดิม/ใหม่ครบ"]}
        />

        <FlowCard step={3} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-52a" screenName="REPAIR-B1-DECISION" route={`/repair/${JOB}/decision/b1-2`} port={3002}
          action="WeeeU ดูข้อเสนอ B1.2 → คลิก 'ปฏิเสธ — ยกเลิกงาน' → confirm dialog แสดงค่าที่จะถูกหัก: 250 พอยต์ทอง"
          stateAfter="confirm reject dialog"
          tier1={["B1: penalty disclosure ก่อน final confirm", "B3: ค่าที่หัก ๒๕๐ ตัวเลขไทย"]}
        />

        <FlowCard step={4} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-52a" screenName="REPAIR-B1-DECISION (confirm reject)" route={`/repair/${JOB}/decision/b1-2`} port={3002}
          action="WeeeU confirm ปฏิเสธ → [state: cancelled]"
          stateAfter="cancelled"
          navTo="U-04 REPAIR-DETAIL (cancelled)"
          xapp={[
            { actor:"WeeeR", id:"R-11", name:"REPAIR-JOB-DETAIL (cancelled notification)", route:"/repair/jobs/[id]", port:3001 },
            { actor:"WeeeR", id:"R-09", name:"REPAIR-JOBS (entry cancelled)", route:"/repair/jobs", port:3001 },
          ]}
          tier1={["A1: ยืนยัน → cancelled state + notification"]}
        />

        <FlowCard step={5} actorLabel="System" actorCls="bg-gray-100 text-gray-700"
          screenId="—" screenName="Auto: Settlement (partial refund)" route="/repair" port={3002}
          action="System: หักค่าตรวจ 150 + ค่าเดินทาง 100 = 250 จาก Escrow → คืน WeeeU 850 พอยต์ทอง"
          stateAfter="cancelled (partial refund) ✅"
          tier1={["B3: Gold คืน ๘๕๐ ตัวเลขไทย"]}
        />

        <FlowCard step={6} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-04" screenName="REPAIR-DETAIL (cancelled + refund)" route={`/repair/${JOB}`} port={3002}
          action="WeeeU ดูสถานะ: cancelled + รายละเอียดการหัก/คืน — งานปิด"
          stateAfter="cancelled ✅"
          xapp={[{ actor:"WeeeR", id:"R-11", name:"REPAIR-JOB-DETAIL (settled)", route:"/repair/jobs/[id]", port:3001 }]}
        />
      </div>

      <div className="flex gap-3">
        <Link href="/repair/mockup/c9-dispute" className="text-sm text-gray-500 hover:text-gray-800 underline">← C9 Dispute</Link>
        <Link href="/repair/mockup/m5-hybrid-b" className="text-sm text-weeeu-primary hover:text-weeeu-dark underline">M5 Hybrid B →</Link>
      </div>
    </div>
  );
}
