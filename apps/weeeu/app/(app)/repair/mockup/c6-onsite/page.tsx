import Link from "next/link";

// ── C6 ONSITE Happy Path ──────────────────────────────────────────────────────
// บริการ ONSITE: ช่างออกไปซ่อมถึงบ้านลูกค้า — เคสหลักของโมดูล Repair
// ไม่มี B1/B2 branch decision: ซ่อมเสร็จตรง → review → closed
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE = {
  jobId: "job-c6-001",
  appliance: "เครื่องปรับอากาศ Daikin 12000 BTU",
  issue: "เสียงดังผิดปกติ — คาดว่าคอมเพรสเซอร์เสื่อม",
  budget: 2500,
  weeer: "ร้านซ่อมดีเจริญ",
  tech: "ช่างสมชาย (T-id: T-1042)",
  quotedPrice: 1800,
  goldLocked: 2300,
  scheduledAt: "พุธที่ 28 พ.ค. 2569 ช่วงบ่าย 13:00–17:00",
  location: "ถ.พระราม 4 บางรัก กทม.",
};

type FlowStep = {
  step: number;
  actor: string;
  actorColor: string;
  screenId: string;
  screenName: string;
  route: string;
  port: number;
  action: string;
  stateAfter: string;
  xapp?: { actor: string; screenId: string; screenName: string; route: string; port: number }[];
  navTo?: string;
  tier1?: string[];
};

