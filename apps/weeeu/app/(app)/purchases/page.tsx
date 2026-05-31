import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "รายการที่ซื้อ" };

// Mock buyer purchases (Mockup — Phase D-2 ดึงจาก orders API จริง)
type Purchase = {
  id: string;
  name: string;
  price: number;
  seller: string;
  date: string;
  status: string;
  statusColor: string;
};

const MOCK_PURCHASES: Purchase[] = [
  { id: "p001", name: "แอร์ Daikin 12000 BTU มือสอง", price: 4200, seller: "ร้านดีเจริญ", date: "25 พ.ค. 2569", status: "📦 รอจัดส่ง", statusColor: "bg-blue-50 text-blue-700" },
  { id: "p002", name: "ตู้เย็น Sharp 2 ประตู", price: 3500, seller: "สมชาย ร้านมือสอง", date: "20 พ.ค. 2569", status: "🔍 รอตรวจสภาพ", statusColor: "bg-amber-50 text-amber-700" },
  { id: "p003", name: "เครื่องซักผ้า LG 7kg", price: 2800, seller: "ร้านบ้านไฟฟ้า", date: "12 พ.ค. 2569", status: "✅ สำเร็จ", statusColor: "bg-green-50 text-green-700" },
];

export default function PurchasesPage() {
  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">รายการที่ซื้อ</h1>
        <Link href="/marketplace" className="text-sm text-weeeu-primary hover:text-weeeu-dark font-medium">
          ตลาดมือสอง →
        </Link>
      </div>

      {MOCK_PURCHASES.length === 0 ? (
        /* Empty state (G1) */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center space-y-3">
          <p className="text-4xl">🛍️</p>
          <p className="text-sm text-gray-500">ยังไม่มีรายการที่ซื้อ</p>
          <Link href="/marketplace" className="inline-block text-sm text-weeeu-primary font-medium hover:underline">
            เริ่มเลือกซื้อสินค้ามือสอง →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {MOCK_PURCHASES.map((p) => (
            <Link
              key={p.id}
              href={`/purchases/${p.id}`}
              className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-weeeu-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">ผู้ขาย {p.seller} · {p.date}</p>
                  <p className="text-sm font-bold text-weeeu-primary mt-1">{p.price.toLocaleString()} ฿</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${p.statusColor}`}>
                  {p.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
