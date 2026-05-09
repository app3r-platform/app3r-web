"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface TopUser {
  userId: string;
  userName?: string;
  userType: "WeeeU" | "WeeeR";
  count: number;
  totalValue: number;
}

interface ResellAnalytics {
  total_listings: number;
  active_listings: number;
  completed_transactions: number;
  total_gmv: number;               // Gross Merchandise Value
  total_gp: number;                // GP from transaction fee
  avg_transaction_value: number;
  conversion_rate: number;         // views → offers → sales (0-1)
  offer_acceptance_rate: number;   // offers → selected (0-1)
  by_status: Record<string, number>;
  by_listing_type: Record<string, number>;
  by_seller_type: Record<string, number>;
  top_sellers: TopUser[];
  top_buyers: TopUser[];
  disputed_count: number;
  dispute_rate: number;            // 0-1
}

function StatCard({ label, value, sub, highlight }: {
  label: string; value: string; sub?: string; highlight?: boolean;
}) {
  return (
    <div className={`bg-gray-900 rounded-xl border p-5 ${highlight ? "border-blue-800/50" : "border-gray-800"}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? "text-blue-300" : "text-white"}`}>{value}</p>
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
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">{value.toLocaleString()}{suffix} ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  announced:         "ประกาศ",
  receiving_offers:  "รับ Offer",
  offer_selected:    "เลือก Offer",
  buyer_confirmed:   "Buyer ยืนยัน",
  in_progress:       "กำลังดำเนินการ",
  delivered:         "ส่งแล้ว",
  inspection_period: "ตรวจสอบ",
  completed:         "เสร็จสิ้น",
  cancelled:         "ยกเลิก",
  disputed:          "พิพาท",
};

const STATUS_COLOR: Record<string, string> = {
  announced:         "bg-gray-500",
  receiving_offers:  "bg-blue-500",
  offer_selected:    "bg-indigo-500",
  buyer_confirmed:   "bg-cyan-500",
  in_progress:       "bg-yellow-500",
  delivered:         "bg-teal-500",
  inspection_period: "bg-purple-500",
  completed:         "bg-green-500",
  cancelled:         "bg-gray-600",
  disputed:          "bg-red-500",
};

export default function ResellAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<ResellAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    api.get<ResellAnalytics>("/admin/resell/analytics/")
      .then(d => { setData(d); setError(null); })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar /><main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
    </div>
  );

  if (error || !data) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-4">
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400">
          ระบบ Resell กำลังพัฒนา — {error ?? "ไม่พบข้อมูล"}
        </div>
        <Link href="/resell/listings" className="text-sm text-blue-400 hover:text-blue-300">← Listings</Link>
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📊 Resell Analytics</h1>
            <p className="text-gray-400 text-sm mt-1">
              สรุปภาพรวม Resell — listings / transactions / conversion / GP
            </p>
          </div>
          <Link href="/resell/listings"
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            🛍️ Listings →
          </Link>
        </div>

        {/* KPI row 1 — volume */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Listings ทั้งหมด"
            value={data.total_listings.toLocaleString()}
            sub={`Active ${data.active_listings.toLocaleString()}`}
          />
          <StatCard
            label="ธุรกรรมเสร็จสิ้น"
            value={data.completed_transactions.toLocaleString()}
            highlight
          />
          <StatCard
            label="GMV รวม"
            value={`${data.total_gmv.toLocaleString()} ฿`}
            sub={`เฉลี่ย ${data.avg_transaction_value.toLocaleString()} ฿/รายการ`}
          />
          <StatCard
            label="GP (Platform Fee)"
            value={`${data.total_gp.toLocaleString()} ฿`}
            sub="จาก transaction fee"
          />
        </div>

        {/* KPI row 2 — rates */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Conversion funnel */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 lg:col-span-1">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              🔄 Conversion Funnel
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Offer Acceptance Rate</span>
                  <span className={`font-mono font-bold ${data.offer_acceptance_rate >= 0.3 ? "text-green-400" : data.offer_acceptance_rate >= 0.15 ? "text-yellow-400" : "text-red-400"}`}>
                    {(data.offer_acceptance_rate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(data.offer_acceptance_rate * 100, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Sales Conversion Rate</span>
                  <span className={`font-mono font-bold ${data.conversion_rate >= 0.2 ? "text-green-400" : data.conversion_rate >= 0.1 ? "text-yellow-400" : "text-red-400"}`}>
                    {(data.conversion_rate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(data.conversion_rate * 100, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Dispute Rate</span>
                  <span className={`font-mono font-bold ${data.dispute_rate > 0.05 ? "text-red-400" : data.dispute_rate > 0.02 ? "text-yellow-400" : "text-green-400"}`}>
                    {(data.dispute_rate * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(data.dispute_rate * 100 * 10, 100)}%` }} />
                </div>
                <div className="text-xs text-gray-600 mt-0.5">{data.disputed_count} รายการพิพาท</div>
              </div>
            </div>
          </div>

          {/* By listing type */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ประเภท Listing</h2>
            <div className="space-y-3">
              <BarRow label="มือสอง (used_appliance)" value={data.by_listing_type["used_appliance"] ?? 0}
                total={data.total_listings} color="bg-blue-500" />
              <BarRow label="ซาก (scrap)" value={data.by_listing_type["scrap"] ?? 0}
                total={data.total_listings} color="bg-orange-500" />
            </div>
            <div className="mt-4 space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Seller Type</h3>
              <BarRow label="WeeeU" value={data.by_seller_type["WeeeU"] ?? 0}
                total={data.total_listings} color="bg-sky-500" />
              <BarRow label="WeeeR" value={data.by_seller_type["WeeeR"] ?? 0}
                total={data.total_listings} color="bg-emerald-500" />
            </div>
          </div>

          {/* By status */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">สถานะ (10-state)</h2>
            <div className="space-y-2.5">
              {Object.entries(data.by_status)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => (
                  <BarRow key={k}
                    label={STATUS_LABEL[k] ?? k}
                    value={v}
                    total={data.total_listings}
                    color={STATUS_COLOR[k] ?? "bg-gray-500"}
                  />
                ))}
            </div>
          </div>
        </div>

        {/* Top sellers + buyers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">🏆 Top Sellers</h2>
            {data.top_sellers.length === 0 ? (
              <p className="text-sm text-gray-600">ยังไม่มีข้อมูล</p>
            ) : (
              <div className="space-y-2.5">
                {data.top_sellers.slice(0, 8).map((u, i) => (
                  <div key={u.userId} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-5 text-right shrink-0">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs">
                        <span className={`font-medium ${u.userType === "WeeeU" ? "text-sky-400" : "text-green-400"}`}>
                          {u.userName ?? u.userId.slice(0, 8)} ({u.userType})
                        </span>
                        <span className="text-gray-400">{u.count} listings</span>
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{u.totalValue.toLocaleString()} ฿</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">🏆 Top Buyers</h2>
            {data.top_buyers.length === 0 ? (
              <p className="text-sm text-gray-600">ยังไม่มีข้อมูล</p>
            ) : (
              <div className="space-y-2.5">
                {data.top_buyers.slice(0, 8).map((u, i) => (
                  <div key={u.userId} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-5 text-right shrink-0">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs">
                        <span className={`font-medium ${u.userType === "WeeeU" ? "text-sky-400" : "text-green-400"}`}>
                          {u.userName ?? u.userId.slice(0, 8)} ({u.userType})
                        </span>
                        <span className="text-gray-400">{u.count} ซื้อ</span>
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{u.totalValue.toLocaleString()} ฿</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

      </main>
    </div>
  );
}
