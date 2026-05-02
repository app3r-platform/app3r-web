import type { Metadata } from "next";

export const metadata: Metadata = { title: "ประวัติ & รายงาน" };

const historyItems = [
  {
    id: "H001", type: "repair", icon: "🔧", title: "ซ่อมแอร์ห้องนอน",
    detail: "น้ำยาหมด + ล้างทำความสะอาด", amount: "฿1,200",
    date: "1 พ.ค. 69", status: "เสร็จแล้ว", statusColor: "text-green-600 bg-green-50",
    weeer: "ร้านเย็นสบาย AC Service",
  },
  {
    id: "H002", type: "resell", icon: "💰", title: "ขายพัดลม Panasonic",
    detail: "ขายให้ WeeeR", amount: "฿450",
    date: "28 เม.ย. 69", status: "เสร็จแล้ว", statusColor: "text-green-600 bg-green-50",
    weeer: "ร้านเครื่องใช้ไฟฟ้า สุขสันต์",
  },
  {
    id: "H003", type: "repair", icon: "🔧", title: "ซ่อมเครื่องซักผ้า",
    detail: "เปลี่ยนมอเตอร์ปั๊มน้ำ", amount: "฿850",
    date: "20 เม.ย. 69", status: "เสร็จแล้ว", statusColor: "text-green-600 bg-green-50",
    weeer: "บริษัท ซ่อมดี จำกัด",
  },
  {
    id: "H004", type: "scrap", icon: "♻️", title: "ทิ้งตู้เย็นเก่า (ฟรี)",
    detail: "ขนออก + ทำลายตามมาตรฐาน WEEE", amount: "฿0",
    date: "15 เม.ย. 69", status: "เสร็จแล้ว", statusColor: "text-green-600 bg-green-50",
    weeer: "ร้านรับซากเครื่องใช้ไฟฟ้า",
  },
  {
    id: "H005", type: "maintain", icon: "🛠️", title: "ล้างแอร์ห้องแขก",
    detail: "ล้างทำความสะอาดประจำปี", amount: "฿300",
    date: "1 เม.ย. 69", status: "เสร็จแล้ว", statusColor: "text-green-600 bg-green-50",
    weeer: "ร้านเย็นสบาย AC Service",
  },
];

const summaryStats = [
  { label: "รายการทั้งหมด", value: "12", icon: "📋", color: "bg-blue-50 text-blue-700" },
  { label: "ค่าใช้จ่ายรวม", value: "฿8,450", icon: "💸", color: "bg-red-50 text-red-700" },
  { label: "รายได้จากขาย", value: "฿1,250", icon: "💰", color: "bg-green-50 text-green-700" },
  { label: "Silver Point รับ", value: "+580", icon: "💎", color: "bg-gray-50 text-gray-700" },
];

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ประวัติ & รายงาน</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryStats.map((stat) => (
          <div key={stat.label} className={`rounded-2xl p-4 ${stat.color}`}>
            <p className="text-lg mb-1">{stat.icon}</p>
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs font-medium opacity-80 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <div className="flex gap-2 flex-1 overflow-x-auto">
          {["ทั้งหมด", "ซ่อม", "ซื้อ/ขาย", "ซาก", "บำรุงรักษา"].map((tab) => (
            <button
              key={tab}
              className={`flex-shrink-0 text-xs px-4 py-2 rounded-full font-medium transition-colors ${
                tab === "ทั้งหมด"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 flex-shrink-0">
          <option>เดือนนี้</option>
          <option>3 เดือน</option>
          <option>6 เดือน</option>
          <option>ปีนี้</option>
        </select>
      </div>

      {/* History list */}
      <div className="space-y-3">
        {historyItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:border-blue-100 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{item.detail}</p>
                    <p className="text-xs text-gray-400 mt-1">🏪 {item.weeer}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900">{item.amount}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.date}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">#{item.id}</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${item.statusColor}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Export */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-3">ออกรายงาน</h2>
        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            📄 PDF
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            📊 Excel
          </button>
        </div>
      </div>
    </div>
  );
}
