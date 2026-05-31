"use client";

import Link from "next/link";
import { Sidebar } from "@/components/sidebar";

/* ─── local types (Mockup — Lesson #33) ─── */
interface TopUser {
  id:         string;
  name:       string;
  userType:   "WeeeU" | "WeeeR";
  count:      number;
  totalValue: number;
}

/* ─── Mock analytics data (12 เคส R1-R12) ─── */
const MOCK: {
  total_listings:           number;
  active_listings:          number;
  completed_transactions:   number;
  cancelled_count:          number;
  total_gmv:                number;
  total_gp:                 number;
  avg_transaction_value:    number;
  conversion_rate:          number;
  offer_acceptance_rate:    number;
  disputed_count:           number;
  dispute_rate:             number;
  dispute_resolution: Record<string, number>;
  by_status:          Record<string, number>;
  by_seller_type:     Record<string, number>;
  by_pair:            Record<string, number>;
  escrow_locked_count: number;
  escrow_locked_value: number;
  top_sellers: TopUser[];
  top_buyers:  TopUser[];
} = {
  total_listings:          12,
  active_listings:          7,
  completed_transactions:   1,
  cancelled_count:          1,
  total_gmv:            8500,
  total_gp:              425,
  avg_transaction_value: 8500,
  conversion_rate:       0.083,
  offer_acceptance_rate: 0.25,
  disputed_count:        2,
  dispute_rate:          0.167,
  dispute_resolution: {
    to_buyer:  1,
    to_seller: 0,
    split:     1,
    pending:   0,
  },
  by_status: {
    announced:         1,
    receiving_offers:  1,
    offer_selected:    1,
    awaiting_payment:  1,
    buyer_confirmed:   1,
    in_progress:       1,
    delivered:         1,
    inspection_period: 1,
    completed:         1,
    cancelled:         1,
    disputed:          2,
  },
  by_seller_type: { WeeeU: 7, WeeeR: 5 },
  by_pair: {
    "U→U": 4,
    "U→R": 2,
    "R→U": 4,
    "R→R": 2,
  },
  escrow_locked_count: 4,
  escrow_locked_value: 31700,
  top_sellers: [
    { id: "s1", name: "ร้าน ColdAir",      userType: "WeeeR", count: 2, totalValue: 26700 },
    { id: "s2", name: "ร้าน CoolPro",       userType: "WeeeR", count: 1, totalValue: 18000 },
    { id: "s3", name: "นายสมชาย ใจดี",     userType: "WeeeU", count: 1, totalValue: 8500  },
    { id: "s4", name: "นายวิชัย มีทรัพย์",  userType: "WeeeU", count: 1, totalValue: 12000 },
    { id: "s5", name: "ร้าน AirPower",      userType: "WeeeR", count: 1, totalValue: 7200  },
  ],
  top_buyers: [
    { id: "b1", name: "นายวิฑูรย์ ใจเย็น", userType: "WeeeU", count: 1, totalValue: 14500 },
    { id: "b2", name: "นางมาลี สุขสวัสดิ์", userType: "WeeeU", count: 1, totalValue: 18000 },
    { id: "b3", name: "ร้าน TechFix",       userType: "WeeeR", count: 1, totalValue: 12000 },
    { id: "b4", name: "นางสาวอรุณ แสงทอง", userType: "WeeeU", count: 1, totalValue: 8500  },
  ],
};

