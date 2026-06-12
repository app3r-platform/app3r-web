"use client";

import { use, useState } from "react";
import Link from "next/link";

const STAFF_OPTIONS = [
  { value: "", label: "— เลือกช่าง —" },
  { value: "tech-001", label: "สมชาย (ช่างอาวุโส)" },
  { value: "tech-002", label: "สมหมาย (ช่างทั่วไป)" },
  { value: "tech-003", label: "สมศรี (ช่างใหม่)" },
];

const STEPS = [
  { label: "รับคิว", done: true },
  { label: "มอบหมาย", done: true },
  { label: "กำลังซ่อม", active: true },
];

export default function RepairWalkInDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [selectedStaff, setSelectedStaff] = useState("tech-001");
  const assignedTech = STAFF_OPTIONS.find((s) => s.value === "tech-001");

  return (
    <div className="space-y-5 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/repair/walk-in/queue" className="text-gray-400 hover:text-gray-600">←</Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">ลูกค้าหน้าร้าน (Walk-in) #{id}</h1>
            <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
              🟢 กำลังดำเนินการ
            </span>
          </div>
        </div>
      </div>

      {/* Customer queue card */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ข้อมูลคิว</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-gray-400">เวลารับคิว</p>
            <p className="text-sm font-medium text-gray-800">10:32 น.</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">คิวที่</p>
            <p className="text-sm font-medium text-gray-800">4</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">ประมาณรอ</p>
            <p className="text-sm font-medium text-gray-800">20 นาที</p>
          </div>
        </div>
      </div>

      {/* Appliance */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">เครื่องใช้ไฟฟ้า</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">ประเภท</p>
            <p className="text-sm font-medium text-gray-800">🌀 เครื่องปรับอากาศ Daikin</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">อาการ</p>
            <p className="text-sm font-medium text-gray-800">ไม่เย็น</p>
          </div>
        </div>
      </div>

      {/* Assign technician */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">มอบหมายช่าง</p>
        <div className="flex items-center gap-3">
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF8B66]"
          >
            {STAFF_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {assignedTech && (
            <span className="shrink-0 text-xs bg-green-100 text-green-700 font-medium px-3 py-1.5 rounded-full">
              {assignedTech.label.split(" (")[0]} ✓
            </span>
          )}
        </div>
      </div>

      {/* Work status tracker */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">สถานะงาน</p>
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                    ${step.done ? "bg-green-600 text-white" : step.active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}
                >
                  {step.done ? "✓" : step.active ? "●" : i + 1}
                </div>
                <p className={`text-xs mt-1 whitespace-nowrap ${step.done ? "text-green-700" : step.active ? "text-blue-700 font-semibold" : "text-gray-400"}`}>
                  {step.label}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-4 ${step.done ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href={`/repair/jobs/c001`}
          className="flex-1 block text-center bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors"
        >
          📋 ดูรายละเอียดงาน
        </Link>
        <button className="border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 px-4 rounded-xl text-sm">
          ✅ ส่งมอบสำเร็จ + OTP
        </button>
      </div>
    </div>
  );
}
