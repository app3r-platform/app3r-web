"use client";
// WeeeT — Parts Request History (B5-WeeeT STEP 2)
// จุดเข้า: /parts/requests (tab ใน parts section หรือลิงก์จาก success state)
// Phase 2 = mockup · ไม่ fetch API จริง
// TODO backend: GET /api/v1/parts/requests/?tech_id=me
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

type RequestStatus =
  | "pending"   // รอยืนยันจาก WeeeR
  | "approved"  // WeeeR อนุมัติ — รอจัดส่ง/จัดเตรียม
  | "rejected"  // WeeeR ปฏิเสธ
  | "shipped";  // จัดส่งแล้ว / จัดเตรียมให้รับแล้ว

type RequestType = "reserve" | "purchase";

type PartsRequest = {
  id: string;
  job_id: string;
  job_no: string;
  part_name: string;
  qty: number;
  unit: string;
  unit_price: number | null;
  request_type: RequestType;
  status: RequestStatus;
  created_at: string;
  notes?: string;
  reject_reason?: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_REQUESTS: PartsRequest[] = [
  {
    id: "req-001",
    job_id: "J-2026-0851",
    job_no: "J-2026-0851",
    part_name: "คอมเพรสเซอร์ Daikin 12000 BTU",
    qty: 1,
    unit: "ชิ้น",
    unit_price: 2500,
    request_type: "reserve",
    status: "approved",
    created_at: "2026-05-25T08:30:00Z",
    notes: "งานด่วน ลูกค้ารอ",
  },
  {
    id: "req-002",
    job_id: "J-2026-0788",
    job_no: "J-2026-0788",
    part_name: "แผงวงจรบอร์ด PCB Mitsubishi",
    qty: 1,
    unit: "ชิ้น",
    unit_price: 1800,
    request_type: "purchase",
    status: "pending",
    created_at: "2026-05-24T14:15:00Z",
  },
  {
    id: "req-003",
    job_id: "J-2026-0712",
    job_no: "J-2026-0712",
    part_name: "มอเตอร์พัดลม Carrier",
    qty: 2,
    unit: "ชิ้น",
    unit_price: 950,
    request_type: "reserve",
    status: "shipped",
    created_at: "2026-05-23T10:00:00Z",
  },
  {
    id: "req-004",
    job_id: "J-2026-0744",
    job_no: "J-2026-0744",
    part_name: "สายไฟ (แบ่งขาย/เมตร)",
    qty: 5,
    unit: "เมตร",
    unit_price: 45,
    request_type: "reserve",
    status: "rejected",
    created_at: "2026-05-22T09:30:00Z",
    reject_reason: "สต็อกคลังไม่พอ — ติดต่อ WeeeR เพื่อสั่งซื้อแทน",
  },
];

// ─── Configs ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<RequestStatus, { label: string; cls: string; icon: string }> = {
  pending:  {
    label: "รอยืนยัน",
    cls: "bg-yellow-900/30 text-yellow-300 border-yellow-700/40",
    icon: "⏳",
  },
  approved: {
    label: "อนุมัติแล้ว",
    cls: "bg-green-900/30 text-green-300 border-green-700/40",
    icon: "✅",
  },
  rejected: {
    label: "ปฏิเสธ",
    cls: "bg-red-900/30 text-red-300 border-red-700/40",
    icon: "❌",
  },
  shipped: {
    label: "จัดส่งแล้ว",
    cls: "bg-blue-900/30 text-blue-300 border-blue-700/40",
    icon: "📦",
  },
};

const TYPE_BADGE: Record<RequestType, { label: string; cls: string }> = {
  reserve: {
    label: "จากคลัง",
    cls: "bg-weeet-primary/15 text-weeet-primary border-weeet-dark/40",
  },
  purchase: {
    label: "สั่งซื้อภายนอก",
    cls: "bg-amber-900/30 text-amber-300 border-amber-700/40",
  },
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PartsRequestsPage() {
  const router = useRouter();

  const activeRequests = MOCK_REQUESTS.filter(
    (r) => r.status === "pending" || r.status === "approved"
  );
  const historyRequests = MOCK_REQUESTS.filter(
    (r) => r.status === "shipped" || r.status === "rejected"
  );

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 z-10">
        <h1 className="font-bold text-white text-base">📋 คำขออะไหล่</h1>
        <p className="text-xs text-gray-400">ประวัติการขออะไหล่ทั้งหมด</p>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Active */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            กำลังดำเนินการ ({activeRequests.length})
          </h2>
          {activeRequests.length === 0 ? (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-gray-400 text-sm">ไม่มีคำขอที่รอดำเนินการ</p>
            </div>
          ) : (
            activeRequests.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                onJobClick={() => router.push(`/jobs/${req.job_id}`)}
              />
            ))
          )}
        </div>

        {/* History */}
        {historyRequests.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              ประวัติ ({historyRequests.length})
            </h2>
            {historyRequests.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                onJobClick={() => router.push(`/jobs/${req.job_id}`)}
                dim
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Card Component ───────────────────────────────────────────────────────────

function RequestCard({
  req,
  onJobClick,
  dim = false,
}: {
  req: PartsRequest;
  onJobClick: () => void;
  dim?: boolean;
}) {
  const statusCfg = STATUS_CONFIG[req.status];
  const typeBadge = TYPE_BADGE[req.request_type];

  const dateLabel = new Date(req.created_at).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalPrice =
    req.unit_price != null ? req.unit_price * req.qty : null;

  return (
    <div
      className={`bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3 ${
        dim ? "opacity-60" : ""
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm leading-snug">
            {req.part_name}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span
              className={`text-xs px-1.5 py-0.5 rounded border ${typeBadge.cls}`}
            >
              {typeBadge.label}
            </span>
            <span className="text-xs text-gray-500">
              ×{req.qty} {req.unit}
            </span>
          </div>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${statusCfg.cls}`}
        >
          {statusCfg.icon} {statusCfg.label}
        </span>
      </div>

      {/* Price */}
      {totalPrice != null ? (
        <p className="text-sm text-weeet-primary font-semibold">
          ฿{totalPrice.toLocaleString()}
        </p>
      ) : (
        <p className="text-sm text-green-400 font-medium">ฟรี</p>
      )}

      {/* Notes */}
      {req.notes && (
        <p className="text-xs text-gray-500 italic">หมายเหตุ: {req.notes}</p>
      )}

      {/* Reject reason */}
      {req.reject_reason && (
        <div className="bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">
          <p className="text-xs text-red-300">⚠️ {req.reject_reason}</p>
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-700/50">
        <span className="text-xs text-gray-600">{dateLabel}</span>
        <button
          onClick={onJobClick}
          className="text-xs text-weeet-primary hover:text-weeet-dark underline font-mono transition-colors"
        >
          {req.job_no} →
        </button>
      </div>
    </div>
  );
}
