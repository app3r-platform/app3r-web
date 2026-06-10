"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { ScrapItem } from "@/lib/types";

/* ─── mock fallback — ลบตอน Phase 4 (TD-06) ─── */
const MOCK_SCRAP_ITEMS: ScrapItemExtended[] = [
  {
    id: "SCR-001", sellerId: "USR-1001", sellerType: "WeeeU",
    applianceId: "APP-5501",
    conditionGrade: "grade_A", workingParts: ["คอมเพรสเซอร์", "พัดลม", "บอร์ดควบคุม"],
    description: "แอร์ Daikin 12,000 BTU ปี 2021 ใช้งานปกติ ชิ้นส่วนครบ",
    photos: [], price: 3500, status: "available",
    createdAt: "2026-05-10T08:00:00Z", updatedAt: "2026-05-10T08:00:00Z",
    source_repair_job_id: null,
  },
  {
    id: "SCR-002", sellerId: "USR-1002", sellerType: "WeeeU",
    applianceId: "APP-5502",
    conditionGrade: "grade_B", workingParts: ["มอเตอร์", "แผงควบคุม"],
    description: "เครื่องซักผ้า Samsung 8 กก. เสียกลอง ส่วนอื่นสมบูรณ์",
    photos: [], price: 1200, status: "available",
    createdAt: "2026-05-12T09:30:00Z", updatedAt: "2026-05-12T09:30:00Z",
    source_repair_job_id: "RPJ-2201",
  },
  {
    id: "SCR-003", sellerId: "USR-1003", sellerType: "WeeeU",
    conditionGrade: "grade_C", workingParts: [],
    description: "ตู้เย็น LG ฝาแตก คอยล์รั่ว เหมาะส่งทำลาย E-Waste เท่านั้น",
    photos: [], price: 500, status: "sold",
    createdAt: "2026-05-14T11:00:00Z", updatedAt: "2026-05-15T10:00:00Z",
    source_repair_job_id: null,
  },
  {
    id: "SCR-004", sellerId: "USR-1004", sellerType: "WeeeU",
    conditionGrade: "grade_A", workingParts: ["ตัวแปลงไฟ", "จอ LCD", "แผงวงจร"],
    description: "ทีวี Sony 43 นิ้ว ป้ายแตก ชิ้นส่วนภายในดี",
    photos: [], price: 2800, status: "removed",
    createdAt: "2026-05-16T07:00:00Z", updatedAt: "2026-05-17T08:00:00Z",
    source_repair_job_id: null,
  },
  {
    id: "SCR-005", sellerId: "USR-1005", sellerType: "WeeeU",
    conditionGrade: "grade_B", workingParts: ["บอร์ดหลัก", "ปั๊มน้ำ"],
    description: "เครื่องล้างจาน Bosch 6 ชุด ปุ่มกดชำรุด ส่วนกลไกทำงานดี",
    photos: [], price: 1800, status: "available",
    createdAt: "2026-05-18T13:00:00Z", updatedAt: "2026-05-18T13:00:00Z",
    source_repair_job_id: null,
  },
];

/* ─── S5/S6: extended status (mock — ไม่อยู่ใน ScrapItem type เดิม) ─── */
type ExtendedStatus = ScrapItem["status"] | "expired" | "no_offer";

const STATUS_META: Record<ExtendedStatus, { label: string; color: string }> = {
  available: { label: "ขายได้",              color: "bg-green-50 text-green-700"  },
  sold:      { label: "ขายแล้ว",             color: "bg-blue-50 text-blue-700"   },
  removed:   { label: "ลบแล้ว",              color: "bg-gray-100 text-gray-500"  },
  /* S5 */ expired:  { label: "⚪ หมดอายุ",    color: "bg-gray-100 text-gray-500"  },
  /* S6 */ no_offer: { label: "⛔ ไม่มีข้อเสนอ", color: "bg-orange-50 text-orange-700" },
};

/* S12 — extended listing with cross-module repair reference */
interface ScrapItemExtended extends ScrapItem {
  source_repair_job_id?: string | null;
}

const GRADE_META: Record<ScrapItem["conditionGrade"], { label: string; color: string }> = {
  grade_A: { label: "A", color: "bg-green-50 text-green-700" },
  grade_B: { label: "B", color: "bg-yellow-50 text-yellow-700" },
  grade_C: { label: "C", color: "bg-red-50 text-red-700" },
};

const PAGE_SIZE = 20;

interface ScrapListResponse {
  results: ScrapItemExtended[];
  count: number;
}

/* Status tabs — S5/S6 เพิ่ม */
const STATUS_TABS: { label: string; value: string }[] = [
  { label: "ทั้งหมด",       value: "" },
  { label: "ขายได้",        value: "available" },
  { label: "ขายแล้ว",       value: "sold" },
  { label: "ลบแล้ว",        value: "removed" },
  { label: "⚪ หมดอายุ",    value: "expired" },
  { label: "⛔ ไม่มีข้อเสนอ", value: "no_offer" },
];

function EmptyState({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={9} className="px-6 py-10 text-center text-gray-500">{message}</td>
    </tr>
  );
}

