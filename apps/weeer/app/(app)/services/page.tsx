"use client";
// ── Services Listings — Sub-CMD-4 Wave 2 ──────────────────────────────────────
// รายการ service records ของ WeeeR — title, description, pointAmount, deadline
// GET /api/v1/services/ (filter: status, type, pagination)

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listServices,
  updateServiceStatus,
  deleteService,
  SERVICE_TYPE_LABEL,
  SERVICE_STATUS_LABEL,
  SERVICE_STATUS_COLOR,
} from "../../../lib/services-api";
import type { ServiceRecord, ServiceStatus, ServiceType } from "../../../lib/services-api";
import { MockAnnoOrigin } from "@/components/MockAnno";

const STATUS_FILTERS: { label: string; value: ServiceStatus | "all" }[] = [
  { label: "ทั้งหมด",           value: "all" },
  { label: "ร่าง",              value: "draft" },
  { label: "เผยแพร่",          value: "published" },
  { label: "กำลังดำเนินการ",   value: "in_progress" },
  { label: "เสร็จสิ้น",        value: "completed" },
  { label: "ยกเลิก",           value: "cancelled" },
];

const TYPE_FILTERS: { label: string; value: ServiceType | "all" }[] = [
  { label: "ทุกประเภท",   value: "all" },
  { label: "ซ่อม",        value: "repair" },
  { label: "ล้าง/บำรุง", value: "maintain" },
  { label: "ขายต่อ",      value: "resell" },
  { label: "ซาก",         value: "scrap" },
];

// ── Mock fallback (RC3) — ใช้เมื่อ Backend ไม่พร้อม (mock mode / offline) ───────
// ครอบคลุมทุก status + ทุก type เพื่อให้ filter ทุกแท็บมีข้อมูลสมจริง
const MOCK_SERVICES: ServiceRecord[] = [
  { id: "svc-001", ownerId: "shop-weeer-001", serviceType: "repair",   status: "published",   title: "ซ่อมแอร์ Daikin ไม่เย็น", description: "ตรวจเช็คน้ำยา + ล้างคอยล์", pointAmount: "1500", deadline: "2026-06-20T10:00:00Z", createdAt: "2026-06-01T08:00:00Z", updatedAt: "2026-06-05T09:00:00Z" },
  { id: "svc-002", ownerId: "shop-weeer-001", serviceType: "maintain", status: "in_progress", title: "ล้างแอร์ประจำปี คอนโด 3 เครื่อง", description: "สัญญาบำรุงรักษารายปี", pointAmount: "2400", deadline: "2026-06-15T13:00:00Z", createdAt: "2026-05-28T07:30:00Z", updatedAt: "2026-06-06T11:00:00Z" },
  { id: "svc-003", ownerId: "shop-weeer-001", serviceType: "repair",   status: "draft",       title: "เปลี่ยนคอมเพรสเซอร์ตู้เย็น Samsung", description: null, pointAmount: "3200", deadline: null, createdAt: "2026-06-08T14:00:00Z", updatedAt: "2026-06-08T14:00:00Z" },
  { id: "svc-004", ownerId: "shop-weeer-001", serviceType: "resell",   status: "completed",   title: "ขายต่อเครื่องซักผ้า LG มือสอง", description: "ผ่านการตรวจสภาพแล้ว", pointAmount: "4500", deadline: "2026-05-30T10:00:00Z", createdAt: "2026-05-20T09:00:00Z", updatedAt: "2026-05-30T16:00:00Z" },
  { id: "svc-005", ownerId: "shop-weeer-001", serviceType: "scrap",    status: "cancelled",   title: "รับซากแอร์เก่า 5 เครื่อง", description: "ลูกค้ายกเลิกนัด", pointAmount: "800", deadline: null, createdAt: "2026-05-25T10:00:00Z", updatedAt: "2026-05-27T10:00:00Z" },
];

function filterMockServices(
  status: ServiceStatus | "all",
  type: ServiceType | "all",
): ServiceRecord[] {
  return MOCK_SERVICES.filter(
    (s) => (status === "all" || s.status === status) && (type === "all" || s.serviceType === type),
  );
}