/* ─── shared components ─── */
function StatCard({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${accent ?? "border-gray-200"}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function BarRow({ label, value, total, color, suffix = "" }: {
  label: string; value: number; total: number; color: string; suffix?: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">{value.toLocaleString()}{suffix} ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  announced:         "ประกาศ",
  receiving_offers:  "รับ Offer",
  offer_selected:    "เลือก Offer",
  awaiting_payment:  "รอชำระ",
  buyer_confirmed:   "Buyer ยืนยัน",
  in_progress:       "กำลังดำเนิน",
  delivered:         "ส่งแล้ว",
  inspection_period: "ตรวจสอบ",
  completed:         "เสร็จสิ้น",
  cancelled:         "ยกเลิก",
  disputed:          "พิพาท",
};

const STATUS_COLOR: Record<string, string> = {
  announced:         "bg-gray-400",
  receiving_offers:  "bg-admin-primary",
  offer_selected:    "bg-admin-surface0",
  awaiting_payment:  "bg-yellow-500",
  buyer_confirmed:   "bg-cyan-500",
  in_progress:       "bg-brand-info",
  delivered:         "bg-admin-surface0",
  inspection_period: "bg-orange-500",
  completed:         "bg-green-500",
  cancelled:         "bg-gray-500",
  disputed:          "bg-red-500",
};

export default function ResellAnalyticsPage() {
  const d = MOCK;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📊 Resell Analytics</h1>
            <p className="text-gray-500 text-sm mt-1">
              ภาพรวม Resell — 12 เคส (R1-R12) / 4 คู่ / dispute 3-way
            </p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full">
              🔶 Mockup — ข้อมูลจำลอง 12 เคส
            </span>
          </div>
          <div className="flex gap-2">
            <Link href="/resell/fees"
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
              💰 Fees →
            </Link>
            <Link href="/resell/jobs"
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
              🔄 Jobs →
            </Link>
          </div>
        </div>

        {/* KPI Row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Listings ทั้งหมด"
            value={d.total_listings.toLocaleString()}
            sub={`Active ${d.active_listings} | ยกเลิก ${d.cancelled_count}`}
          />
          <StatCard
            label="ธุรกรรมเสร็จสิ้น"
            value={d.completed_transactions.toLocaleString()}
            accent="border-green-200"
          />
          <StatCard
            label="GMV รวม"
            value={`${d.total_gmv.toLocaleString()} G`}
            sub={`เฉลี่ย ${d.avg_transaction_value.toLocaleString()} G/รายการ`}
          />
          <StatCard
            label="GP (Platform Fee)"
            value={`${d.total_gp.toLocaleString()} G`}
            sub="~5% avg platform fee"
          />
        </div>

        {/* KPI Row 2 — Escrow + Dispute */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="🔒 พักเงินกลาง (Escrow)"
            value={d.escrow_locked_count.toLocaleString()}
            sub={`${d.escrow_locked_value.toLocaleString()} G locked`}
            accent="border-blue-200"
          />
          <StatCard
            label="⚖️ Dispute"
            value={d.disputed_count.toLocaleString()}
            sub={`Dispute Rate ${(d.dispute_rate * 100).toFixed(1)}%`}
            accent="border-red-200"
          />
          <StatCard
            label="Offer Acceptance"
            value={`${(d.offer_acceptance_rate * 100).toFixed(1)}%`}
            sub="offer → selected"
          />
          <StatCard
            label="Sales Conversion"
            value={`${(d.conversion_rate * 100).toFixed(1)}%`}
            sub="listings → completed"
          />
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* By status */}
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              สถานะ (10 state + disputed)
            </h2>
            {Object.entries(d.by_status)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <BarRow key={k}
                  label={STATUS_LABEL[k] ?? k}
                  value={v}
                  total={d.total_listings}
                  color={STATUS_COLOR[k] ?? "bg-gray-500"}
                />
              ))}
          </section>

          {/* By seller type + pair */}
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Seller Type
              </h2>
              <div className="space-y-2">
                <BarRow label="WeeeU (บุคคล)" value={d.by_seller_type["WeeeU"] ?? 0} total={d.total_listings} color="bg-sky-500" />
                <BarRow label="WeeeR (ร้าน)"  value={d.by_seller_type["WeeeR"] ?? 0} total={d.total_listings} color="bg-admin-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                4 คู่ (D-Resell-1)
              </h2>
              <div className="space-y-2">
                {Object.entries(d.by_pair).map(([pair, count]) => (
                  <BarRow key={pair} label={pair} value={count} total={d.total_listings}
                    color={pair === "U→U" ? "bg-sky-400" : pair === "U→R" ? "bg-admin-primary/70" : pair === "R→U" ? "bg-admin-primary" : "bg-admin-dark"} />
                ))}
              </div>
            </div>
          </section>

          {/* Dispute Resolution 3-way */}
          <section className="bg-white rounded-xl border border-red-200 p-5 space-y-3">
            <h2 className="text-xs font-semibold text-red-600 uppercase tracking-wider">
              ⚖️ Dispute Resolution (3-way)
            </h2>
            <div className="space-y-2">
              <BarRow label="🛒 ผู้ซื้อชนะ (to_buyer)"   value={d.dispute_resolution["to_buyer"]  ?? 0} total={d.disputed_count} color="bg-blue-500" />
              <BarRow label="🧑‍💼 ผู้ขายชนะ (to_seller)" value={d.dispute_resolution["to_seller"] ?? 0} total={d.disputed_count} color="bg-green-500" />
              <BarRow label="⚡ แบ่ง (split)"             value={d.dispute_resolution["split"]    ?? 0} total={d.disputed_count} color="bg-admin-surface0" />
              <BarRow label="⏳ รอตัดสิน (pending)"       value={d.dispute_resolution["pending"]  ?? 0} total={d.disputed_count} color="bg-gray-400" />
            </div>
            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Dispute Rate</span>
                <span className={`font-mono font-bold ${
                  d.dispute_rate >= 0.1 ? "text-red-600"
                  : d.dispute_rate >= 0.05 ? "text-yellow-700"
                  : "text-green-600"
                }`}>
                  {(d.dispute_rate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                <div className="h-full rounded-full bg-red-500"
                  style={{ width: `${Math.min(d.dispute_rate * 100 * 5, 100)}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                <Link href="/resell/disputes" className="text-admin-primary hover:text-admin-dark">
                  ดูรายการข้อพิพาท →
                </Link>
              </p>
            </div>
          </section>

        </div>

        {/* Top Sellers + Buyers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">🏆 Top Sellers</h2>
            <div className="space-y-2.5">
              {d.top_sellers.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs">
                      <span className={`font-medium ${u.userType === "WeeeR" ? "text-admin-primary" : "text-gray-700"}`}>
                        {u.name}
                        <span className="ml-1 opacity-60">({u.userType})</span>
                      </span>
                      <span className="text-gray-500">{u.count} รายการ</span>
                    </div>
                    <div className="text-xs font-mono text-green-600 mt-0.5">{u.totalValue.toLocaleString()} G</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">🏆 Top Buyers</h2>
            <div className="space-y-2.5">
              {d.top_buyers.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs">
                      <span className={`font-medium ${u.userType === "WeeeR" ? "text-admin-primary" : "text-gray-700"}`}>
                        {u.name}
                        <span className="ml-1 opacity-60">({u.userType})</span>
                      </span>
                      <span className="text-gray-500">{u.count} ซื้อ</span>
                    </div>
                    <div className="text-xs font-mono text-green-600 mt-0.5">{u.totalValue.toLocaleString()} G</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

      </main>
    </div>
  );
}
