"use client";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { repairApi } from "@/lib/api";
import type { RepairJob } from "@/lib/types";

export default function DeliveryCompletedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<RepairJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    repairApi.getJob(id).then(setJob).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-6 space-y-5">
      {/* Success banner */}
      <div className="bg-green-950/60 border border-green-700 rounded-2xl p-6 text-center space-y-3">
        <p className="text-5xl">✅</p>
        <h1 className="text-green-300 text-xl font-bold">ส่งมอบเครื่องเรียบร้อย!</h1>
        <p className="text-green-200 text-sm">งาน Pickup เสร็จสมบูรณ์</p>
      </div>

      {/* Job summary */}
      {job && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
          <h2 className="font-semibold text-white text-sm">📋 สรุปงาน</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">เลขงาน</span>
              <span className="text-gray-200 font-mono">{job.job_no}</span>
            </div>
            {job.customer_name && (
              <div className="flex justify-between">
                <span className="text-gray-400">ลูกค้า</span>
                <span className="text-gray-200">{job.customer_name}</span>
              </div>
            )}
            {job.appliance_name && (
              <div className="flex justify-between">
                <span className="text-gray-400">เครื่อง</span>
                <span className="text-gray-200">{job.appliance_name}</span>
              </div>
            )}
            {job.final_price != null && (
              <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
                <span className="text-gray-400 font-semibold">ราคา</span>
                <span className="text-green-300 font-bold text-base">
                  ฿{job.final_price.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Earnings note */}
      <div className="bg-yellow-950/40 border border-yellow-800/60 rounded-xl p-4 text-sm">
        <p className="text-yellow-300 font-semibold mb-1">💰 ค่าแรงงาน</p>
        <p className="text-yellow-200 text-xs">
          ระบบจะคำนวณค่าแรงงานและโอนเข้าบัญชีภายใน 3-5 วันทำการ
        </p>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <button
          onClick={() => router.push("/jobs")}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          📋 กลับหน้ารายการงาน
        </button>
        <button
          onClick={() => router.push("/")}
          className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-3 rounded-xl transition-colors"
        >
          🏠 กลับหน้าหลัก
        </button>
      </div>
    </div>
  );
}
