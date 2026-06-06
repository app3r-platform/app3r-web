import Link from "next/link";
import { FlowCard } from "../_lib/flow-card";

// ── C4 Scrap Conversion (B2 accept) ──────────────────────────────────────────
// WeeeR วินิจฉัยว่าซ่อมไม่คุ้ม → ส่ง B2.2 ข้อเสนอรับซื้อซาก
// WeeeU ตกลงขายซาก → สร้าง Scrap job อัตโนมัติ
// ─────────────────────────────────────────────────────────────────────────────

const JOB = "job-c4-001";

export default function C4ScrapPage() {
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
          <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-sm font-mono">C4</span>
          <h1 className="text-xl font-bold text-gray-900">Scrap Conversion (B2 accept)</h1>
        </div>
        <p className="text-xs text-gray-500">WeeeR วินิจฉัย: ซ่อมไม่คุ้ม → B2.2 เสนอซาก → WeeeU ตกลง → Scrap job</p>
      </div>

      {/* B2 Decision highlight */}
      <div className="bg-teal-50 border border-teal-300 rounded-xl p-4">
        <p className="text-sm font-bold text-teal-800 mb-1">♻️ B2 Branch — Scrap Conversion</p>
        <p className="text-xs text-teal-700">
          WeeeR ส่ง B2.2 offer → state: <code className="font-mono">awaiting_user</code> + <code className="font-mono">decision_branch=B2.2</code><br/>
          WeeeU ตัดสินใจที่ <strong>U-52b</strong> → ตกลง → <strong>U-07</strong> เลือก scrap buyer<br/>
          System สร้าง Scrap job → Repair state: <code className="font-mono">converted_scrap</code>
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">📋 Sample Data</p>
        <p><span className="text-gray-400 w-36 inline-block">เครื่อง</span>ตู้เย็น Sharp SJ-X475TP</p>
        <p><span className="text-gray-400 w-36 inline-block">อาการ</span>คอมเพรสเซอร์ระเบิด</p>
        <p><span className="text-gray-400 w-36 inline-block">ผลวินิจฉัย</span>ซ่อมไม่คุ้ม — ราคาซ่อม 4,200 {`>`} ราคาเครื่องใหม่ 4,500</p>
        <p><span className="text-gray-400 w-36 inline-block">B2 ราคาซาก</span>350 พอยต์ทอง</p>
        <p><span className="text-gray-400 w-36 inline-block">ค่าตรวจหัก</span>100 พอยต์ทอง</p>
        <p><span className="text-gray-400 w-36 inline-block">สุทธิ</span>250 พอยต์ทอง (ลูกค้าได้รับ)</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">🎯 Lens Tier-1</p>
        <ul className="text-xs text-amber-700 space-y-1">
          <li>• <strong>B2</strong> U-52b: decision screen แสดง scrap offer ชัดเจน</li>
          <li>• <strong>B3</strong> Escrow + ราคาซาก แสดงตัวเลขไทย ๓๕๐ พอยต์ทอง</li>
          <li>• <strong>A1</strong> ตกลง → U-07 (scrap offer selection) → success</li>
          <li>• <strong>A8</strong> Scrap job created = success state</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Flow (7 ขั้นตอน)</h2>

        <FlowCard step={1} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-03→U-38" screenName="REPAIR-CREATE → SUCCESS" route="/repair/new" port={3002}
          action="แจ้งซ่อมตู้เย็น ONSITE + งบ 2,000 พอยต์ทอง (ไม่รู้ว่าซ่อมไม่ได้)"
          stateAfter="open"
          xapp={[{ actor:"WeeeR", id:"R-02", name:"REPAIR-ANNOUNCE-LIST", route:"/repair/announcements", port:3001 }]}
        />

        <FlowCard step={2} actorLabel="WeeeR→WeeeU" actorCls="bg-orange-100 text-orange-800"
          screenId="R-03→U-05" screenName="REPAIR-BID → OFFERS" route="/repair/announcements/[id]/offer" port={3001}
          action="WeeeR ยื่น offer 1,800 → WeeeU เลือก → assigned"
          stateAfter="assigned"
          xapp={[{ actor:"WeeeU", id:"U-04", name:"REPAIR-DETAIL (assigned)", route:`/repair/${JOB}`, port:3002 }]}
        />

        <FlowCard step={3} actorLabel="WeeeT (ช่าง)" actorCls="bg-green-100 text-green-800"
          screenId="T-02" screenName="DIAGNOSE" route="/jobs/[id]/diagnose" port={3003}
          action="WeeeT ตรวจวินิจฉัย: คอมเพรสเซอร์ระเบิด — ซ่อมไม่คุ้ม → รายงานให้ WeeeR"
          stateAfter="awaiting_decision"
          xapp={[
            { actor:"WeeeR", id:"R-11", name:"REPAIR-JOB-DETAIL (awaiting_decision)", route:"/repair/jobs/[id]", port:3001 },
            { actor:"WeeeU", id:"U-04", name:"REPAIR-DETAIL (inspecting)", route:`/repair/${JOB}`, port:3002 },
          ]}
        />

        <FlowCard step={4} actorLabel="WeeeR (ร้านซ่อม)" actorCls="bg-orange-100 text-orange-800"
          screenId="R-46" screenName="LISTINGS-REPAIR (B2 scrap listing)" route="/listings/repair" port={3001}
          action="WeeeR สร้าง scrap offer ราคา 350 พอยต์ทอง → ส่ง B2.2 ให้ WeeeU"
          stateAfter="awaiting_user (decision_branch=B2.2)"
          xapp={[{ actor:"WeeeU", id:"U-52b", name:"REPAIR-B2-DECISION (awaiting)", route:`/repair/${JOB}/decision/b2-2`, port:3002 }]}
          tier1={["B2: B2.2 offer ส่งครบ (ราคา+เหตุผล+ทางเลือก)"]}
        />

        <FlowCard step={5} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-52b" screenName="REPAIR-B2-DECISION" route={`/repair/${JOB}/decision/b2-2`} port={3002}
          action="ดูข้อเสนอ B2.2: ราคาซาก 350, ค่าตรวจ -100, สุทธิ 250 พอยต์ทอง → ✅ ตกลงขายซาก"
          stateAfter="B2 accepted → loading scrap-offer"
          navTo="U-07 REPAIR-C4-SCRAP"
          tier1={["B2: decision screen แสดง: ราคาซาก / ค่าตรวจหัก / สุทธิ ชัดเจน", "B3: ตัวเลขไทย ๓๕๐ พอยต์ทอง"]}
        />

        <FlowCard step={6} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-07" screenName="REPAIR-C4-SCRAP" route={`/repair/${JOB}/scrap-offer`} port={3002}
          action="เลือก scrap buyer (ร้านคูลเทคแอร์ 850฿ / ศูนย์ซากเย็น ฟรี+ใบ E-Waste / ร้านอิเล็กทรอ 650฿) → confirm"
          stateAfter="scrap buyer selected"
          navTo="/scrap/new (System สร้าง Scrap job)"
          xapp={[
            { actor:"WeeeR", id:"R-46b", name:"LISTINGS-REPAIR-DETAIL", route:"/listings/repair/[id]", port:3001 },
            { actor:"Admin", id:"A-21", name:"REPAIR-ANALYTICS (converted_scrap +1)", route:"/repair/analytics", port:3000 },
          ]}
          tier1={["A1: ตกลง → scrap job created success", "A7: ราคาซาก sample ครบ"]}
        />

        <FlowCard step={7} actorLabel="System" actorCls="bg-gray-100 text-gray-700"
          screenId="—" screenName="Auto: Scrap Job Created" route="/scrap/new" port={3002}
          action="System สร้าง Scrap job อัตโนมัติ → Repair state: converted_scrap → Escrow ปลดล็อก → WeeeU ได้รับ 250 พอยต์ทอง"
          stateAfter="converted_scrap ✅"
          xapp={[
            { actor:"WeeeU", id:"U-04", name:"REPAIR-DETAIL (converted_scrap)", route:`/repair/${JOB}`, port:3002 },
            { actor:"WeeeR", id:"R-11", name:"REPAIR-JOB-DETAIL (completed+scrap)", route:"/repair/jobs/[id]", port:3001 },
          ]}
          tier1={["A8: Scrap job created = success confirmation"]}
        />
      </div>

      <div className="flex gap-3">
        <Link href="/repair/mockup/c3-parcel" className="text-sm text-gray-500 hover:text-gray-800 underline">← C3 Parcel</Link>
        <Link href="/repair/mockup/c5-reprice" className="text-sm text-weeeu-primary hover:text-weeeu-dark underline">C5 Re-price →</Link>
      </div>
    </div>
  );
}
