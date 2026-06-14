"use client";
// ─── ค่าบริการ & ธุรกรรม (/wallet) — T-14 · WeeeT (ช่าง) · DARK theme · mockup-only
// CMD #117-F-2 (Advisor Gen 117): WeeeT ไม่ถือ point-wallet · view-only เท่านั้น
//  - ไม่มี flow เติม/ถอน · ไม่มี balance card แบบ wallet holder
//  - ค่าบริการ (service fee) ชำระให้ร้าน (WeeeR) ที่ช่างสังกัด — ช่างดูได้อย่างเดียว
//  - แสดงต่อ "งานที่ตนรับผิดชอบ": ค่าบริการ + ค่าอะไหล่ + รายละเอียดธุรกรรม (read-only)

import { useState } from "react";
import { useRouter } from "next/navigation";

type JobStatus = "in_progress" | "completed" | "cancelled";
type FilterKey = "all" | "in_progress" | "completed" | "cancelled";

// Mock data (Mockup — ไม่ fetch API จริง) · integer/บาท ทั้งหมด
// แต่ละงาน = งานที่ช่างรับผิดชอบ พร้อมค่าบริการ (service fee) + ค่าอะไหล่ (parts cost)
const MOCK_JOBS: {
  id: string;
  title: string;
  status: JobStatus;
  statusLabel: string;
  serviceFee: number;
  partsCost: number;
  date: string;
}[] = [
  { id: "JOB-2041", title: "ซ่อมแอร์ไม่เย็น — ต.ในเมือง", status: "in_progress", statusLabel: "กำลังซ่อม", serviceFee: 450, partsCost: 280, date: "3 มิ.ย. 69" },
  { id: "JOB-2038", title: "เปลี่ยนคอมเพรสเซอร์ตู้เย็น", status: "completed", statusLabel: "ซ่อมเสร็จ", serviceFee: 600, partsCost: 1250, date: "1 มิ.ย. 69" },
  { id: "JOB-2033", title: "ตรวจเครื่องซักผ้าไม่ปั่น", status: "completed", statusLabel: "ปิดงาน", serviceFee: 350, partsCost: 0, date: "28 พ.ค. 69" },
  { id: "JOB-2029", title: "ติดตั้งเครื่องทำน้ำอุ่น", status: "in_progress", statusLabel: "กำลังซ่อม", serviceFee: 400, partsCost: 150, date: "27 พ.ค. 69" },
];

// รายละเอียดธุรกรรม (transaction detail) — read-only · ผูกกับงาน
// kind: service = ค่าบริการ (เข้าร้าน WeeeR) · parts = ค่าอะไหล่
const MOCK_TX: {
  id: string;
  jobId: string;
  kind: "service" | "parts";
  label: string;
  amount: number;
  date: string;
}[] = [
  { id: "TX-2041-S", jobId: "JOB-2041", kind: "service", label: "ค่าบริการงานซ่อม — เข้าร้าน (WeeeR)", amount: 450, date: "3 มิ.ย. 69" },
  { id: "TX-2041-P", jobId: "JOB-2041", kind: "parts", label: "ค่าอะไหล่ — น้ำยาแอร์ R32", amount: 280, date: "3 มิ.ย. 69" },
  { id: "TX-2038-S", jobId: "JOB-2038", kind: "service", label: "ค่าบริการงานซ่อม — เข้าร้าน (WeeeR)", amount: 600, date: "1 มิ.ย. 69" },
  { id: "TX-2038-P", jobId: "JOB-2038", kind: "parts", label: "ค่าอะไหล่ — คอมเพรสเซอร์", amount: 1250, date: "1 มิ.ย. 69" },
  { id: "TX-2033-S", jobId: "JOB-2033", kind: "service", label: "ค่าบริการงานซ่อม — เข้าร้าน (WeeeR)", amount: 350, date: "28 พ.ค. 69" },
];

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "in_progress", label: "กำลังดำเนินการ" },
  { key: "completed", label: "เสร็จสิ้น" },
  { key: "cancelled", label: "ยกเลิก" },
];

const baht = (n: number) => "฿" + n.toLocaleString("th-TH");

