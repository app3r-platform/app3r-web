import Link from "next/link";
import { FlowCard } from "../_lib/flow-card";

// ── C7 Cancel (before assignment) ────────────────────────────────────────────
// ลูกค้ายกเลิกประกาศก่อนที่ WeeeR จะได้รับงาน → Escrow ไม่ถูก lock
// ─────────────────────────────────────────────────────────────────────────────

const JOB = "job-c7-001";

export default function C7CancelPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="mock-anno mock-anno-origin">
        ◀ มาจาก: <code>repair/mockup</code> (Case Index)
      </div>
      <Link href="/repair/mockup" className="text-gray-500 text-sm flex items-center gap-1 hover:text-gray-800">‹ กลับ Case Index</Link>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded-full text-sm font-mono">C7</span>
          <h1 className="text-xl font-bold text-gray-900">Cancel (before assignment)</h1>
        </div>
        <p className="text-xs text-gray-500">ลูกค้ายกเลิกก่อน WeeeR accept → state: cancelled · Escrow ไม่ถูก lock (ยกเว้นค่า processing fee)</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">📋 Sample Data</p>
        <p><span className="text-gray-400 w-36 inline-block">เครื่อง</span>เครื่องปรับอากาศ Mitsubishi 18000 BTU</p>
        <p><span className="text-gray-400 w-36 inline-block">เหตุผลยกเลิก</span>ซื้อเครื่องใหม่แทน / เปลี่ยนใจ</p>
        <p><span className="text-gray-400 w-36 inline-block">สถานะก่อนยกเลิก</span>open (ยังไม่มี WeeeR accept)</p>
        <p><span className="text-gray-400 w-36 inline-block">Gold คืน</span>ครบ 100% (ไม่มีค่าปรับ)</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">🎯 Lens Tier-1</p>
        <ul className="text-xs text-amber-700 space-y-1">
          <li>• <strong>A1</strong> Cancel → success page / cancelled state แสดงชัด</li>
          <li>• <strong>A3</strong> ปุ่ม Back จาก cancel confirm</li>
          <li>• <strong>B3</strong> Gold คืน แสดงตัวเลขไทย (ถ้ามี)</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Flow (4 ขั้นตอน)</h2>

        <FlowCard step={1} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-03→U-38" screenName="REPAIR-CREATE → SUCCESS" route="/repair/new" port={3002}
          action="แจ้งซ่อม ONSITE → U-38 success [state: open]"
          stateAfter="open"
          xapp={[{ actor:"WeeeR", id:"R-02", name:"REPAIR-ANNOUNCE-LIST (new entry)", route:"/repair/announcements", port:3001 }]}
        />

        <FlowCard step={2} actorLabel="WeeeR (ร้านซ่อม)" actorCls="bg-orange-100 text-orange-800"
          screenId="R-02→R-04" screenName="ANNOUNCE-LIST → DETAIL (ยังไม่ bid)" route="/repair/announcements/[id]" port={3001}
          action="WeeeR เห็นประกาศ กำลังพิจารณา (ยังไม่ยื่น offer)"
          stateAfter="open (no offers yet)"
          xapp={[{ actor:"WeeeU", id:"U-02", name:"REPAIR-HOME (listing card)", route:"/repair", port:3002 }]}
        />

        <FlowCard step={3} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-04" screenName="REPAIR-DETAIL (cancel)" route={`/repair/${JOB}`} port={3002}
          action="WeeeU เข้า U-04 → กด 'ยกเลิกงาน' → confirm dialog → ยืนยัน [state: cancelled]"
          stateAfter="cancelled"
          navTo="U-02 REPAIR-HOME (cancelled tab)"
          xapp={[
            { actor:"WeeeR", id:"R-02", name:"REPAIR-ANNOUNCE-LIST (entry removed)", route:"/repair/announcements", port:3001 },
            { actor:"WeeeR", id:"R-04", name:"REPAIR-ANNOUNCE-DETAIL (cancelled banner)", route:"/repair/announcements/[id]", port:3001 },
          ]}
          tier1={["A1: cancel confirm → cancelled state ชัดเจน", "A3: ปุ่ม Back ใน confirm dialog"]}
        />

        <FlowCard step={4} actorLabel="System" actorCls="bg-gray-100 text-gray-700"
          screenId="—" screenName="Auto: Escrow Release" route="/repair" port={3002}
          action="System ปลดล็อก Gold 100% คืน WeeeU · WeeeR ได้รับ notification 'งานถูกยกเลิก' · R-02 entry ถูก remove"
          stateAfter="cancelled ✅ (no penalty)"
          tier1={["B3: Gold คืนครบแสดงตัวเลขไทย"]}
        />
      </div>

      <div className="flex gap-3">
        <Link href="/repair/mockup/c6-onsite" className="text-sm text-gray-500 hover:text-gray-800 underline">← C6 ONSITE</Link>
        <Link href="/repair/mockup/c8-abandoned" className="text-sm text-weeeu-primary hover:text-weeeu-dark underline">C8 Abandoned →</Link>
      </div>
    </div>
  );
}
