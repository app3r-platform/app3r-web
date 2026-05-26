"use client";

import { useState } from "react";
import Link from "next/link";

const STEPS = [
  { label: "รับพัสดุ", done: true },
  { label: "ตรวจสภาพ", active: true },
  { label: "แจ้งผล", done: false },
  { label: "ซ่อม", done: false },
];

export default function RepairParcelDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [photoTaken, setPhotoTaken] = useState(false);

  return (
    <div className="space-y-5 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/repair/parcel/queue" className="text-gray-400 hover:text-gray-600">←</Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">พัสดุซ่อม #{id}</h1>
            <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
              📦 รับพัสดุแล้ว
            </span>
          </div>
        </div>
      </div>

      {/* Tracking card */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ข้อมูลพัสดุ</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">หมายเลขพัสดุ</p>
            <p className="text-sm font-medium text-gray-800">TH-7834-2026-0044</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">ผู้ส่ง</p>
            <p className="text-sm font-medium text-gray-800">ลูกค้า #U-5523</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">วันที่รับ</p>
            <p className="text-sm font-medium text-gray-800">25 พ.ค. 2569</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">น้ำหนัก</p>
            <p className="text-sm font-medium text-gray-800">12 กก.</p>
          </div>
        </div>
      </div>

      {/* Appliance */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">เครื่องใช้ไฟฟ้า</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">ประเภท</p>
            <p className="text-sm font-medium text-gray-800">🫧 เครื่องซักผ้า LG</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400">อาการ (จากใบแนบ)</p>
            <p className="text-sm font-medium text-gray-800">ไม่ปั่นหนี แต่ซักได้</p>
          </div>
        </div>
      </div>

      {/* Status tracker */}
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
      <div className="space-y-3">
        <button
          onClick={() => setPhotoTaken(true)}
          className={`w-full font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors
            ${photoTaken
              ? "border border-green-300 text-green-700 bg-green-50"
              : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          {photoTaken ? "✅ ถ่ายรูปแล้ว" : "📸 ถ่ายรูปเปิดกล่อง (บันทึกสภาพ)"}
        </button>
        <Link
          href={`/repair/jobs/c001/assign`}
          className="w-full block text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors"
        >
          🔧 มอบหมายช่าง
        </Link>
      </div>
    </div>
  );
}
