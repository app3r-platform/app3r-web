"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface TrackingEvent {
  timestamp: string;
  location: string;
  description: string;
  status_code: string;
}

interface ParcelLeg {
  leg: "outbound" | "return";
  courier_name: string;
  tracking_number: string;
  shipped_at: string | null;
  delivered_at: string | null;
  events: TrackingEvent[];
}

interface ParcelPhoto {
  type: "packaging" | "shipping_label" | "received_at_shop" | "return_packaging" | "delivery_proof" | "damage";
  url: string;
  taken_at: string;
}

interface ParcelDispute {
  id: string;
  type: "lost" | "damaged_arrival" | "damaged_return" | "wrong_item";
  status: "open" | "in_review" | "resolved" | "closed";
  description: string;
  opened_at: string;
  resolved_at: string | null;
  resolution: string | null;
  refund_amount: number | null;
}

interface ParcelJobDetail {
  id: string;
  job_number: string;
  repair_job_id: string;

  shop_name: string;
  shop_address: string;

  customer_name: string;
  customer_phone: string;
  customer_address: string;

  device_model: string;
  device_brand: string;
  device_serial: string | null;

  status: string;
  shipping_cost: number | null;
  insurance_value: number | null;

  legs: ParcelLeg[];
  photos: ParcelPhoto[];
  disputes: ParcelDispute[];
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:          { label: "รอดำเนินการ",      color: "bg-gray-800 text-gray-400" },
  label_created:    { label: "สร้าง label แล้ว", color: "bg-gray-700 text-gray-300" },
  shipped_out:      { label: "ส่งออกแล้ว",       color: "bg-blue-900/50 text-blue-300" },
  in_transit_out:   { label: "กำลังส่งไปร้าน",  color: "bg-yellow-900/50 text-yellow-400" },
  at_shop:          { label: "อยู่ที่ร้าน",       color: "bg-purple-900/50 text-purple-300" },
  repaired:         { label: "ซ่อมเสร็จ",        color: "bg-teal-900/50 text-teal-300" },
  shipped_back:     { label: "ส่งคืนแล้ว",       color: "bg-indigo-900/50 text-indigo-300" },
  in_transit_back:  { label: "กำลังส่งกลับ",     color: "bg-cyan-900/50 text-cyan-300" },
  delivered:        { label: "ส่งถึงลูกค้า",     color: "bg-green-900/50 text-green-300" },
  completed:        { label: "เสร็จสิ้น",        color: "bg-green-900/50 text-green-400" },
  failed:           { label: "ล้มเหลว",           color: "bg-red-900/50 text-red-400" },
  lost:             { label: "พัสดุหาย",         color: "bg-red-900/60 text-red-300" },
  cancelled:        { label: "ยกเลิก",            color: "bg-gray-800 text-gray-500" },
};

const DISPUTE_TYPE_LABEL: Record<string, string> = {
  lost:             "พัสดุหาย",
  damaged_arrival:  "เสียหายเมื่อถึงร้าน",
  damaged_return:   "เสียหายเมื่อส่งคืน",
  wrong_item:       "ส่งผิดชิ้น",
};

const DISPUTE_STATUS_META: Record<string, { label: string; color: string }> = {
  open:      { label: "เปิด",         color: "bg-red-900/50 text-red-400" },
  in_review: { label: "กำลังตรวจ",   color: "bg-yellow-900/50 text-yellow-400" },
  resolved:  { label: "แก้ไขแล้ว",   color: "bg-green-900/50 text-green-400" },
  closed:    { label: "ปิด",          color: "bg-gray-800 text-gray-400" },
};

const PHOTO_TYPE_LABEL: Record<string, string> = {
  packaging:         "บรรจุภัณฑ์",
  shipping_label:    "Shipping Label",
  received_at_shop:  "รับที่ร้าน",
  return_packaging:  "บรรจุภัณฑ์ขาคืน",
  delivery_proof:    "หลักฐานส่ง",
  damage:            "ความเสียหาย",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-800/60 last:border-0">
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-100">{value}</span>
    </div>
  );
}

