import Link from "next/link";

// ── Repair Module · Mockup Case Index ────────────────────────────────────────
// P2 flow: 55-case module-level overview — HUB Gen 52 CMD · base da0e3a9
// C1-C10 ครบทุกเคส + M5 Hybrid B  (ข้ามแอพฯ จนจบงาน)
// ─────────────────────────────────────────────────────────────────────────────

type CaseEntry = {
  slug: string;
  code: string;
  title: string;
  desc: string;
  method: string;
  steps: number;
  color: string;
};

const CASES: CaseEntry[] = [
  {
    slug: "c1-walkin",
    code: "C1",
    title: "Walk-in / DROP_OFF",
    desc: "ลูกค้านำเครื่องไปส่งที่ร้านซ่อมด้วยตนเอง ร้านซ่อม ตรวจ/ซ่อม → ลูกค้ามารับ",
    method: "DROP_OFF",
    steps: 9,
    color: "bg-blue-50 border-blue-200 text-blue-800",
  },
  {
    slug: "c2-pickup",
    code: "C2",
    title: "Pickup / Delivery",
    desc: "WeeeT ออกไปรับเครื่องถึงบ้าน → ซ่อมที่ร้าน → WeeeT ส่งคืน",
    method: "PICKUP_DELIVERY",
    steps: 10,
    color: "bg-teal-50 border-teal-200 text-teal-800",
  },
  {
    slug: "c3-parcel",
    code: "C3",
    title: "Parcel / Shipping",
    desc: "ลูกค้าส่งเครื่องไปรษณีย์ → ร้านรับ ซ่อม → ส่งคืนไปรษณีย์",
    method: "SHIPPING",
    steps: 9,
    color: "bg-orange-50 border-orange-200 text-orange-800",
  },
  {
    slug: "c4-scrap",
    code: "C4",
    title: "Scrap Conversion (B2 accept)",
    desc: "ซ่อมไม่คุ้ม → WeeeR เสนอซาก (B2.2) → ลูกค้าตกลงขายซาก",
    method: "ONSITE",
    steps: 7,
    color: "bg-amber-50 border-amber-200 text-amber-800",
  },
  {
    slug: "c5-reprice",
    code: "C5",
    title: "Re-price Accept (B1 accept)",
    desc: "ต้องอะไหล่เพิ่ม → WeeeR เสนอราคาใหม่ (B1.2) → ลูกค้าตกลง → ซ่อมต่อ",
    method: "ONSITE",
    steps: 9,
    color: "bg-yellow-50 border-yellow-200 text-yellow-800",
  },
  {
    slug: "c6-onsite",
    code: "C6",
    title: "ONSITE Happy Path",
    desc: "ช่างไปบ้าน ตรวจ/ซ่อมเสร็จ ไม่มี branch decision — เคสหลักของโมดูล",
    method: "ONSITE",
    steps: 9,
    color: "bg-weeeu-surface border-weeeu-dark text-weeeu-dark",
  },
  {
    slug: "c7-cancel",
    code: "C7",
    title: "Cancel (before assignment)",
    desc: "ลูกค้ายกเลิกประกาศก่อนที่ WeeeR จะรับงาน → Escrow ปลดล็อกคืน",
    method: "ONSITE",
    steps: 4,
    color: "bg-gray-50 border-gray-300 text-gray-700",
  },
  {
    slug: "c8-abandoned",
    code: "C8",
    title: "Walk-in Abandoned",
    desc: "ซ่อมเสร็จแล้วแต่ลูกค้าไม่มารับเกินกำหนด → WeeeR เก็บค่าฝาก",
    method: "DROP_OFF",
    steps: 6,
    color: "bg-red-50 border-red-200 text-red-800",
  },
  {
    slug: "c9-dispute",
    code: "C9",
    title: "Dispute (Admin Intervene)",
    desc: "WeeeU ไม่พอใจผล → เปิด Dispute → Admin ตรวจสอบ ตัดสิน",
    method: "ONSITE",
    steps: 9,
    color: "bg-purple-50 border-purple-200 text-purple-800",
  },
  {
    slug: "c10-b1reject",
    code: "C10",
    title: "B1 Reject → Cancel",
    desc: "WeeeR เสนอราคาใหม่ (B1.2) → ลูกค้าปฏิเสธ → งานยกเลิก ค่าตรวจถูกหัก",
    method: "ONSITE",
    steps: 6,
    color: "bg-rose-50 border-rose-200 text-rose-800",
  },
  {
    slug: "m5-hybrid-b",
    code: "M5B",
    title: "M5 Hybrid B — in-place Repair",
    desc: "เครื่องที่กำลังบำรุง (Maintain) พบปัญหาเพิ่ม → WeeeR เสนอซ่อม in-place ต่อ escrow เดิม",
    method: "ONSITE",
    steps: 7,
    color: "bg-indigo-50 border-indigo-200 text-indigo-800",
  },
];

