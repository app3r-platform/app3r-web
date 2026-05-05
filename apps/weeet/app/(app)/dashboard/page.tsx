"use client";
import { useAuth } from "@/lib/auth-context";
import { JobCard } from "@/components/JobCard";
import { todayJobs, upcomingJobs, mockJobs } from "@/lib/mock-data";
import Link from "next/link";

export default function DashboardPage() {
  const { auth } = useAuth();
  const tech = auth.technician;

  const completedToday = mockJobs.filter(
    (j) => j.scheduledAt.startsWith("2026-05-02") && j.status === "completed"
  ).length;

  return (
    <div className="px-4 pt-5 pb-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">สวัสดี 👋</p>
          <h1 className="text-xl font-bold text-white">{tech?.name}</h1>
          <p className="text-xs text-gray-500">{tech?.shopName}</p>
        </div>
        <Link href="/profile">
          <div className="w-11 h-11 rounded-full bg-orange-600 flex items-center justify-center text-xl font-bold">
            {tech?.name?.[0] ?? "ช"}
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
          <p className="text-2xl font-bold text-orange-400">{todayJobs.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">งานวันนี้</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
          <p className="text-2xl font-bold text-green-400">{completedToday}</p>
          <p className="text-xs text-gray-400 mt-0.5">เสร็จแล้ว</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
          <p className="text-2xl font-bold text-blue-400">{upcomingJobs.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">คิวหน้า</p>
        </div>
      </div>

      {/* Today's Jobs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white">งานวันนี้</h2>
          <Link href="/jobs" className="text-orange-400 text-sm hover:text-orange-300">
            ดูทั้งหมด →
          </Link>
        </div>
        {todayJobs.length > 0 ? (
          <div className="space-y-3">
            {todayJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-gray-400 text-sm">ไม่มีงานวันนี้</p>
          </div>
        )}
      </div>

      {/* Upcoming */}
      {upcomingJobs.length > 0 && (
        <div>
          <h2 className="font-semibold text-white mb-3">คิวหน้า</h2>
          <div className="space-y-3">
            {upcomingJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-white mb-3">ทางลัด</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/jobs">
            <div className="bg-gray-800 border border-gray-700 hover:border-orange-600 rounded-xl p-4 text-center transition-colors">
              <span className="text-2xl">📋</span>
              <p className="text-sm text-gray-300 mt-1 font-medium">รายการงาน</p>
            </div>
          </Link>
          <Link href="/parts">
            <div className="bg-gray-800 border border-gray-700 hover:border-orange-600 rounded-xl p-4 text-center transition-colors">
              <span className="text-2xl">📦</span>
              <p className="text-sm text-gray-300 mt-1 font-medium">อะไหล่</p>
            </div>
          </Link>
          <Link href="/reports">
            <div className="bg-gray-800 border border-gray-700 hover:border-orange-600 rounded-xl p-4 text-center transition-colors">
              <span className="text-2xl">📊</span>
              <p className="text-sm text-gray-300 mt-1 font-medium">รายงาน</p>
            </div>
          </Link>
          <Link href="/settings">
            <div className="bg-gray-800 border border-gray-700 hover:border-orange-600 rounded-xl p-4 text-center transition-colors">
              <span className="text-2xl">⚙️</span>
              <p className="text-sm text-gray-300 mt-1 font-medium">ตั้งค่า</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
