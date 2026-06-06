import Link from "next/link";
import { FlowCard } from "../_lib/flow-card";
import type { XApp } from "../_lib/flow-card";

// ── C2 PICKUP_DELIVERY ────────────────────────────────────────────────────────
// WeeeT ออกไปรับเครื่องถึงบ้านลูกค้า → ซ่อมที่ร้าน WeeeR → WeeeT ส่งคืน
// ─────────────────────────────────────────────────────────────────────────────

const JOB = "job-c2-001";
const SHOP = "ช่างแอร์ไทย";

export default function C2PickupPage() {
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
          <span className="bg-teal-100 text-teal-800 font-bold px-3 py-1 rounded-full text-sm font-mono">C2</span>
          <h1 className="text-xl font-bold text-gray-900">Pickup / Delivery</h1>
        </div>
        <p className="text-xs text-gray-500">บริการ: 🚗 รับ-ส่งถึงบ้าน (PICKUP_DELIVERY) · WeeeT ออกไปรับ → ซ่อมที่ร้าน → WeeeT ส่งคืน</p>
      </div>

      {/* Sample data */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">📋 Sample Data</p>
        <p><span className="text-gray-400 w-32 inline-block">เครื่อง</span>ตู้เย็น Sharp รุ่น SJ-X280TP-SL</p>
        <p><span className="text-gray-400 w-32 inline-block">อาการ</span>ไม่เย็น — ระบบทำความเย็นขัดข้อง</p>
        <p><span className="text-gray-400 w-32 inline-block">งบ</span>2,000 พอยต์ทอง</p>
        <p><span className="text-gray-400 w-32 inline-block">ร้าน</span>{SHOP}</p>
        <p><span className="text-gray-400 w-32 inline-block">ราคาตกลง</span>1,400 พอยต์ทอง</p>
        <p><span className="text-gray-400 w-32 inline-block">Gold lock</span>1,700 พอยต์ทอง</p>
        <p><span className="text-gray-400 w-32 inline-block">รับของ</span>อังคารที่ 27 พ.ค. 2569 08:00–12:00</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">🎯 Lens Tier-1</p>
        <ul className="text-xs text-amber-700 space-y-1">
          <li>• <strong>B3</strong> Escrow ๑,๗๐๐ พอยต์ทอง ตัวเลขไทย</li>
          <li>• <strong>T-04</strong> WeeeT en-route แสดงแผนที่/ETA (mockup placeholder)</li>
          <li>• <strong>A8</strong> U-02c → success แสดงวันนัดรับ</li>
          <li>• <strong>D1</strong> รูปหลักฐาน after-repair placeholder</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Flow (10 ขั้นตอน)</h2>

        <FlowCard step={1} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-02c" screenName="REPAIR-PICKUP-SCHED" route="/repair/pickup/schedule" port={3002}
          action="ลูกค้าเลือกบริการ PICKUP_DELIVERY + นัดวันเวลารับเครื่อง + ระบุที่อยู่ → confirm"
          stateAfter="open" navTo="U-03 REPAIR-CREATE"
          xapp={[{ actor:"WeeeR", id:"R-07b", name:"REPAIR-PICKUP-QUEUE", route:"/repair/pickup/queue", port:3001 }]}
          tier1={["A7: sample date/time picker พร้อม AM/PM"]}
        />

        <FlowCard step={2} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-03→U-38" screenName="REPAIR-CREATE → SUCCESS" route="/repair/new" port={3002}
          action="กรอกรายละเอียด → submit → U-38 success: 'นัดรับวันอังคาร 27 พ.ค. 2569 08:00–12:00'"
          stateAfter="open" navTo="U-02 REPAIR-HOME"
          tier1={["A1: U-38 success page", "A8: แสดงวันนัด"]}
        />

        <FlowCard step={3} actorLabel="WeeeR (ร้านซ่อม)" actorCls="bg-orange-100 text-orange-800"
          screenId="R-03→R-38" screenName="REPAIR-BID → BID-SUCCESS" route="/repair/announcements/[id]/offer" port={3001}
          action="WeeeR ยื่น offer: 1,400 พอยต์ทอง · ค่าขนส่งรวม → R-38 success"
          stateAfter="open (offer_count=1)"
          xapp={[{ actor:"WeeeU", id:"U-05", name:"REPAIR-OFFERS", route:`/repair/${JOB}/offers`, port:3002 }]}
        />

        <FlowCard step={4} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-05" screenName="REPAIR-OFFERS" route={`/repair/${JOB}/offers`} port={3002}
          action="เลือก offer ของ 'ช่างแอร์ไทย' + acknowledge Gold Lock 1,700 → confirm [assigned]"
          stateAfter="assigned"
          xapp={[
            { actor:"WeeeR", id:"R-07b", name:"REPAIR-PICKUP-QUEUE (new job)", route:"/repair/pickup/queue", port:3001 },
            { actor:"WeeeT", id:"T-01", name:"Jobs list (assigned)", route:"/jobs", port:3003 },
          ] as XApp[]}
        />

        <FlowCard step={5} actorLabel="WeeeR (ร้านซ่อม)" actorCls="bg-orange-100 text-orange-800"
          screenId="R-65" screenName="REPAIR-C2-PICKUP (dispatch)" route="/repair/pickup/queue/[id]" port={3001}
          action="WeeeR กำหนด WeeeT ออกไปรับเครื่อง [state: traveling]"
          stateAfter="traveling"
          xapp={[
            { actor:"WeeeT", id:"T-04", name:"PICKUP EN-ROUTE (แผนที่+ETA)", route:"/jobs/[id]", port:3003 },
            { actor:"WeeeU", id:"U-04", name:"REPAIR-DETAIL (traveling)", route:`/repair/${JOB}`, port:3002 },
          ] as XApp[]}
          tier1={["D1: T-04 แผนที่ placeholder / ETA text fallback"]}
        />

        <FlowCard step={6} actorLabel="WeeeT (ช่าง)" actorCls="bg-green-100 text-green-800"
          screenId="T-04" screenName="PICKUP EN-ROUTE/ARRIVED" route="/jobs/[id]" port={3003}
          action="WeeeT ถึงบ้านลูกค้า → ลูกค้ายืนยันส่งมอบเครื่อง → WeeeT รับเครื่องไปที่ร้าน"
          stateAfter="in_progress"
          xapp={[
            { actor:"WeeeR", id:"R-65", name:"REPAIR-C2-PICKUP (intake)", route:"/repair/pickup/queue/[id]", port:3001 },
            { actor:"WeeeU", id:"U-04", name:"REPAIR-DETAIL (in_progress)", route:`/repair/${JOB}`, port:3002 },
          ] as XApp[]}
        />

        <FlowCard step={7} actorLabel="WeeeR→WeeeT" actorCls="bg-orange-100 text-orange-800"
          screenId="R-65→T-02→T-03" screenName="PICKUP-FLOW + DIAGNOSE + REPAIR" route="/repair/pickup/queue/[id]" port={3001}
          action="R-65-diagnose: WeeeR ตรวจสอบ → assign WeeeT → T-02 วินิจฉัย → T-03 ซ่อม → T-15 เสร็จ → T-38 post-repair"
          stateAfter="completed → awaiting_review"
          xapp={[
            { actor:"WeeeU", id:"U-06", name:"REPAIR-PROGRESS (0→100%)", route:`/repair/${JOB}/progress`, port:3002 },
            { actor:"WeeeR", id:"R-11", name:"REPAIR-JOB-DETAIL", route:"/repair/jobs/[id]", port:3001 },
          ] as XApp[]}
        />

        <FlowCard step={8} actorLabel="WeeeR (ร้านซ่อม)" actorCls="bg-orange-100 text-orange-800"
          screenId="R-65" screenName="REPAIR-C2-PICKUP (ready-to-deliver)" route="/repair/pickup/queue/[id]" port={3001}
          action="WeeeR กด 'ส่งคืน' → dispatch WeeeT ออกไปส่งเครื่องให้ลูกค้า"
          stateAfter="awaiting_review"
          xapp={[
            { actor:"WeeeT", id:"T-44", name:"DELIVERY sub-flow", route:"/jobs/[id]", port:3003 },
            { actor:"WeeeU", id:"U-04", name:"REPAIR-DETAIL (notification)", route:`/repair/${JOB}`, port:3002 },
          ] as XApp[]}
        />

        <FlowCard step={9} actorLabel="WeeeT (ช่าง)" actorCls="bg-green-100 text-green-800"
          screenId="T-44" screenName="DELIVERY (ส่งเครื่องถึงบ้าน)" route="/jobs/[id]" port={3003}
          action="WeeeT ส่งเครื่องถึงบ้านลูกค้า → confirm delivery → ลูกค้ายืนยันรับ"
          stateAfter="awaiting_review"
          xapp={[{ actor:"WeeeU", id:"U-53b", name:"REPAIR-PICKUP-RCPT", route:`/repair/${JOB}/pickup-receipt`, port:3002 }]}
        />

        <FlowCard step={10} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-53b→U-09" screenName="PICKUP-RCPT → REVIEW" route={`/repair/${JOB}/pickup-receipt`} port={3002}
          action="ยืนยันรับเครื่อง (U-53b) → U-09 review ⭐⭐⭐⭐⭐ → submit → closed ✅"
          stateAfter="closed ✅"
          xapp={[{ actor:"WeeeR", id:"R-65", name:"REPAIR-C2-PICKUP (completed)", route:"/repair/pickup/queue/[id]", port:3001 }]}
          tier1={["A8: U-53b = delivery receipt success page", "A1: review → closed"]}
        />
      </div>

      <div className="flex gap-3">
        <Link href="/repair/mockup/c1-walkin" className="text-sm text-gray-500 hover:text-gray-800 underline">← C1 Walk-in</Link>
        <Link href="/repair/mockup/c3-parcel" className="text-sm text-weeeu-primary hover:text-weeeu-dark underline">C3 Parcel →</Link>
      </div>
    </div>
  );
}
