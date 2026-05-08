"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface LiveJob {
  id: string;
  job_number: string;
  weeet_name: string;
  weeet_phone: string;
  shop_name: string;
  customer_name: string;
  customer_address: string;
  device_model: string;
  status: string;
  direction: "shop_to_customer" | "customer_to_shop";
  current_lat: number | null;
  current_lng: number | null;
  eta_minutes: number | null;
  delay_minutes: number | null;
  last_location_at: string | null;
  picked_up_at: string | null;
}

interface DispatchMonitor {
  active_jobs: LiveJob[];
  total_active: number;
  total_delayed: number;
  last_updated: string;
}

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  assigned:          { label: "มอบหมายแล้ว",  color: "text-blue-300",   dot: "bg-blue-500" },
  en_route_pickup:   { label: "กำลังไปรับ",   color: "text-yellow-400", dot: "bg-yellow-500" },
  picked_up:         { label: "รับแล้ว",       color: "text-cyan-300",   dot: "bg-cyan-500" },
  en_route_delivery: { label: "กำลังส่ง",      color: "text-indigo-300", dot: "bg-indigo-500" },
  delivered:         { label: "ส่งแล้ว",       color: "text-teal-300",   dot: "bg-teal-500" },
};

const REFRESH_INTERVAL = 30_000; // 30 seconds

export default function DispatchMonitorPage() {
  const router = useRouter();
  const [data, setData] = useState<DispatchMonitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const fetchRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const d = await api.get<DispatchMonitor>("/admin/repair/pickup/dispatch-monitor");
      setData(d);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setCountdown(30);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }

    fetchData();

    // Auto-refresh every 30s
    fetchRef.current = setInterval(fetchData, REFRESH_INTERVAL);

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 30 : prev - 1));
    }, 1000);

    return () => {
      if (fetchRef.current) clearInterval(fetchRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [router, fetchData]);

  function manualRefresh() {
    setLoading(true);
    fetchData();
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">📡 Dispatch Monitor</h1>
              {/* Live pulse */}
              <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-900/30 border border-green-800/50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              ติดตาม WeeeT en-route real-time — รีเฟรชทุก 30 วินาที
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">รีเฟรชใน {countdown}s</span>
            <button onClick={manualRefresh}
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
              🔄 รีเฟรชเดี๋ยวนี้
            </button>
            <Link href="/repair/pickup/queue"
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
              ← Queue
            </Link>
          </div>
        </div>

        {/* Summary cards */}
        {data && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <p className="text-xs text-gray-500 mb-1">Active Jobs</p>
              <p className="text-3xl font-bold text-blue-400">{data.total_active}</p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <p className="text-xs text-gray-500 mb-1">มีความล่าช้า</p>
              <p className={`text-3xl font-bold ${data.total_delayed > 0 ? "text-red-400" : "text-green-400"}`}>
                {data.total_delayed}
              </p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <p className="text-xs text-gray-500 mb-1">อัพเดตล่าสุด</p>
              <p className="text-sm text-gray-300 mt-1">
                {data.last_updated
                  ? new Date(data.last_updated).toLocaleTimeString("th-TH")
                  : "—"}
              </p>
            </div>
          </div>
        )}

        {error ? (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400">{error}</div>
        ) : loading && !data ? (
          <p className="text-gray-500">กำลังโหลด...</p>
        ) : data && (
          <>
            {data.active_jobs.length === 0 ? (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-10 text-center text-gray-500">
                ไม่มี active jobs ขณะนี้
              </div>
            ) : (
              <div className="space-y-3">
                {data.active_jobs.map(job => {
                  const sm = STATUS_META[job.status] ?? { label: job.status, color: "text-gray-300", dot: "bg-gray-500" };
                  const isDelayed = (job.delay_minutes ?? 0) > 0;
                  const dirLabel = job.direction === "shop_to_customer" ? "ร้าน → ลูกค้า" : "ลูกค้า → ร้าน";

                  return (
                    <div key={job.id} className={`bg-gray-900 rounded-xl border p-5 transition-all ${
                      isDelayed ? "border-red-800/60" : "border-gray-800"
                    }`}>
                      <div className="flex items-start justify-between gap-4 flex-wrap">

                        {/* Left: Job info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Link href={`/repair/pickup/${job.id}`}
                              className="font-mono text-sm text-blue-400 hover:text-blue-300 font-bold">
                              {job.job_number}
                            </Link>
                            <span className={`flex items-center gap-1.5 text-xs ${sm.color}`}>
                              <span className={`w-2 h-2 rounded-full ${sm.dot}`} />
                              {sm.label}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              job.direction === "shop_to_customer"
                                ? "bg-teal-900/40 text-teal-300"
                                : "bg-purple-900/40 text-purple-300"
                            }`}>
                              {dirLabel}
                            </span>
                            {isDelayed && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/50 text-red-400">
                                ⚠️ ล่าช้า {job.delay_minutes} นาที
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                            <div>
                              <p className="text-gray-500">WeeeT</p>
                              <p className="text-gray-200 font-medium">{job.weeet_name}</p>
                              <p className="text-gray-500">{job.weeet_phone}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">ร้านซ่อม</p>
                              <p className="text-gray-200">{job.shop_name}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">ลูกค้า</p>
                              <p className="text-gray-200">{job.customer_name}</p>
                              <p className="text-gray-500 truncate max-w-[140px]">{job.customer_address}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">อุปกรณ์</p>
                              <p className="text-gray-200">{job.device_model}</p>
                            </div>
                          </div>
                        </div>

                        {/* Right: ETA + GPS */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {job.eta_minutes != null && (
                            <div className={`text-center px-4 py-2 rounded-xl border ${
                              isDelayed
                                ? "bg-red-900/20 border-red-800/50"
                                : "bg-green-900/20 border-green-800/50"
                            }`}>
                              <p className="text-xs text-gray-500">ETA</p>
                              <p className={`text-xl font-bold ${isDelayed ? "text-red-400" : "text-green-400"}`}>
                                {job.eta_minutes} <span className="text-sm font-normal">นาที</span>
                              </p>
                            </div>
                          )}
                          {job.current_lat != null && job.current_lng != null && (
                            <a href={`https://maps.google.com/?q=${job.current_lat},${job.current_lng}`}
                              target="_blank" rel="noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                              📍 ดูแผนที่
                            </a>
                          )}
                          {job.last_location_at && (
                            <p className="text-xs text-gray-600">
                              GPS: {new Date(job.last_location_at).toLocaleTimeString("th-TH")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
