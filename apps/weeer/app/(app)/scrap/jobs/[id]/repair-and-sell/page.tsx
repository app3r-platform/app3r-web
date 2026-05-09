"use client";

import { use } from "react";
import Link from "next/link";

export default function RepairAndSellPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href={`/scrap/jobs/${id}`} className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">🛠 ซ่อมขาย</h1>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center space-y-3">
        <div className="text-4xl">🚧</div>
        <p className="text-base font-semibold text-yellow-800">ฟีเจอร์นี้จะเปิดใช้งานใน Phase C-3.3</p>
        <p className="text-sm text-yellow-700">
          การซ่อมขาย (repair_and_sell) ต้องเชื่อมกับ RepairJob module
          ซึ่งจะพัฒนาใน C-3.3 ตาม D64
        </p>
      </div>

      <Link href={`/scrap/jobs/${id}`}
        className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-3 rounded-xl transition-colors">
        ← กลับไปเลือกวิธีอื่น
      </Link>
    </div>
  );
}