export default function ParcelDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<ParcelJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    try {
      const d = await api.get<ParcelJobDetail>(`/admin/repair/parcel/${jobId}`);
      setJob(d);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchJob();
  }, [router, fetchJob]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950 text-white">
        <Sidebar />
        <main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex min-h-screen bg-gray-950 text-white">
        <Sidebar />
        <main className="flex-1 p-8 space-y-4">
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400">
            {error ?? "ไม่พบข้อมูล"}
          </div>
          <Link href="/repair/parcel/queue" className="text-sm text-blue-400 hover:text-blue-300">← Queue</Link>
        </main>
      </div>
    );
  }

  const sm = STATUS_META[job.status] ?? { label: job.status, color: "bg-gray-800 text-gray-300" };
  const openDisputes = job.disputes?.filter(d => d.status === "open" || d.status === "in_review") ?? [];

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">📦 {job.job_number}</h1>
              <span className={`text-sm px-2.5 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
              {openDisputes.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900/50 text-orange-400">
                  ⚠️ {openDisputes.length} dispute{openDisputes.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm">
              Repair Job:{" "}
              <Link href={`/repair/jobs/${job.repair_job_id}`}
                className="text-blue-400 hover:text-blue-300 font-mono text-xs">
                {job.repair_job_id.slice(0, 8)}…
              </Link>
            </p>
          </div>
          <Link href="/repair/parcel/queue"
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            ← Queue
          </Link>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">อุปกรณ์</h2>
            <InfoRow label="แบรนด์ / รุ่น" value={`${job.device_brand} ${job.device_model}`} />
            <InfoRow label="Serial" value={job.device_serial ?? "—"} />
          </section>

          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ลูกค้า</h2>
            <InfoRow label="ชื่อ" value={job.customer_name} />
            <InfoRow label="โทร" value={job.customer_phone} />
            <InfoRow label="ที่อยู่" value={job.customer_address} />
          </section>

          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ร้านซ่อม</h2>
            <InfoRow label="ชื่อร้าน" value={job.shop_name} />
            <InfoRow label="ที่อยู่" value={job.shop_address} />
          </section>

          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ค่าใช้จ่าย</h2>
            <InfoRow label="ค่าส่ง" value={
              job.shipping_cost != null
                ? <span className="text-yellow-400 font-mono">{job.shipping_cost.toLocaleString()} ฿</span>
                : "—"
            } />
            <InfoRow label="มูลค่าประกัน" value={
              job.insurance_value != null
                ? <span className="font-mono">{job.insurance_value.toLocaleString()} ฿</span>
                : "—"
            } />
          </section>
        </div>

        {/* Tracking Timeline — two legs */}
        {job.legs?.map(leg => (
          <section key={leg.leg} className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {leg.leg === "outbound" ? "↗ ขาออก (ลูกค้า → ร้านซ่อม)" : "↙ ขาคืน (ร้านซ่อม → ลูกค้า)"}
              </h2>
              <span className="text-xs font-bold text-gray-200">{leg.courier_name}</span>
              <span className="text-xs font-mono text-blue-400">{leg.tracking_number}</span>
            </div>

            {/* Timeline events */}
            {leg.events?.length > 0 ? (
              <div className="space-y-3">
                {leg.events.map((ev, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                        i === 0 ? "bg-blue-500" : "bg-gray-600"
                      }`} />
                      {i < leg.events.length - 1 && (
                        <div className="w-px flex-1 bg-gray-700 mt-1 min-h-[16px]" />
                      )}
                    </div>
                    <div className="pb-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-gray-200">{ev.description}</span>
                        <span className="text-xs font-mono text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">
                          {ev.status_code}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {ev.location && <span>{ev.location} · </span>}
                        {new Date(ev.timestamp).toLocaleString("th-TH")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600">ยังไม่มี tracking events</p>
            )}

            {/* Leg timestamps summary */}
            <div className="flex gap-6 mt-4 pt-4 border-t border-gray-800">
              <div>
                <p className="text-xs text-gray-500">ส่งออก</p>
                <p className="text-sm font-mono text-gray-300">
                  {leg.shipped_at ? new Date(leg.shipped_at).toLocaleDateString("th-TH") : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">ส่งถึง</p>
                <p className="text-sm font-mono text-gray-300">
                  {leg.delivered_at ? new Date(leg.delivered_at).toLocaleDateString("th-TH") : "—"}
                </p>
              </div>
            </div>
          </section>
        ))}

        {/* Photos timeline */}
        {job.photos?.length > 0 && (
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              📷 Photos Timeline
            </h2>
            {(["packaging", "shipping_label", "received_at_shop", "return_packaging", "delivery_proof", "damage"] as const).map(type => {
              const typePhotos = job.photos.filter(p => p.type === type);
              if (typePhotos.length === 0) return null;
              return (
                <div key={type} className="mb-4 last:mb-0">
                  <p className="text-xs text-gray-500 mb-2">
                    {PHOTO_TYPE_LABEL[type]}
                    {type === "damage" && (
                      <span className="ml-2 text-red-400">⚠️</span>
                    )}
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {typePhotos.map((photo, i) => (
                      <a key={i} href={photo.url} target="_blank" rel="noreferrer"
                        className={`aspect-square bg-gray-800 rounded-lg overflow-hidden transition-all ${
                          type === "damage"
                            ? "hover:ring-2 hover:ring-red-500 ring-1 ring-red-800/50"
                            : "hover:ring-2 hover:ring-blue-500"
                        }`}>
                        <img src={photo.url} alt={`${type}-${i}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Dispute log */}
        {job.disputes?.length > 0 && (
          <section className="bg-gray-900 rounded-xl border border-orange-900/40 p-5">
            <h2 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-4">
              ⚠️ Dispute Log
            </h2>
            <div className="space-y-3">
              {job.disputes.map(d => {
                const ds = DISPUTE_STATUS_META[d.status] ?? { label: d.status, color: "bg-gray-800 text-gray-300" };
                return (
                  <div key={d.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-sm font-semibold text-orange-300">
                        {DISPUTE_TYPE_LABEL[d.type] ?? d.type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ds.color}`}>{ds.label}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(d.opened_at).toLocaleDateString("th-TH")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{d.description}</p>
                    {d.resolution && (
                      <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-3 mt-2">
                        <p className="text-xs text-green-400 font-semibold mb-1">การแก้ไข</p>
                        <p className="text-sm text-gray-200">{d.resolution}</p>
                        {d.refund_amount != null && (
                          <p className="text-xs text-yellow-400 mt-1 font-mono">
                            คืนเงิน: {d.refund_amount.toLocaleString()} ฿
                          </p>
                        )}
                        {d.resolved_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(d.resolved_at).toLocaleString("th-TH")}
                          </p>
                        )}
                      </div>
                    )}
                    {(d.status === "open" || d.status === "in_review") && (
                      <Link href={`/repair/parcel/disputes`}
                        className="inline-block mt-2 text-xs text-orange-400 hover:text-orange-300">
                        จัดการ Dispute →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
