import type { Metadata } from "next";

export const metadata: Metadata = { title: "จัดการ WeeeT — WeeeR" };

const WEETS = [
  { id: "w1", name: "นายสมชาย ช่างดี",   email: "somchai@shop.com",  mode: "mode1_auto",   status: "active",             rentalExpiry: null },
  { id: "w2", name: "นายวิทยา ซ่อมเก่ง",  email: "wittaya@shop.com",  mode: "mode2_rental", status: "active",             rentalExpiry: "2027-04-15" },
  { id: "w3", name: "นายประยุทธ์ แก้ไว", email: "prayuth@shop.com",  mode: "mode2_rental", status: "awaiting_approval",  rentalExpiry: null },
];

const STATUS_STYLE: Record<string, string> = {
  active:            "bg-green-100 text-green-700",
  awaiting_approval: "bg-yellow-100 text-yellow-700",
  suspended_by_weeer:"bg-red-100 text-red-600",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Active", awaiting_approval: "รออนุมัติ", suspended_by_weeer: "ระงับแล้ว",
};

export default function StaffPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">จัดการทีมช่าง (WeeeT)</h1>
          <p className="text-sm text-gray-500 mt-0.5">Mode 1 ฟรี 1 ตัว | Mode 2 เช่ารายปี (5,000 Gold/ปี)</p>
        </div>
        <button className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
          👷 เพิ่ม WeeeT (Mode 2)
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
        <span className="shrink-0">ℹ️</span>
        <div>
          <strong>Login as WeeeT (Impersonation):</strong> ทุกการกระทำถูกบันทึกใน Audit Log
          Session หมดอายุอัตโนมัติใน 30 นาที — ห้าม Login ซ้อน (nested)
        </div>
      </div>

      {/* WeeeT Cards */}
      <div className="grid gap-4">
        {WEETS.map((w) => (
          <div key={w.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-lg font-bold text-green-700 shrink-0">
                {w.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{w.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[w.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABEL[w.status] ?? w.status}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${w.mode === "mode1_auto" ? "bg-gray-100 text-gray-600" : "bg-yellow-100 text-yellow-700"}`}>
                    {w.mode === "mode1_auto" ? "Mode 1 (ฟรี)" : "Mode 2 (เช่า)"}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-0.5">{w.email}</div>
                {w.rentalExpiry && (
                  <div className="text-xs text-yellow-600 mt-0.5">หมดอายุ: {w.rentalExpiry}</div>
                )}
                {w.status === "awaiting_approval" && (
                  <div className="text-xs text-yellow-600 mt-0.5">⏳ รอ Admin อนุมัติคำขอ WeeeT</div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Login as WeeeT */}
                <button
                  disabled={w.status !== "active"}
                  className="flex items-center gap-1.5 text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-green-50 hover:border-green-300 hover:text-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Login as WeeeT — Impersonation per CMD-015b"
                >
                  🔐 Login as
                </button>
                {/* Suspend */}
                {w.status === "active" && (
                  <button className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
                    ⏸ ระงับ
                  </button>
                )}
                {/* Audit Log */}
                <button className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-500">
                  📜 Log
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Impersonation info box */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-orange-800 mb-1">🟠 Impersonation (Login as WeeeT) — CMD-015b</p>
        <ul className="text-xs text-orange-700 space-y-1 list-disc list-inside">
          <li>WeeeR login as WeeeT ได้เฉพาะ WeeeT ที่เป็นของร้านตัวเอง</li>
          <li>Session มี timeout 30 นาที (ค่า default)</li>
          <li>Audit log บันทึกทุก action ระหว่าง session</li>
          <li>ห้าม nested impersonation</li>
          <li>แสดง banner สีส้ม ตลอดระหว่าง impersonation session</li>
        </ul>
      </div>
    </div>
  );
}