export default function ScrapListingsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ScrapItemExtended[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSeller, setFilterSeller] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(filterStatus && { status: filterStatus }),
        ...(filterGrade  && { condition_grade: filterGrade }),
        ...(filterSeller && { seller_id: filterSeller }),
      });
      const d = await api.get<ScrapListResponse>("/admin/scrap/items/?" + params);
      setItems(d.results);
      setTotal(d.count);
    } catch (e: unknown) {
      if ((e as Error).message === "UNAUTHORIZED") { router.push("/login"); return; }
      console.warn("[mock fallback]", e);
      setItems(MOCK_SCRAP_ITEMS);
      setTotal(MOCK_SCRAP_ITEMS.length);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterGrade, filterSeller, router]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function clearFilters() {
    setFilterStatus(""); setFilterGrade(""); setFilterSeller(""); setPage(1);
  }

  const hasFilters = filterStatus || filterGrade || filterSeller;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">♻️ รายการซาก</h1>
            <p className="text-gray-500 text-sm mt-1">
              รายการซากเครื่องใช้ไฟฟ้าทั้งหมด — กรองตามสถานะ / เกรด / ผู้ขาย
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/scrap/jobs"
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
              🔨 Jobs →
            </Link>
          </div>
        </div>

        {/* Status tabs — S5: expired / S6: no_offer */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200 w-fit flex-wrap">
          {STATUS_TABS.map(t => (
            <button key={t.value}
              onClick={() => { setFilterStatus(t.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                filterStatus === t.value
                  ? t.value === "expired"  ? "bg-gray-200 text-gray-600"
                  : t.value === "no_offer" ? "bg-orange-50 text-orange-700"
                  : "bg-admin-surface text-admin-primary"
                  : "text-gray-500 hover:text-gray-900"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Secondary Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <select
            value={filterGrade}
            onChange={e => { setFilterGrade(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-36 focus:outline-none focus:border-admin-primary">
            <option value="">ทุกเกรด</option>
            <option value="grade_A">Grade A</option>
            <option value="grade_B">Grade B</option>
            <option value="grade_C">Grade C</option>
          </select>
          <input type="text" placeholder="Seller ID"
            value={filterSeller} onChange={e => { setFilterSeller(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 w-44 focus:outline-none focus:border-admin-primary"
          />
          {hasFilters && (
            <button onClick={clearFilters}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 bg-gray-100 rounded-lg">
              ล้าง filter
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between text-sm text-gray-500">
            <span>พบ {total.toLocaleString()} รายการ</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-2 py-1 rounded bg-gray-100 disabled:opacity-40 hover:bg-gray-200">‹</button>
                <span>{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-2 py-1 rounded bg-gray-100 disabled:opacity-40 hover:bg-gray-200">›</button>
              </div>
            )}
          </div>

          {loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-200">
                  <th className="px-4 py-3">Seller</th>
                  <th className="px-4 py-3">รายละเอียด</th>
                  <th className="px-4 py-3">เกรด</th>
                  <th className="px-4 py-3">Part ที่ใช้ได้</th>
                  <th className="px-4 py-3">ราคา</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3">วันที่สร้าง</th>
                  <th className="px-4 py-3">Flags</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.length === 0 ? (
                  <EmptyState message="ยังไม่มีรายการซาก" />
                ) : items.map(item => {
                  const sm = STATUS_META[item.status as ExtendedStatus] ?? STATUS_META.available;
                  const gm = GRADE_META[item.conditionGrade];
                  return (
                    <tr key={item.id} className="hover:bg-gray-100/40">
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">{item.sellerId}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {item.photos[0] && (
                            <img src={item.photos[0]} alt="" className="w-8 h-8 object-cover rounded bg-gray-100" />
                          )}
                          {/* S12 badge */}
                          {item.source_repair_job_id && (
                            <span className="text-xs px-1.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full whitespace-nowrap">
                              🔧 จาก Repair
                            </span>
                          )}
                          <span className="text-sm text-gray-800 max-w-xs truncate">{item.description}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${gm.color}`}>{gm.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {item.workingParts.length > 0
                          ? item.workingParts.slice(0, 3).join(", ") + (item.workingParts.length > 3 ? "…" : "")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-green-600">
                        {item.price.toLocaleString()} ฿
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString("th-TH")}
                      </td>
                      {/* Flags: S5/S6/S12 */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {(item.status as ExtendedStatus) === "expired" && (
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full whitespace-nowrap">⚪ หมดอายุ</span>
                          )}
                          {(item.status as ExtendedStatus) === "no_offer" && (
                            <span className="text-xs px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded-full whitespace-nowrap">⛔ ไม่มีข้อเสนอ</span>
                          )}
                          {item.source_repair_job_id && (
                            <Link href={`/repair/jobs/${item.source_repair_job_id}`}
                              className="text-xs px-1.5 py-0.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-full whitespace-nowrap transition-colors">
                              🔧 →Repair
                            </Link>
                          )}
                          {(item.status as ExtendedStatus) !== "expired" && (item.status as ExtendedStatus) !== "no_offer" && !item.source_repair_job_id && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/scrap/listings/${item.id}`}
                          className="text-xs text-admin-primary hover:text-admin-dark whitespace-nowrap">
                          ดู →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
