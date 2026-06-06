import Link from "next/link";
import { FlowCard } from "../_lib/flow-card";

// ── C3 SHIPPING / Parcel ──────────────────────────────────────────────────────
// ลูกค้าส่งเครื่องไปรษณีย์ไปที่ร้าน → ร้านรับ ซ่อม → ส่งไปรษณีย์คืน
// ─────────────────────────────────────────────────────────────────────────────

const JOB = "job-c3-001";

export default function C3ParcelPage() {
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
          <span className="bg-orange-100 text-orange-800 font-bold px-3 py-1 rounded-full text-sm font-mono">C3</span>
          <h1 className="text-xl font-bold text-gray-900">Parcel / Shipping</h1>
        </div>
        <p className="text-xs text-gray-500">บริการ: 📦 ส่งไปรษณีย์ (SHIPPING) · ลูกค้าส่งพัสดุ → ร้านรับ ซ่อม → ส่งคืน</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">📋 Sample Data</p>
        <p><span className="text-gray-400 w-32 inline-block">เครื่อง</span>โทรทัศน์ Samsung 55" UA55CU8100</p>
        <p><span className="text-gray-400 w-32 inline-block">อาการ</span>หน้าจอดับ — backlight เสีย</p>
        <p><span className="text-gray-400 w-32 inline-block">งบ</span>3,000 พอยต์ทอง</p>
        <p><span className="text-gray-400 w-32 inline-block">ร้าน</span>อาร์แอร์เซอร์วิส</p>
        <p><span className="text-gray-400 w-32 inline-block">ราคาตกลง</span>2,200 พอยต์ทอง</p>
        <p><span className="text-gray-400 w-32 inline-block">Tracking</span>TH123456789TH (Kerry Express)</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">🎯 Lens Tier-1</p>
        <ul className="text-xs text-amber-700 space-y-1">
          <li>• <strong>B3</strong> Escrow ๒,๒๐๐ ตัวเลขไทย</li>
          <li>• <strong>U-53d</strong> Shipping details แสดง tracking number + carrier</li>
          <li>• <strong>A8</strong> U-53c (ship-out) = success หลัง confirm shipping</li>
          <li>• <strong>D1</strong> รูปหน้าตัดแพ็กเกจ placeholder</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Flow (9 ขั้นตอน)</h2>

        <FlowCard step={1} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-03→U-38" screenName="REPAIR-CREATE → SUCCESS" route="/repair/new" port={3002}
          action="ลูกค้าเลือกบริการ SHIPPING + กรอกรายละเอียด + งบ 3,000 → submit → U-38 success"
          stateAfter="open" navTo="U-02 REPAIR-HOME"
          xapp={[{ actor:"WeeeR", id:"R-02", name:"REPAIR-ANNOUNCE-LIST", route:"/repair/announcements", port:3001 }]}
          tier1={["A1: U-38 success page"]}
        />

        <FlowCard step={2} actorLabel="WeeeR (ร้านซ่อม)" actorCls="bg-orange-100 text-orange-800"
          screenId="R-03→R-38" screenName="REPAIR-BID → SUCCESS" route="/repair/announcements/[id]/offer" port={3001}
          action="WeeeR ยื่น offer: 2,200 พอยต์ทอง รวมค่าส่งคืน"
          stateAfter="open (offer_count=1)"
          xapp={[{ actor:"WeeeU", id:"U-05", name:"REPAIR-OFFERS", route:`/repair/${JOB}/offers`, port:3002 }]}
        />

        <FlowCard step={3} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-05" screenName="REPAIR-OFFERS" route={`/repair/${JOB}/offers`} port={3002}
          action="เลือก offer + acknowledge Gold Lock 2,600 พอยต์ทอง → confirm [assigned]"
          stateAfter="assigned"
          xapp={[{ actor:"WeeeR", id:"R-07", name:"REPAIR-PARCEL-QUEUE", route:"/repair/parcel/queue", port:3001 }]}
        />

        <FlowCard step={4} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-53c" screenName="REPAIR-SHIP-OUT" route={`/repair/${JOB}/ship-out`} port={3002}
          action="ลูกค้าแพ็กเครื่อง → ส่ง Kerry Express → กรอก tracking TH123456789TH → confirm"
          stateAfter="assigned (tracking added)"
          navTo="U-53d REPAIR-SHIPPING"
          xapp={[{ actor:"WeeeR", id:"R-07", name:"REPAIR-PARCEL-QUEUE (tracking updated)", route:"/repair/parcel/queue", port:3001 }]}
          tier1={["A8: confirm ship-out → success/confirmation screen"]}
        />

        <FlowCard step={5} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-53d" screenName="REPAIR-SHIPPING (tracking)" route={`/repair/${JOB}/shipping-details`} port={3002}
          action="แสดง tracking status + ETA + WeeeR address — รอพัสดุถึง"
          stateAfter="in_transit"
          xapp={[{ actor:"WeeeR", id:"R-07", name:"REPAIR-PARCEL-QUEUE (in_transit)", route:"/repair/parcel/queue", port:3001 }]}
        />

        <FlowCard step={6} actorLabel="WeeeR→WeeeT" actorCls="bg-orange-100 text-orange-800"
          screenId="R-08" screenName="REPAIR-C3-PARCEL (receive→inspect)" route="/repair/parcel/queue/[id]" port={3001}
          action="WeeeR รับพัสดุ (R-08-receive) → ตรวจ (R-08-inspect) → assign WeeeT → T-02 วินิจฉัย → T-03 ซ่อม → T-15 เสร็จ"
          stateAfter="in_progress → completed"
          xapp={[
            { actor:"WeeeU", id:"U-06", name:"REPAIR-PROGRESS (0→100%)", route:`/repair/${JOB}/progress`, port:3002 },
            { actor:"WeeeT", id:"T-38", name:"POST-REPAIR", route:"/jobs/[id]/post-repair", port:3003 },
          ]}
          tier1={["D1: รูปพัสดุ after-repair placeholder"]}
        />

        <FlowCard step={7} actorLabel="WeeeR (ร้านซ่อม)" actorCls="bg-orange-100 text-orange-800"
          screenId="R-08" screenName="REPAIR-C3-PARCEL (ship-back)" route="/repair/parcel/queue/[id]" port={3001}
          action="WeeeR แพ็กเครื่องส่งคืน → R-08-ship-back: กรอก return tracking → ส่งไปรษณีย์"
          stateAfter="awaiting_review"
          xapp={[{ actor:"WeeeU", id:"U-53d", name:"REPAIR-SHIPPING (return tracking)", route:`/repair/${JOB}/shipping-details`, port:3002 }]}
        />

        <FlowCard step={8} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-53a" screenName="REPAIR-PARCEL-RCPT" route={`/repair/${JOB}/parcel-receipt`} port={3002}
          action="พัสดุถึง ลูกค้ายืนยันรับ + รูปหลักฐาน [state: awaiting_review → completed]"
          stateAfter="awaiting_review"
          navTo="U-09 REPAIR-REVIEW"
          tier1={["D1: รูปกล่องพัสดุ placeholder"]}
        />

        <FlowCard step={9} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-09" screenName="REPAIR-REVIEW" route={`/repair/${JOB}/review`} port={3002}
          action="ตรวจสภาพเครื่อง + ให้ดาว + ความคิดเห็น → submit → closed ✅"
          stateAfter="closed ✅"
          xapp={[{ actor:"WeeeR", id:"R-11", name:"REPAIR-JOB-DETAIL (closed)", route:"/repair/jobs/[id]", port:3001 }]}
          tier1={["A1: review → closed"]}
        />
      </div>

      <div className="flex gap-3">
        <Link href="/repair/mockup/c2-pickup" className="text-sm text-gray-500 hover:text-gray-800 underline">← C2 Pickup</Link>
        <Link href="/repair/mockup/c4-scrap" className="text-sm text-weeeu-primary hover:text-weeeu-dark underline">C4 Scrap →</Link>
      </div>
    </div>
  );
}