export default function WalletPage() {
  const router = useRouter();
  // filter = view-only (กรองการแสดงผลเท่านั้น — ไม่ทำธุรกรรมใดๆ)
  const [filter, setFilter] = useState<FilterKey>("all");

  const filteredJobs = MOCK_JOBS.filter((j) =>
    filter === "all" ? true : j.status === filter,
  );

  // สรุปยอด (read-only) — คำนวณจากงานที่กรองอยู่
  const totalService = filteredJobs.reduce((s, j) => s + j.serviceFee, 0);
  const totalParts = filteredJobs.reduce((s, j) => s + j.partsCost, 0);

  return (
    <div className="pb-6">
      {/* Header + back nav */}
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white text-lg"
          aria-label="ย้อนกลับ"
        >
          ←
        </button>
        <h1 className="font-bold text-white">ค่าบริการ &amp; ธุรกรรม</h1>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* View-only context banner — ช่างไม่ถือพอยต์เอง */}
        <div className="bg-sky-900/40 border border-sky-700 rounded-2xl px-4 py-3">
          <p className="text-sm text-sky-200 font-medium">👁️ อ่านอย่างเดียว (View-only)</p>
          <p className="text-xs text-sky-300/80 mt-1 leading-relaxed">
            หน้านี้แสดงค่าบริการ (Service Fee) และค่าอะไหล่ (Parts) ของงานที่คุณรับผิดชอบ
            ค่าบริการชำระเข้าร้าน (WeeeR) ที่คุณสังกัด — ช่าง (WeeeT) ไม่ได้ถือพอยต์เอง
            จึงไม่มีการเติม/ถอน
          </p>
        </div>

        {/* Summary strip (read-only) */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3 text-center">
            <p className="text-xs text-gray-400">จำนวนงาน</p>
            <p className="text-xl font-bold text-white mt-0.5">{filteredJobs.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3 text-center">
            <p className="text-xs text-gray-400">ค่าบริการรวม</p>
            <p className="text-xl font-bold text-weeet-primary mt-0.5">{baht(totalService)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3 text-center">
            <p className="text-xs text-gray-400">ค่าอะไหล่รวม</p>
            <p className="text-xl font-bold text-amber-400 mt-0.5">{baht(totalParts)}</p>
          </div>
        </div>

        {/* Filter tabs (view-only) */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === f.key
                  ? "bg-weeet-primary text-white"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* งานที่ตนรับผิดชอบ — ค่าบริการ + ค่าอะไหล่ ต่องาน (read-only) */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-white">งานที่รับผิดชอบ</h2>

          {filteredJobs.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl text-center py-10">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-gray-400 text-sm">ไม่มีงานในหมวดนี้</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{job.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{job.id} · {job.date}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md flex-shrink-0 ${
                      job.status === "completed"
                        ? "bg-green-900/60 text-green-300"
                        : job.status === "cancelled"
                          ? "bg-red-900/60 text-red-300"
                          : "bg-sky-900/60 text-sky-300"
                    }`}
                  >
                    {job.statusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-800/60 rounded-xl px-3 py-2">
                    <p className="text-xs text-gray-400">ค่าบริการ (Service Fee)</p>
                    <p className="text-sm font-bold text-weeet-primary mt-0.5">{baht(job.serviceFee)}</p>
                  </div>
                  <div className="bg-gray-800/60 rounded-xl px-3 py-2">
                    <p className="text-xs text-gray-400">ค่าอะไหล่ (Parts)</p>
                    <p className="text-sm font-bold text-amber-400 mt-0.5">{baht(job.partsCost)}</p>
                  </div>
                </div>

                {/* link ไปดูรายละเอียดงาน (หน้าเดิม read-only) — ไม่มีปุ่มทำธุรกรรม */}
                <button
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  className="w-full text-center text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-xl py-2 transition-colors"
                >
                  ดูรายละเอียดงาน →
                </button>
              </div>
            ))
          )}
        </div>

        {/* รายละเอียดธุรกรรม (transaction detail) — read-only ล้วน */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <h2 className="text-base font-semibold text-white mb-4">รายละเอียดธุรกรรม (Transaction)</h2>

          <div className="space-y-1">
            {MOCK_TX.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 py-2.5 border-b border-gray-800 last:border-0"
              >
                <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {tx.kind === "service" ? "🧾" : "🔧"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{tx.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-500">{tx.date}</p>
                    <span className="text-xs text-gray-500">· {tx.jobId}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-md ${
                        tx.kind === "service"
                          ? "bg-sky-900/40 text-sky-300"
                          : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {tx.kind === "service" ? "ค่าบริการ" : "ค่าอะไหล่"}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-200 flex-shrink-0">
                  {baht(tx.amount)}
                </span>
              </div>
            ))}

            {MOCK_TX.length === 0 && (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-gray-400 text-sm">ยังไม่มีธุรกรรม</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
