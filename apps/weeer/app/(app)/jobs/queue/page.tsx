import type { Metadata } from "next";

export const metadata: Metadata = { title: "คิวงาน — WeeeR" };

const JOBS = [
  { id: "JOB-0501", type: "ซ่อม",  title: "ซ่อมแอร์บ้าน Mitsubishi 12K BTU",  customer: "สมชาย ใจดี",  status: "PENDING",      assigned: null },
  { id: "JOB-0500", type: "บำรุง", title: "บำรุงรักษาแอร์ประจำปี 3 ตัว",       customer: "ร้าน ABC",    status: "PENDING",      assigned: null },
  { id: "JOB-0499", type: "ซ่อม",  title: "ซ่อมตู้เย็น Samsung ใช้งานไม่ได้",  customer: "วิชัย มั่นใจ",status: "ASSIGNED",     assigned: "นายสมชาย ช่างดี" },
  { id: "JOB-0498", type: "ซาก",   title: "รับซื้อซากแอร์เก่า 5 ตัว",          customer: "ร้าน XYZ",   status: "IN_PROGRESS",  assigned: "นายวิทยา ซ่อมเก่ง" },
  { id: "JOB-0497", type: "บำรุง", title: "เช็คระบบทำความเย็นโรงงาน",           customer: "โรงงาน ABC", status: "COMPLETED",    assigned: "นายสมชาย ช่างดี" },
];

const STATUS_STYLE: Record<string, string> = {
  PENDING:     "bg-yellow-100 text-yellow-700",
  ASSIGNED:    "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  COMPLETED:   "bg-green-100 text-green-700",
  CANCELLED:   "bg-gray-100 text-gray-600",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "รอจัดสรร", ASSIGNED: "มอบหมายแล้ว", IN_PROGRESS: "กำลังดำเนิน", COMPLETED: "เสร็จแล้ว", CANCELLED: "ยกเลิก",
};

export default function JobQueuePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">คิวงาน</h1>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(STATUS_LABEL).map(([s, l]) => (
            <button key={s} className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700 transition-colors">{l}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {JOBS.map((j) => (
          <div key={j.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
            <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium shrink-0">{j.type}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{j.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {j.customer}
                {j.assigned && <span className="text-green-600"> · 👷 {j.assigned}</span>}
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${STATUS_STYLE[j.status]}`}>
              {STATUS_LABEL[j.status]}
            </span>
            {j.status === "PENDING" && (
              <button className="text-sm bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 rounded-lg transition-colors shrink-0">
                มอบหมาย
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
