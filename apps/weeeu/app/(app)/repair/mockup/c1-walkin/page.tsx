import Link from "next/link";

// ── C1 DROP_OFF / Walk-in ────────────────────────────────────────────────────
// บริการ DROP_OFF: ลูกค้านำเครื่องไปส่งที่ร้านซ่อมด้วยตนเอง
// ร้านรับเข้า → ตรวจสอบ → ซ่อม → แจ้งพร้อม → ลูกค้ามารับ
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE = {
  jobId: "job-c1-001",
  appliance: "เครื่องซักผ้า LG รุ่น WD-1480",
  issue: "ไม่ปั่นแห้ง — มอเตอร์ผิดปกติ",
  budget: 1500,
  shopName: "ร้านซ่อมดีเจริญ",
  shopAddr: "ลาดพร้าว 101 บางกะปิ กทม.",
  quotedPrice: 900,
  goldLocked: 1100,
  dropOffDate: "จันทร์ที่ 26 พ.ค. 2569",
};

export default function C1WalkinPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* §5 mock-anno-origin */}
      <div className="mock-anno mock-anno-origin">
        ◀ มาจาก: <code>repair/mockup</code> (Case Index)
      </div>

      <Link href="/repair/mockup" className="text-gray-500 hover:text-gray-800 text-sm flex items-center gap-1">
        ‹ กลับ Case Index
      </Link>

      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm font-mono">C1</span>
          <h1 className="text-xl font-bold text-gray-900">Walk-in / DROP_OFF</h1>
        </div>
        <p className="text-xs text-gray-500">บริการ: 🏪 ส่งที่ร้าน (DROP_OFF) · ลูกค้านำเครื่องไปส่งเอง</p>
      </div>

      {/* Sample data */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">📋 Sample Data</p>
        <p><span className="text-gray-400 w-32 inline-block">เครื่อง</span>{SAMPLE.appliance}</p>
        <p><span className="text-gray-400 w-32 inline-block">อาการ</span>{SAMPLE.issue}</p>
        <p><span className="text-gray-400 w-32 inline-block">งบ</span>{SAMPLE.budget.toLocaleString()} พอยต์ทอง</p>
        <p><span className="text-gray-400 w-32 inline-block">ร้าน</span>{SAMPLE.shopName} · {SAMPLE.shopAddr}</p>
        <p><span className="text-gray-400 w-32 inline-block">ราคาตกลง</span>{SAMPLE.quotedPrice.toLocaleString()} พอยต์ทอง</p>
        <p><span className="text-gray-400 w-32 inline-block">Gold lock</span>{SAMPLE.goldLocked.toLocaleString()} พอยต์ทอง</p>
        <p><span className="text-gray-400 w-32 inline-block">วันนำส่ง</span>{SAMPLE.dropOffDate}</p>
      </div>

      {/* Lens */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">🎯 Lens Tier-1</p>
        <ul className="text-xs text-amber-700 space-y-1">
          <li>• <strong>B3</strong> Escrow แสดงตัวเลขไทย ๙๐๐ / ๑,๑๐๐ พอยต์ทอง</li>
          <li>• <strong>A8</strong> U-38 success page หลัง U-03 submit</li>
          <li>• <strong>A3</strong> ปุ่ม ‹ Back ทุกจอ</li>
          <li>• <strong>A7</strong> Shop list ใน U-02b มี sample ร้าน (ชื่อ+ที่อยู่+ระยะ)</li>
          <li>• <strong>D1</strong> รูปร้านค้าใน U-02b → placeholder fallback</li>
        </ul>
      </div>

      {/* Flow */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Flow (9 ขั้นตอน)</h2>

        {/* Step 1 */}
        <FlowCard step={1} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-02b" screenName="REPAIR-WALKIN-SHOP" route={`/repair/walk-in/select-shop`} port={3002}
          action="ลูกค้าเลือกบริการ DROP_OFF → ค้นหาร้านใกล้บ้าน → เลือก 'ร้านซ่อมดีเจริญ' 3.2 กม."
          stateAfter="open" navTo="U-03 REPAIR-CREATE"
          xapp={[{ actor:"WeeeR", id:"R-02", name:"REPAIR-ANNOUNCE-LIST", route:"/repair/announcements", port:3001 }]}
          tier1={["A7: shop list มี sample ชื่อ/ที่อยู่/rating/ระยะทาง"]}
        />

        {/* Step 2 */}
        <FlowCard step={2} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-03" screenName="REPAIR-CREATE" route="/repair/new" port={3002}
          action="กรอกอาการ + รูปภาพ + งบ 1,500 พอยต์ทอง → submit"
          stateAfter="open" navTo="U-38 REPAIR-CREATE-SUCCESS"
          tier1={["A1: submit → U-38 success", "A4: color weeeu-primary"]}
        />

        {/* Step 3 */}
        <FlowCard step={3} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-38" screenName="REPAIR-CREATE-SUCCESS" route="/repair/new/success" port={3002}
          action="success page: ประกาศสร้างสำเร็จ แสดง job ID + คำแนะนำ 'รอ WeeeR ยื่น offer'"
          stateAfter="open" navTo="U-02 REPAIR-HOME"
          tier1={["A8: success page"]}
        />

        {/* Step 4 */}
        <FlowCard step={4} actorLabel="WeeeR (ร้านซ่อม)" actorCls="bg-orange-100 text-orange-800"
          screenId="R-03" screenName="REPAIR-BID" route="/repair/announcements/[id]/offer" port={3001}
          action={`ร้านยื่นข้อเสนอ: ราคา ${SAMPLE.quotedPrice.toLocaleString()} · ค่าตรวจ 100 · รับประกัน 60 วัน`}
          stateAfter="open (offer_count=1)" navTo="R-38 REPAIR-BID-SUCCESS"
          xapp={[{ actor:"WeeeU", id:"U-05", name:"REPAIR-OFFERS", route:`/repair/${SAMPLE.jobId}/offers`, port:3002 }]}
          tier1={["B3: ราคา offer แสดงตัวเลขไทย"]}
        />

        {/* Step 5 */}
        <FlowCard step={5} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-05" screenName="REPAIR-OFFERS" route={`/repair/${SAMPLE.jobId}/offers`} port={3002}
          action={`ดูข้อเสนอ → acknowledge Gold Lock ${SAMPLE.goldLocked.toLocaleString()} พอยต์ทอง → เลือก '${SAMPLE.shopName}'`}
          stateAfter="assigned"
          xapp={[{ actor:"WeeeR", id:"R-05", name:"REPAIR-WALKIN-QUEUE", route:"/repair/walk-in/queue", port:3001 }]}
          tier1={["B3: Gold Lock ตัวเลขไทย ๑,๑๐๐", "A5: acknowledge checkbox ก่อนเลือกร้าน"]}
        />

        {/* Step 6 */}
        <FlowCard step={6} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-04" screenName="REPAIR-DETAIL (assigned)" route={`/repair/${SAMPLE.jobId}`} port={3002}
          action={`ลูกค้านำเครื่องไปส่งที่ร้าน ${SAMPLE.dropOffDate} (physical action — ไม่มี screen เพิ่ม)`}
          stateAfter="assigned"
          xapp={[
            { actor:"WeeeR", id:"R-05", name:"REPAIR-WALKIN-QUEUE (รอรับ)", route:"/repair/walk-in/queue", port:3001 },
            { actor:"WeeeR", id:"R-06", name:"REPAIR-C1-WALKIN (receive)", route:"/repair/walk-in/queue/[id]", port:3001 },
          ]}
        />

        {/* Step 7 */}
        <FlowCard step={7} actorLabel="WeeeR→WeeeT" actorCls="bg-orange-100 text-orange-800"
          screenId="R-06→T-02→T-03" screenName="WALKIN-FLOW + DIAGNOSE + REPAIR" route="/repair/walk-in/queue/[id]" port={3001}
          action="WeeeR รับเครื่อง (R-06-receive) → ตรวจสอบ (R-06-inspect) → มอบหมาย WeeeT → T-02 วินิจฉัย → T-03 ซ่อม → T-15 เสร็จ → T-38 post-repair"
          stateAfter="in_progress → completed"
          xapp={[
            { actor:"WeeeU", id:"U-06", name:"REPAIR-PROGRESS (60→100%)", route:`/repair/${SAMPLE.jobId}/progress`, port:3002 },
            { actor:"WeeeT", id:"T-15", name:"REPAIR-SUCCESS", route:"/jobs/[id]/repair/success", port:3003 },
          ]}
          tier1={["D1: รูปหลักฐาน after-repair fallback"]}
        />

        {/* Step 8 */}
        <FlowCard step={8} actorLabel="WeeeR (ร้านซ่อม)" actorCls="bg-orange-100 text-orange-800"
          screenId="R-06" screenName="REPAIR-C1-WALKIN (ready)" route="/repair/walk-in/queue/[id]" port={3001}
          action="WeeeR กด 'พร้อมรับ' → แจ้งลูกค้า [state: awaiting_review]"
          stateAfter="awaiting_review"
          xapp={[{ actor:"WeeeU", id:"U-04", name:"REPAIR-DETAIL (awaiting_review notification)", route:`/repair/${SAMPLE.jobId}`, port:3002 }]}
        />

        {/* Step 9 */}
        <FlowCard step={9} actorLabel="WeeeU (ลูกค้า)" actorCls="bg-weeeu-surface text-weeeu-dark"
          screenId="U-53e→U-09" screenName="WALKIN-RCPT → REVIEW" route={`/repair/${SAMPLE.jobId}/walk-in-receipt`} port={3002}
          action="ลูกค้าไปรับเครื่อง → U-53e (walk-in receipt, confirm รับ) → U-09 (review ⭐⭐⭐⭐⭐) → submit → closed ✅"
          stateAfter="closed ✅"
          xapp={[{ actor:"WeeeR", id:"R-06", name:"REPAIR-C1-WALKIN (completed)", route:"/repair/walk-in/queue/[id]", port:3001 }]}
          tier1={["A1: review → success/closed", "A8: walk-in receipt = completion page"]}
        />
      </div>

      <div className="flex gap-3">
        <Link href="/repair/mockup" className="text-sm text-gray-500 hover:text-gray-800 underline">← Case Index</Link>
        <Link href="/repair/mockup/c2-pickup" className="text-sm text-weeeu-primary hover:text-weeeu-dark underline">C2 Pickup →</Link>
      </div>
    </div>
  );
}

function FlowCard({
  step, actorLabel, actorCls, screenId, screenName, route, port, action, stateAfter, navTo, xapp, tier1,
}: {
  step: number; actorLabel: string; actorCls: string;
  screenId: string; screenName: string; route: string; port: number;
  action: string; stateAfter: string;
  navTo?: string;
  xapp?: { actor: string; id: string; name: string; route: string; port: number }[];
  tier1?: string[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 bg-weeeu-primary text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
          {step}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${actorCls}`}>{actorLabel}</span>
            <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">{screenId}</code>
            <a href={`http://localhost:${port}${route}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-weeeu-primary underline font-medium">{screenName}</a>
          </div>
          <p className="text-sm text-gray-700">{action}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">State after:</span>
            <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{stateAfter}</span>
          </div>
          {navTo && (
            <div className="mock-anno mock-anno-nav">§6 nav: → <code>{navTo}</code></div>
          )}
          {xapp && xapp.length > 0 && (
            <div className="mock-anno mock-anno-xapp">
              <p className="font-semibold mb-1">§8 👁 แอพฯอื่น ณ จังหวะนี้:</p>
              <ul className="space-y-0.5">
                {xapp.map((x, i) => (
                  <li key={i}>
                    <span className="opacity-70">{x.actor}:</span>{" "}
                    <a href={`http://localhost:${x.port}${x.route}`} target="_blank" rel="noopener noreferrer">
                      <code>{x.id}</code> {x.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tier1 && tier1.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
              <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">🎯 Lens:</p>
              {tier1.map((l, i) => <p key={i} className="text-[10px] text-amber-600">• {l}</p>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
