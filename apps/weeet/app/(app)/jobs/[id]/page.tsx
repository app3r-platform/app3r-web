"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mockJobs } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const job = mockJobs.find((j) => j.id === id);

  const [steps, setSteps] = useState(job?.steps ?? []);

  if (!job) {
    return (
      <div className="px-4 pt-5 text-center space-y-4">
        <p className="text-4xl">❓</p>
        <p className="text-gray-400">ไม่พบงานนี้</p>
        <button onClick={() => router.back()} className="text-orange-400 underline text-sm">
          ← กลับ
        </button>
      </div>
    );
  }

  const toggleStep = (stepId: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s))
    );
  };

  const progress = steps.filter((s) => s.done).length;
  const progressPct = Math.round((progress / steps.length) * 100);

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white text-lg"
        >
          ←
        </button>
        <div className="flex-1">
          <p className="text-xs text-gray-400">{job.jobNo}</p>
          <h1 className="font-bold text-white leading-tight">{job.serviceType}</h1>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Customer Info */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-3">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <span>👤</span> ข้อมูลลูกค้า
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-16">ชื่อ</span>
              <span className="text-white font-medium">{job.customer.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-16">โทร</span>
              <a href={`tel:${job.customer.phone}`} className="text-orange-400 hover:text-orange-300">
                {job.customer.phone}
              </a>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-16">ที่อยู่</span>
              <span className="text-gray-300 flex-1">{job.customer.address}</span>
            </div>
          </div>
          {/* Map placeholder */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg h-32 flex flex-col items-center justify-center gap-1">
            <span className="text-2xl">🗺️</span>
            <p className="text-xs text-gray-500">แผนที่นำทาง (Google Maps)</p>
            <button className="text-xs text-orange-400 hover:text-orange-300 border border-orange-800 px-3 py-1 rounded-full mt-1">
              เปิดใน Maps
            </button>
          </div>
        </div>

        {/* Service Notes */}
        {job.notes && (
          <div className="bg-yellow-950/50 border border-yellow-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-yellow-300 mb-1">📋 หมายเหตุ</h2>
            <p className="text-yellow-100 text-sm">{job.notes}</p>
          </div>
        )}

        {/* Steps */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <span>📝</span> ขั้นตอนบริการ
            </h2>
            <span className="text-xs text-gray-400">{progress}/{steps.length}</span>
          </div>
          {/* Progress */}
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="space-y-2">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => toggleStep(step.id)}
                className="w-full flex items-center gap-3 text-left hover:bg-gray-700/50 rounded-lg px-2 py-1.5 transition-colors"
              >
                <span className={`text-lg flex-shrink-0 ${step.done ? "opacity-100" : "opacity-30"}`}>
                  {step.done ? "✅" : "⬜"}
                </span>
                <span className={`text-sm ${step.done ? "text-gray-400 line-through" : "text-white"}`}>
                  {step.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <span>📸</span> รูปภาพ
            </h2>
            <Link
              href={`/jobs/${job.id}/photo`}
              className="text-xs text-orange-400 hover:text-orange-300 border border-orange-800 px-3 py-1 rounded-full"
            >
              + ถ่ายรูป
            </Link>
          </div>
          {job.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {job.photos.map((photo, i) => (
                <div key={i} className="relative bg-gray-900 rounded-lg overflow-hidden aspect-square flex items-center justify-center border border-gray-700">
                  <span className="text-3xl">🖼️</span>
                  <span className="absolute bottom-1 left-1 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded">
                    {photo.type === "before" ? "ก่อน" : "หลัง"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">ยังไม่มีรูปภาพ</p>
              <Link
                href={`/jobs/${job.id}/photo`}
                className="inline-block mt-2 text-orange-400 text-sm hover:text-orange-300"
              >
                ถ่ายรูปก่อน/หลังซ่อม →
              </Link>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {job.status === "assigned" && (
            <button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-xl transition-colors">
              🚀 เริ่มงาน
            </button>
          )}
          {job.status === "in_progress" && (
            <button className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors">
              ✅ ทำเสร็จแล้ว
            </button>
          )}
          <button className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl border border-gray-700 transition-colors text-sm">
            📦 ขอเบิกอะไหล่
          </button>
        </div>
      </div>
    </div>
  );
}