export default function ServicesPage() {
  const [items, setItems] = useState<ServiceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ServiceType | "all">("all");
  const [actionId, setActionId] = useState<string | null>(null); // สำหรับ loading state ของ action

  async function load() {
    setLoading(true);
    try {
      const result = await listServices({
        status: statusFilter === "all" ? undefined : statusFilter,
        type:   typeFilter   === "all" ? undefined : typeFilter,
        limit: 50,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      // RC3: Backend ไม่พร้อม → fallback mock (ไม่แสดง error · ไม่เด้ง login)
      const mock = filterMockServices(statusFilter, typeFilter);
      setItems(mock);
      setTotal(mock.length);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [statusFilter, typeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePublish(id: string) {
    setActionId(id);
    try {
      const updated = await updateServiceStatus(id, "published");
      setItems((prev) => prev.map((s) => s.id === id ? updated : s));
    } catch {
      // RC3: Backend ไม่พร้อม → optimistic update (mock success)
      setItems((prev) => prev.map((s) => s.id === id ? { ...s, status: "published" as ServiceStatus } : s));
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id: string, title: string | null) {
    if (!confirm(`ลบ "${title ?? "service นี้"}" ใช่หรือไม่?`)) return;
    setActionId(id);
    try {
      await deleteService(id);
      setItems((prev) => prev.filter((s) => s.id !== id));
      setTotal((t) => t - 1);
    } catch {
      // RC3: Backend ไม่พร้อม → optimistic remove (mock success)
      setItems((prev) => prev.filter((s) => s.id !== id));
      setTotal((t) => t - 1);
    } finally {
      setActionId(null);
    }
  }

  function formatDeadline(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("th-TH", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <MockAnnoOrigin from="R-01" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">บริการของฉัน</h1>
          <p className="text-xs text-gray-500 mt-0.5">จัดการรายการบริการ (service records) — ชื่อ (title), ราคา, กำหนดเสร็จ</p>
        </div>
        <Link
          href="/services/new"
          className="bg-[#FF663A] hover:bg-[#F04E20] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + เพิ่มบริการ
        </Link>
      </div>

      {/* Filter bar — status */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors
              ${statusFilter === f.value
                ? "bg-[#FF663A] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Filter bar — type */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setTypeFilter(f.value)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors
              ${typeFilter === f.value
                ? "bg-blue-600 text-white"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-gray-400">{total} รายการ</p>
      )}

      {/* States */}
      {loading && (
        <div className="flex items-center justify-center h-40 text-gray-400">กำลังโหลด…</div>
      )}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <span className="text-4xl mb-3">🛠️</span>
          <p className="text-sm">ยังไม่มีบริการ</p>
          <Link href="/services/new" className="mt-3 text-xs text-[#F04E20] hover:underline font-medium">
            เพิ่มบริการแรก →
          </Link>
        </div>
      )}

      {/* Service cards */}
      <div className="space-y-3">
        {items.map((svc) => (
          <div
            key={svc.id}
            className="bg-white border border-gray-100 rounded-xl p-4 hover:border-[#FFD0BF] hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                {/* Status + type badges */}
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SERVICE_STATUS_COLOR[svc.status]}`}>
                    {SERVICE_STATUS_LABEL[svc.status]}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {SERVICE_TYPE_LABEL[svc.serviceType]}
                  </span>
                </div>

                {/* Title */}
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {svc.title ?? <span className="text-gray-400 italic">ยังไม่มีชื่อ</span>}
                </p>

                {/* Description */}
                {svc.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{svc.description}</p>
                )}

                {/* Point amount + deadline */}
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2">
                  {svc.pointAmount && (
                    <span className="text-xs font-medium text-[#D63B12]">
                      💰 {Number(svc.pointAmount).toLocaleString()} pts
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    ⏰ กำหนด: {formatDeadline(svc.deadline)}
                  </span>
                </div>

                {/* Timestamps */}
                <p className="text-xs text-gray-300 mt-1">
                  สร้าง: {new Date(svc.createdAt).toLocaleDateString("th-TH")}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1.5 shrink-0">
                <Link
                  href={`/services/${svc.id}/edit`}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  แก้ไข
                </Link>
                {svc.status === "draft" && (
                  <button
                    type="button"
                    onClick={() => handlePublish(svc.id)}
                    disabled={actionId === svc.id}
                    className="text-xs text-[#D63B12] hover:text-[#B8300E] font-medium px-2 py-1 border border-[#FFE0D6] rounded-lg hover:bg-[#FFF1ED] transition-colors disabled:opacity-50"
                  >
                    {actionId === svc.id ? "…" : "เผยแพร่"}
                  </button>
                )}
                {(svc.status === "draft" || svc.status === "cancelled") && (
                  <button
                    type="button"
                    onClick={() => handleDelete(svc.id, svc.title)}
                    disabled={actionId === svc.id}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 border border-red-100 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    ลบ
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