const FLOW: FlowStep[] = [
  {
    step: 1,
    actor: "WeeeU", actorColor: "bg-weeeu-surface text-weeeu-dark",
    screenId: "U-03", screenName: "REPAIR-CREATE",
    route: "/repair/new", port: 3002,
    action: 'ลูกค้าเลือกเครื่องใช้ไฟฟ้า + อธิบายอาการ + เลือก ONSITE + ระบุงบประมาณ 2,500 พอยต์ทอง',
    stateAfter: "open",
    xapp: [
      { actor: "WeeeR", screenId: "R-02", screenName: "REPAIR-ANNOUNCE-LIST", route: "/repair/announcements", port: 3001 },
    ],
    navTo: "U-38 REPAIR-CREATE-SUCCESS",
    tier1: ["A1: หลัง submit → U-38 success page", "A7: sample data ครบ (appliance+issue+budget)", "A4: WeeeU color theme"],
  },
  {
    step: 2,
    actor: "WeeeU", actorColor: "bg-weeeu-surface text-weeeu-dark",
    screenId: "U-38", screenName: "REPAIR-CREATE-SUCCESS",
    route: "/repair/new/success", port: 3002,
    action: 'success page แสดงประกาศซ่อมที่สร้าง + Gold จะถูก lock เมื่อเลือกร้าน + กลับไป U-02',
    stateAfter: "open",
    navTo: "U-02 REPAIR-HOME (back)",
    tier1: ["A8: success page ทุก action"],
  },
  {
    step: 3,
    actor: "WeeeR", actorColor: "bg-orange-100 text-orange-800",
    screenId: "R-04", screenName: "REPAIR-ANNOUNCE-DETAIL",
    route: "/repair/announcements/[id]", port: 3001,
    action: "WeeeR เห็นประกาศใหม่ใน R-02 → เข้าดูรายละเอียด → กด 'ยื่นข้อเสนอ'",
    stateAfter: "open",
    xapp: [
      { actor: "WeeeU", screenId: "U-02", screenName: "REPAIR-HOME", route: "/repair", port: 3002 },
    ],
    navTo: "R-03 REPAIR-BID",
  },
  {
    step: 4,
    actor: "WeeeR", actorColor: "bg-orange-100 text-orange-800",
    screenId: "R-03", screenName: "REPAIR-BID",
    route: "/repair/announcements/[id]/offer", port: 3001,
    action: `WeeeR กรอกข้อเสนอ: ราคา ${SAMPLE.quotedPrice.toLocaleString()} พอยต์ทอง · ค่าตรวจ 150 · ค่ามัดจำ 500 · รับประกัน 90 วัน → R-38`,
    stateAfter: "open (offer_count+1)",
    xapp: [
      { actor: "WeeeU", screenId: "U-05", screenName: "REPAIR-OFFERS", route: `/repair/${SAMPLE.jobId}/offers`, port: 3002 },
    ],
    navTo: "R-38 REPAIR-BID-SUCCESS",
    tier1: ["B3: ราคา Escrow แสดงเป็นตัวเลขไทย ๑,๘๐๐ พอยต์ทอง"],
  },
  {
    step: 5,
    actor: "WeeeU", actorColor: "bg-weeeu-surface text-weeeu-dark",
    screenId: "U-05", screenName: "REPAIR-OFFERS",
    route: `/repair/${SAMPLE.jobId}/offers`, port: 3002,
    action: `ลูกค้าดู 3 ข้อเสนอ + เปิดเงื่อนไขขั้นสูง (9 เงื่อนไข) + acknowledge Gold Lock ${SAMPLE.goldLocked.toLocaleString()} พอยต์ทอง → เลือก '${SAMPLE.weeer}'`,
    stateAfter: "assigned",
    xapp: [
      { actor: "WeeeR", screenId: "R-09", screenName: "REPAIR-JOBS", route: "/repair/jobs", port: 3001 },
      { actor: "WeeeR", screenId: "R-11", screenName: "REPAIR-JOB-DETAIL", route: "/repair/jobs/[id]", port: 3001 },
    ],
    navTo: "U-04 REPAIR-DETAIL",
    tier1: ["B3: Escrow total แสดงตัวเลขไทย ๒,๓๐๐ พอยต์ทอง", "A5 Gold-lock: acknowledge checkbox ก่อนเลือกร้าน"],
  },
  {
    step: 6,
    actor: "WeeeR", actorColor: "bg-orange-100 text-orange-800",
    screenId: "R-10", screenName: "REPAIR-ASSIGN-TECH",
    route: "/repair/jobs/[id]/assign", port: 3001,
    action: `ร้านมอบหมาย ${SAMPLE.tech} ออกเดินทาง [state: traveling]`,
    stateAfter: "traveling",
    xapp: [
      { actor: "WeeeU", screenId: "U-04", screenName: "REPAIR-DETAIL", route: `/repair/${SAMPLE.jobId}`, port: 3002 },
      { actor: "WeeeT", screenId: "T-04", screenName: "(jobs list + pickup en-route)", route: "/jobs", port: 3003 },
    ],
  },
  {
    step: 7,
    actor: "WeeeU", actorColor: "bg-weeeu-surface text-weeeu-dark",
    screenId: "U-09c", screenName: "REPAIR-APPROVE-ENTRY",
    route: `/repair/${SAMPLE.jobId}/approve-entry`, port: 3002,
    action: "ช่างถึงบ้าน [state: arrived] → ลูกค้ากด 'อนุมัติให้เข้าหน้างาน' → [state: inspecting]",
    stateAfter: "inspecting",
    xapp: [
      { actor: "WeeeT", screenId: "T-02", screenName: "DIAGNOSE", route: "/jobs/[id]/diagnose", port: 3003 },
      { actor: "WeeeR", screenId: "R-11", screenName: "REPAIR-JOB-DETAIL (arrived)", route: "/repair/jobs/[id]", port: 3001 },
    ],
    navTo: "U-04 REPAIR-DETAIL",
  },
  {
    step: 8,
    actor: "WeeeT", actorColor: "bg-green-100 text-green-800",
    screenId: "T-02→T-03→T-15→T-38",
    screenName: "DIAGNOSE → IN-PROGRESS → SUCCESS → POST-REPAIR",
    route: "/jobs/[id]/diagnose", port: 3003,
    action: "WeeeT: T-02 บันทึกผลวินิจฉัย → T-03 ซ่อมในขั้นตอนต่างๆ → T-15 ซ่อมสำเร็จ → T-38 post-repair [state: completed]",
    stateAfter: "completed → awaiting_review",
    xapp: [
      { actor: "WeeeR", screenId: "R-11", screenName: "REPAIR-JOB-DETAIL (in-progress)", route: "/repair/jobs/[id]", port: 3001 },
      { actor: "WeeeU", screenId: "U-06", screenName: "REPAIR-PROGRESS (60→100%)", route: `/repair/${SAMPLE.jobId}/progress`, port: 3002 },
    ],
    tier1: ["D1: รูปหลักฐาน after-repair fallback → placeholder"],
  },
  {
    step: 9,
    actor: "WeeeU", actorColor: "bg-weeeu-surface text-weeeu-dark",
    screenId: "U-09", screenName: "REPAIR-REVIEW",
    route: `/repair/${SAMPLE.jobId}/review`, port: 3002,
    action: "ลูกค้าตรวจรับ + ให้ดาว 5 ดาว + ความคิดเห็น → submit → state: closed ✅",
    stateAfter: "closed ✅",
    xapp: [
      { actor: "WeeeR", screenId: "R-11", screenName: "REPAIR-JOB-DETAIL (closed)", route: "/repair/jobs/[id]", port: 3001 },
      { actor: "Admin", screenId: "A-21", screenName: "REPAIR-ANALYTICS", route: "/repair/analytics", port: 3000 },
    ],
    navTo: "U-02 REPAIR-HOME (back to list)",
    tier1: ["A1: review submit → success state/notification"],
  },
];

