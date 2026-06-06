import Link from "next/link";
import { FlowCard } from "../_lib/flow-card";
import { MockAnnoBar } from "@/components/shared/MockAnnoBar";

// ── C9 Dispute (Admin Intervene) ──────────────────────────────────────────────
// WeeeU ไม่พอใจงาน → เปิด Dispute (U-09b) → Admin ตรวจสอบ (A-04→A-05) → ตัดสิน
// ─────────────────────────────────────────────────────────────────────────────

const JOB = "job-c9-001";

export default function C9DisputePage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="mock-anno mock-anno-origin">
        ◀ มาจาก: <code>repair/mockup</code> (Case Index)
      </div>
      <Link href="/repair/mockup" className="text-gray-500 text-sm flex items-center gap-1 hover:text-gray-800">‹ กลับ Case Index</Link>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-full text-sm font-mono">C9</span>
          <h1 className="text-xl font-bold text-gray-900">Dispute — Admin Intervene</h1>
        </div>
        <p className="text-xs text-gray-500">WeeeU เปิด Dispute → state: DISPUTED → Admin: A-04 → A-05 → A-03c → ตัดสิน</p>
      </div>

      {/* C9 Dispute Flow · conformed to weeeu canonical MockAnnoBar (data-driven) — chrome content below */}
      <MockAnnoBar />
      <div className="mock-anno mock-anno-c9-dispute bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-900">
        <p className="font-bold mb-1">⚖️ Dispute Flow</p>
        <p>
          WeeeU เปิด Dispute ที่ <strong>U-09b</strong> (ไม่พอใจคุณภาพ/ซ่อมไม่สำเร็จ)<br/>
          Admin รับเรื่องที่ <strong>A-04</strong> → สอบสวน <strong>A-05</strong> (disputes/[id])<br/>
          Admin ตัดสิน → <strong>A-03c</strong> (manual-override) → ผล: COMPLETED หรือ REFUND<br/>
          Escrow ถูก freeze ตลอด dispute period
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">📋 Sample Data</p>
        <p><span className="text-gray-400 w-36 inline-block">เครื่อง</span>เครื่องปรับอากาศ Daikin 12000 BTU</p>
        <p><span className="text-gray-400 w-36 inline-block">เหตุผล</span>ซ่อมแล้วยังเสียง ช่างแก้ไม่ถึงต้นเหตุ</p>
        <p><span className="text-gray-400 w-36 inline-block">Escrow frozen</span>2,300 พอยต์ทอง</p>
        <p><span className="text-gray-400 w-36 inline-block">ผล Admin</span>PARTIAL REFUND: คืน 1,000 พอยต์ทอง WeeeU · WeeeR ได้ 1,300</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">🎯 Lens Tier-1</p>
        <ul className="text-xs text-amber-700 space-y-1">
          <li>• <strong>A1</strong> เปิด Dispute → U-09b success (case opened)</li>
          <li>• <strong>A3</strong> Back button ใน U-09b, A-05</li>
          <li>• <strong>B3</strong> Escrow frozen ๒,๓๐๐ ตัวเลขไทย</li>
          <li>• <strong>A9 (Admin)</strong> A-03c manual-override แสดง options ชัด</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Flow (9 ขั้นตอน)</h2>

        <FlowCard step={1} actorLabel="WeeeU→WeeeR→WeeeT" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="C6 steps 1–7" screenName="ONSITE happy path (partial)" route="/repair/new" port={3002}
          action="C6 ขั้นตอน 1–7 เดิม: create → bid → assign → tech arrive → diagnose → repair"
          stateAfter="completed → awaiting_review"
          xapp={[{ actor:"WeeeR", id:"R-11", name:"REPAIR-JOB-DETAIL (awaiting approval)", route:"/repair/jobs/[id]", port:3001 }]}
        />

        <FlowCard step={2} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-09d" screenName="REPAIR-DELIVERY (ยืนยันส่งมอบ)" route={`/repair/${JOB}/delivery-receipt`} port={3002}
          action="ช่างส่งมอบงาน → WeeeU confirm แต่ไม่พอใจคุณภาพ (เสียงยังดัง)"
          stateAfter="awaiting_review"
          navTo="U-04 → เปิด Dispute"
        />

        <FlowCard step={3} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-09b" screenName="REPAIR-DISPUTE" route={`/repair/${JOB}/dispute`} port={3002}
          action="WeeeU กด 'เปิดเรื่องร้องเรียน' → กรอกเหตุผล + แนบรูป/วีดิโอ → submit [state: DISPUTED]"
          stateAfter="DISPUTED"
          navTo="U-04 (dispute status)"
          xapp={[
            { actor:"Admin", id:"A-04", name:"REPAIR-DISPUTES (new case)", route:"/repair/disputes", port:3000 },
            { actor:"WeeeR", id:"R-11", name:"REPAIR-JOB-DETAIL (DISPUTED flag)", route:"/repair/jobs/[id]", port:3001 },
          ]}
          tier1={["A1: submit → success (dispute opened confirmation)", "B3: Escrow freeze amount ๒,๓๐๐ ตัวเลขไทย"]}
        />

        <FlowCard step={4} actorLabel="Admin" actorCls="bg-blue-100 text-blue-800"
          screenId="A-04" screenName="REPAIR-DISPUTES (list)" route="/repair/disputes" port={3000}
          action="Admin เห็น dispute case ใหม่ → เข้าดูรายละเอียด"
          stateAfter="under_review"
          xapp={[
            { actor:"WeeeU", id:"U-04", name:"REPAIR-DETAIL (under review)", route:`/repair/${JOB}`, port:3002 },
            { actor:"WeeeR", id:"R-11", name:"REPAIR-JOB-DETAIL (under review)", route:"/repair/jobs/[id]", port:3001 },
          ]}
        />

        <FlowCard step={5} actorLabel="Admin" actorCls="bg-blue-100 text-blue-800"
          screenId="A-05" screenName="REPAIR-C9-INTERVENE" route={`/disputes/${JOB}`} port={3000}
          action="Admin ดูหลักฐานทั้งสองฝ่าย + ประวัติการสื่อสาร + รูปก่อน/หลัง + สอบสวน"
          stateAfter="under_review"
          xapp={[
            { actor:"WeeeU", id:"U-04", name:"REPAIR-DETAIL (awaiting ruling)", route:`/repair/${JOB}`, port:3002 },
            { actor:"WeeeR", id:"R-11", name:"REPAIR-JOB-DETAIL", route:"/repair/jobs/[id]", port:3001 },
          ]}
          tier1={["A3: Back ใน A-05", "A7: หลักฐาน sample (รูป+ข้อความ)"]}
        />

        <FlowCard step={6} actorLabel="Admin" actorCls="bg-blue-100 text-blue-800"
          screenId="A-03c" screenName="REPAIR-JOB-OVERRIDE (ruling)" route="/repair/jobs/[id]/manual-override" port={3000}
          action="Admin ตัดสิน: PARTIAL REFUND — WeeeU คืน 1,000 พอยต์ทอง · WeeeR ได้ 1,300 พอยต์ทอง → confirm"
          stateAfter="DISPUTED → resolved"
          xapp={[
            { actor:"WeeeU", id:"U-04", name:"REPAIR-DETAIL (ruling notification)", route:`/repair/${JOB}`, port:3002 },
            { actor:"WeeeR", id:"R-11", name:"REPAIR-JOB-DETAIL (ruling)", route:"/repair/jobs/[id]", port:3001 },
          ]}
          tier1={["B3: ยอดคืน ๑,๐๐๐ ตัวเลขไทย"]}
        />

        <FlowCard step={7} actorLabel="System" actorCls="bg-gray-100 text-gray-700"
          screenId="—" screenName="Auto: Dispute Settlement" route="/repair" port={3002}
          action="System: Escrow ปลดล็อก → PARTIAL REFUND: WeeeU +1,000 / WeeeR +1,300 · state: COMPLETED (with dispute flag)"
          stateAfter="COMPLETED ✅ (disputed)"
          tier1={["B3: settlement รายการแต่ละยอด ตัวเลขไทย"]}
        />

        <FlowCard step={8} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-04" screenName="REPAIR-DETAIL (ruling received)" route={`/repair/${JOB}`} port={3002}
          action="WeeeU ดูผลคำตัดสิน + ยอดที่ได้รับคืน — ปิดงาน (ไม่มี review ใน dispute case)"
          stateAfter="closed (dispute resolved)"
        />

        <FlowCard step={9} actorLabel="Admin" actorCls="bg-blue-100 text-blue-800"
          screenId="A-21" screenName="REPAIR-ANALYTICS" route="/repair/analytics" port={3000}
          action="Admin ดู dispute metrics — งาน C9 ถูก record ใน dispute rate dashboard"
          stateAfter="recorded"
          xapp={[{ actor:"Admin", id:"A-04", name:"REPAIR-DISPUTES (case closed)", route:"/repair/disputes", port:3000 }]}
        />
      </div>

      <div className="flex gap-3">
        <Link href="/repair/mockup/c8-abandoned" className="text-sm text-gray-500 hover:text-gray-800 underline">← C8 Abandoned</Link>
        <Link href="/repair/mockup/c10-b1reject" className="text-sm text-weeeu-primary hover:text-weeeu-dark underline">C10 B1 Reject →</Link>
      </div>
    </div>
  );
}