const METHOD_LABEL: Record<string, string> = {
  ONSITE: "🏠 ช่างไปบ้าน",
  DROP_OFF: "🏪 ส่งที่ร้าน",
  PICKUP_DELIVERY: "🚗 รับ-ส่งถึงบ้าน",
  SHIPPING: "📦 ส่งไปรษณีย์",
};

export default function RepairMockupIndexPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* mock-anno §5 origin */}
      <div className="mock-anno mock-anno-origin">
        ◀ มาจาก: <code>repair/mockup</code> — Repair Module Case Index · P2 HUB Gen 52
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Repair Module · Case Flow Index</h1>
        <p className="text-sm text-gray-500 mt-1">
          55-case flow · C1–C10 ครบทุกเคส + M5 Hybrid B · annotation mock-anno §5/§6/§8 · Lens Tier-1
        </p>
      </div>

      {/* App port reference */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs space-y-1 font-mono">
        <p className="font-sans text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">🔗 App Ports (localhost)</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          <span><strong>WeeeU</strong> → :3002 (ลูกค้า)</span>
          <span><strong>WeeeR</strong> → :3001 (ร้านซ่อม)</span>
          <span><strong>WeeeT</strong> → :3003 (ช่าง)</span>
          <span><strong>Admin</strong> → :3000</span>
          <span><strong>Website</strong> → :3004</span>
        </div>
      </div>

      {/* Tier-1 Lens quick reference */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">🎯 Lens Tier-1 (ทุกเคสต้องผ่าน)</p>
        <ul className="text-xs text-amber-700 space-y-1">
          <li><strong>B1</strong> WeeeR เสนอราคาสูงกว่างบ → B1 re-pricing decision</li>
          <li><strong>B2</strong> WeeeR ซ่อมไม่คุ้ม → B2 scrap offer decision</li>
          <li><strong>B3</strong> Escrow แสดงเป็นตัวเลขไทย (เช่น ๑,๘๐๐ พอยต์ทอง)</li>
          <li><strong>D1</strong> รูปภาพ fallback → placeholder ไม่ broken</li>
          <li><strong>A4</strong> Color theme = weeeu-primary (#0DC36C)</li>
          <li><strong>A8</strong> ทุก action มี success page / success state</li>
          <li><strong>A3</strong> ปุ่ม Back (‹) ทุกจอ</li>
          <li><strong>A1</strong> ทุก action → success page ก่อน next step</li>
          <li><strong>A7</strong> มี sample data ทุกเคส</li>
        </ul>
      </div>

      {/* Case cards */}
      <div className="space-y-3">
        {CASES.map(c => (
          <Link
            key={c.slug}
            href={`/repair/mockup/${c.slug}`}
            className={`block rounded-2xl border-2 p-5 hover:shadow-md transition-all ${c.color}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm font-mono">{c.code}</span>
                  <span className="font-semibold text-base">{c.title}</span>
                </div>
                <p className="text-xs opacity-80">{c.desc}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-medium">{METHOD_LABEL[c.method] ?? c.method}</span>
                  <span className="text-xs opacity-60">{c.steps} ขั้นตอน</span>
                </div>
              </div>
              <span className="text-lg">→</span>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center pb-6">
        P2 Mockup · Repair Module · HUB Gen 52 · base da0e3a9
      </p>
    </div>
  );
}
