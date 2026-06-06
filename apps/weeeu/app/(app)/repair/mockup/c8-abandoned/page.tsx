import Link from "next/link";
import { FlowCard } from "../_lib/flow-card";

// ── C8 Walk-in Abandoned ──────────────────────────────────────────────────────
// ซ่อมเสร็จแล้วแต่ลูกค้าไม่มารับเกินกำหนด (7 วัน)
// WeeeR trigger abandoned → ค่าฝากถูกหัก → state: abandoned
// ─────────────────────────────────────────────────────────────────────────────

const JOB = "job-c8-001";

export default function C8AbandonedPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="mock-anno mock-anno-origin">
        ◀ มาจาก: <code>repair/mockup</code> (Case Index)
      </div>
      <Link href="/repair/mockup" className="text-gray-500 text-sm flex items-center gap-1 hover:text-gray-800">‹ กลับ Case Index</Link>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="bg-red-100 text-red-800 font-bold px-3 py-1 rounded-full text-sm font-mono">C8</span>
          <h1 className="text-xl font-bold text-gray-900">Walk-in Abandoned</h1>
        </div>
        <p className="text-xs text-gray-500">บริการ: 🏪 DROP_OFF · ซ่อมเสร็จแต่ลูกค้าไม่มารับ 7 วัน → ค่าฝาก → abandoned</p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-sm font-bold text-red-800 mb-1">⚠️ R-06-abandoned sub-step</p>
        <p className="text-xs text-red-700">
          เมื่อเกิน grace period → WeeeR trigger <code>R-06-abandoned</code> → state: abandoned<br/>
          ค่าฝาก (storage fee) = เงื่อนไข 7 ใน offer (no_show_fee) ถูกหัก<br/>
          Escrow ปลดล็อก ยกเว้น storage fee
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">📋 Sample Data</p>
        <p><span className="text-gray-400 w-36 inline-block">เครื่อง</span>พัดลมตั้งพื้น Panasonic F-M09A</p>
        <p><span className="text-gray-400 w-36 inline-block">ราคาซ่อม</span>350 พอยต์ทอง</p>
        <p><span className="text-gray-400 w-36 inline-block">วันพร้อมรับ</span>26 พ.ค. 2569</p>
        <p><span className="text-gray-400 w-36 inline-block">grace period</span>7 วัน (หมด 2 มิ.ย. 2569)</p>
        <p><span className="text-gray-400 w-36 inline-block">ค่าฝากวันละ</span>50 พอยต์ทอง × 7 วัน = 350 พอยต์ทอง</p>
        <p><span className="text-gray-400 w-36 inline-block">Gold คืน</span>0 (ค่าซ่อม + ค่าฝากเกิน Escrow)</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">🎯 Lens Tier-1</p>
        <ul className="text-xs text-amber-700 space-y-1">
          <li>• <strong>B3</strong> ค่าฝาก ๓๕๐ ตัวเลขไทย</li>
          <li>• <strong>A7</strong> R-06-abandoned แสดง countdown + ค่าฝากสะสม</li>
          <li>• <strong>A1</strong> abandoned trigger → notification ให้ WeeeU</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Flow (6 ขั้นตอน)</h2>

        <FlowCard step={1} actorLabel="WeeeU + WeeeR" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-02b→R-05→R-06" screenName="DROP_OFF create + assign + walkin" route="/repair/walk-in/select-shop" port={3002}
          action="C1 happy path ขั้นตอน 1–7: สร้าง → bid → assign → รับเครื่อง → ซ่อม"
          stateAfter="in_progress (C1 steps 1-7)"
          xapp={[{ actor:"WeeeR", id:"R-06", name:"REPAIR-C1-WALKIN (in-progress)", route:"/repair/walk-in/queue/[id]", port:3001 }]}
        />

        <FlowCard step={2} actorLabel="WeeeR (ร้านซ่อม)" actorCls="bg-orange-100 text-orange-800"
          screenId="R-06" screenName="REPAIR-C1-WALKIN (ready)" route="/repair/walk-in/queue/[id]" port={3001}
          action="WeeeR กด 'ซ่อมเสร็จ / พร้อมรับ' → แจ้งลูกค้า [state: awaiting_review]"
          stateAfter="awaiting_review"
          xapp={[{ actor:"WeeeU", id:"U-04", name:"REPAIR-DETAIL (notification: มารับได้แล้ว)", route:`/repair/${JOB}`, port:3002 }]}
        />

        <FlowCard step={3} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-04" screenName="REPAIR-DETAIL (awaiting_review)" route={`/repair/${JOB}`} port={3002}
          action="ลูกค้าได้รับ notification แต่ยังไม่มารับ → หมด 7 วัน (grace period)"
          stateAfter="awaiting_review (ลูกค้าไม่ respond)"
          xapp={[{ actor:"WeeeR", id:"R-06", name:"REPAIR-C1-WALKIN (countdown)", route:"/repair/walk-in/queue/[id]", port:3001 }]}
          tier1={["A7: R-06 แสดง countdown วันที่เหลือ + ค่าฝากสะสม"]}
        />

        <FlowCard step={4} actorLabel="WeeeR (ร้านซ่อม)" actorCls="bg-orange-100 text-orange-800"
          screenId="R-06" screenName="REPAIR-C1-WALKIN (abandoned trigger)" route="/repair/walk-in/queue/[id]" port={3001}
          action="หมด 7 วัน → WeeeR trigger R-06-abandoned → ระบุเหตุผล 'ลูกค้าไม่มารับ' → confirm"
          stateAfter="abandoned (fee deducted)"
          xapp={[
            { actor:"WeeeU", id:"U-04", name:"REPAIR-DETAIL (abandoned + fee notice)", route:`/repair/${JOB}`, port:3002 },
            { actor:"Admin", id:"A-02", name:"REPAIR-JOBS (abandoned entry)", route:"/repair/jobs", port:3000 },
          ]}
          tier1={["B3: ค่าฝากสะสม ๓๕๐ ตัวเลขไทย"]}
        />

        <FlowCard step={5} actorLabel="System" actorCls="bg-gray-100 text-gray-700"
          screenId="—" screenName="Auto: Settlement (storage fee)" route="/repair" port={3002}
          action="System: หักค่าฝาก 350 จาก Escrow → โอน 700 (ราคาซ่อม+ค่าฝาก) ให้ WeeeR · Gold คืน WeeeU 0"
          stateAfter="abandoned ✅"
          tier1={["A1: abandoned notification ส่ง WeeeU พร้อมรายละเอียดค่าใช้จ่าย"]}
        />

        <FlowCard step={6} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-04" screenName="REPAIR-DETAIL (abandoned + history)" route={`/repair/${JOB}`} port={3002}
          action="WeeeU ดูสถานะ: abandoned + ค่าฝากถูกหัก — งานปิด (ไม่มี review)"
          stateAfter="abandoned (closed, no review)"
        />
      </div>

      <div className="flex gap-3">
        <Link href="/repair/mockup/c7-cancel" className="text-sm text-gray-500 hover:text-gray-800 underline">← C7 Cancel</Link>
        <Link href="/repair/mockup/c9-dispute" className="text-sm text-weeeu-primary hover:text-weeeu-dark underline">C9 Dispute →</Link>
      </div>
    </div>
  );
}
