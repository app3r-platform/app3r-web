"use client";

import { useState } from "react";
import Link from "next/link";

const STAFF = [
  { id: "tech-001", name: "สมชาย", role: "ช่างอาวุโส", status: "ว่าง", rating: 4.9 },
  { id: "tech-002", name: "สมหมาย", role: "ช่างทั่วไป", status: "ว่าง", rating: 4.7 },
  { id: "tech-003", name: "สมศรี", role: "ช่างใหม่", status: "ว่างครึ่งวัน", rating: 4.5 },
];

export default function RepairJobAssignPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [selectedStaff, setSelectedStaff] = useState("");
  const [assigned, setAssigned] = useState(false);

  function handleAssign() {
    if (!selectedStaff) return;
    setAssigned(true);
  }

  if (assigned) {
    const tech = STAFF.find((s) => s.id === selectedStaff);
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <span className="text-4xl mb-3">👷</span>
        <p className="text-sm font-semibold text-green-700">มอบหมายช่างสำเร็จ</p>
        <p className="text-xs text-gray-400 mt-1">{tech?.name} รับงานแล้ว</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/repair/jobs/${id}`} className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">มอบหมายช่าง — งาน #{id}</h1>
      </div>

      {/* Job summary mini card */}
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌀</span>
          <p className="text-sm font-semibold text-gray-800">แอร์ Daikin FTKQ18TV2S</p>
        </div>
        <p className="text-xs text-gray-500">🗓 28 พ.ค. 2569 บ่าย · 🏠 On-site</p>
      </div>

      {/* Staff selection */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">เลือกช่าง</p>
        <div className="space-y-2">
          {STAFF.map((s) => (
            <label
              key={s.id}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                ${selectedStaff === s.id ? "border-green-400 bg-green-50" : "border-gray-100 hover:border-gray-200"}`}
            >
              <input
                type="radio"
                name="staff"
                value={s.id}
                checked={selectedStaff === s.id}
                onChange={() => setSelectedStaff(s.id)}
                className="accent-green-600"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                  <span className="text-xs text-gray-400">({s.role})</span>
                </div>
                <p className="text-xs text-gray-500">⭐ {s.rating}</p>
              </div>
              <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full
                ${s.status === "ว่าง" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {s.status}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleAssign}
        disabled={!selectedStaff}
        className={`w-full font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors
          ${selectedStaff
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
      >
        ✅ มอบหมาย
      </button>
    </div>
  );
}