const ACTOR_LABEL: Record<string, string> = {
  WeeeU: "WeeeU (ลูกค้า)",
  WeeeR: "WeeeR (ร้านซ่อม)",
  WeeeT: "WeeeT (ช่าง)",
  Admin: "Admin",
  System: "System",
};

export default function C6OnsiteHappyPathPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* §5 mock-anno-origin */}
      <div className="mock-anno mock-anno-origin">
        ◀ มาจาก: <code>repair/mockup</code> (Case Index)
      </div>

      {/* Back */}
      <Link href="/repair/mockup" className="text-gray-500 hover:text-gray-800 text-sm flex items-center gap-1">
        ‹ กลับ Case Index
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="bg-weeeu-surface text-weeeu-dark font-bold px-3 py-1 rounded-full text-sm font-mono">C6</span>
          <h1 className="text-xl font-bold text-gray-900">ONSITE Happy Path</h1>
        </div>
        <p className="text-xs text-gray-500">บริการ: 🏠 ช่างไปบ้าน (ONSITE) · ไม่มี B1/B2 branch · เคสหลักของโมดูล Repair</p>
      </div>

      {/* Sample data */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">📋 Sample Data</p>
        <p><span className="text-gray-400 w-32 inline-block">เครื่องใช้ไฟฟ้า</span>{SAMPLE.appliance}</p>
        <p><span className="text-gray-400 w-32 inline-block">อาการ</span>{SAMPLE.issue}</p>
        <p><span className="text-gray-400 w-32 inline-block">งบประมาณ</span>{SAMPLE.budget.toLocaleString()} พอยต์ทอง</p>
        <p><span className="text-gray-400 w-32 inline-block">ร้านที่เลือก</span>{SAMPLE.weeer}</p>
        <p><span className="text-gray-400 w-32 inline-block">ราคาที่ตกลง</span>{SAMPLE.quotedPrice.toLocaleString()} พอยต์ทอง</p>
        <p><span className="text-gray-400 w-32 inline-block">พอยต์ทองที่ล็อก</span>{SAMPLE.goldLocked.toLocaleString()} พอยต์ทอง (ราคา + deposit)</p>
        <p><span className="text-gray-400 w-32 inline-block">นัดหมาย</span>{SAMPLE.scheduledAt}</p>
        <p><span className="text-gray-400 w-32 inline-block">สถานที่</span>{SAMPLE.location}</p>
      </div>

      {/* Tier-1 lens */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">🎯 Lens Tier-1 ที่ต้องผ่าน</p>
        <ul className="text-xs text-amber-700 space-y-1">
          <li>• <strong>B3</strong> Escrow ราคาแสดงเป็นตัวเลขไทย: ๑,๘๐๐ พอยต์ทอง</li>
          <li>• <strong>D1</strong> รูปภาพ fallback → placeholder ไม่ broken</li>
          <li>• <strong>A4</strong> WeeeU color theme (#0DC36C เขียวมรกต)</li>
          <li>• <strong>A8</strong> U-38 = success page หลัง submit U-03</li>
          <li>• <strong>A3</strong> ปุ่ม ‹ Back ทุกจอ (U-03, U-05, U-04, U-09c, U-09)</li>
          <li>• <strong>A1</strong> Review submit → success notification → state:closed</li>
          <li>• <strong>A7</strong> ทุก mockup จอมี sample data จริง (appliance+shop+price)</li>
        </ul>
      </div>

      {/* Flow steps */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Flow ({FLOW.length} ขั้นตอน)</h2>
        {FLOW.map(step => (
          <div key={step.step} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start gap-4">
              {/* Step number */}
              <div className="w-8 h-8 bg-weeeu-primary text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                {step.step}
              </div>
              <div className="flex-1 space-y-2">
                {/* Actor + Screen */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${step.actorColor}`}>
                    {ACTOR_LABEL[step.actor] ?? step.actor}
                  </span>
                  <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">{step.screenId}</code>
                  <a
                    href={`http://localhost:${step.port}${step.route}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-weeeu-primary underline font-medium"
                  >
                    {step.screenName}
                  </a>
                </div>

                {/* Action */}
                <p className="text-sm text-gray-700">{step.action}</p>

                {/* State after */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">State after:</span>
                  <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{step.stateAfter}</span>
                </div>

                {/* §6 nav */}
                {step.navTo && (
                  <div className="mock-anno mock-anno-nav">
                    §6 nav: → <code>{step.navTo}</code>
                  </div>
                )}

                {/* §8 cross-app */}
                {step.xapp && step.xapp.length > 0 && (
                  <div className="mock-anno mock-anno-xapp">
                    <p className="font-semibold mb-1">§8 👁 แอพฯอื่น ณ จังหวะนี้:</p>
                    <ul className="space-y-0.5">
                      {step.xapp.map((x, i) => (
                        <li key={i}>
                          <span className="opacity-70">{x.actor}:</span>{" "}
                          <a href={`http://localhost:${x.port}${x.route}`} target="_blank" rel="noopener noreferrer">
                            <code>{x.screenId}</code> {x.screenName}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tier-1 lens at this step */}
                {step.tier1 && step.tier1.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                    <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">🎯 Lens check:</p>
                    {step.tier1.map((l, i) => (
                      <p key={i} className="text-[10px] text-amber-600">• {l}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-weeeu-surface border border-weeeu-dark rounded-2xl p-5">
        <p className="text-sm font-bold text-weeeu-dark mb-2">✅ C6 ONSITE สำเร็จ — สรุป</p>
        <ul className="text-xs text-weeeu-text space-y-1">
          <li>• Escrow ปลดล็อก → โอน {SAMPLE.quotedPrice.toLocaleString()} พอยต์ทอง ให้ {SAMPLE.weeer}</li>
          <li>• WeeeU ได้รับ 5-star review confirmation</li>
          <li>• รหัสงาน: {SAMPLE.jobId} · state: closed</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Link href="/repair/mockup" className="text-sm text-gray-500 hover:text-gray-800 underline">← Case Index</Link>
        <Link href="/repair/mockup/c4-scrap" className="text-sm text-weeeu-primary hover:text-weeeu-dark underline">C4 Scrap (B2 branch) →</Link>
        <Link href="/repair/mockup/c9-dispute" className="text-sm text-weeeu-primary hover:text-weeeu-dark underline">C9 Dispute →</Link>
      </div>
    </div>
  );
}
