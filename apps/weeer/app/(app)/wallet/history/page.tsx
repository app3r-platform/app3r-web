"use client";
// ── Wallet History — WeeeR (Transfer History) ─────────────────────────────────
// Decision Record C: 360813ec-7277-8143-9011-ca6cd91b621d
// แสดงประวัติการเติม/ถอนแต้มทั้งหมด
// GET /api/v1/transfers/history/

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api-client";
import { MockAnnoOrigin } from "@/components/MockAnno";

type TransferType   = "deposit" | "withdraw";
type TransferStatus = "pending" | "approved" | "rejected" | "processing";

interface TransferRecord {
  id:         string;
  type:       TransferType;
  amount:     number;        // จำนวนเงิน (บาท) สำหรับ deposit, จำนวนแต้มสำหรับ withdraw
  status:     TransferStatus;
  createdAt:  string;        // ISO date string
  refCode?:   string;
  note?:      string;
}

// Backend response shape (GET /api/v1/transfers/history/)
interface TransferHistoryDto {
  id:        string;
  userId:    string;
  type:      string;   // "deposit" | "withdraw" (free-string from backend)
  amountThb: string;   // decimal string
  refNo?:    string | null;
  adminNote?: string | null;
  status:    string;   // free-string — guard before lookup
  bankName?: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<TransferStatus, string> = {
  pending:    "รอตรวจสอบ",
  approved:   "อนุมัติแล้ว",
  rejected:   "ปฏิเสธ",
  processing: "กำลังโอน",
};

const STATUS_COLOR: Record<TransferStatus, string> = {
  pending:    "bg-yellow-100 text-yellow-700",
  approved:   "bg-green-100 text-green-700",
  rejected:   "bg-red-100 text-red-600",
  processing: "bg-blue-100 text-blue-700",
};

const KNOWN_STATUSES: readonly TransferStatus[] = ["pending", "approved", "rejected", "processing"];

// Guard free-string backend status → known TransferStatus (default "pending" for unmapped).
function normalizeStatus(raw: string): TransferStatus {
  return KNOWN_STATUSES.includes(raw as TransferStatus) ? (raw as TransferStatus) : "pending";
}

function normalizeType(raw: string): TransferType {
  return raw === "withdraw" ? "withdraw" : "deposit";
}

function mapTransfer(dto: TransferHistoryDto): TransferRecord {
  return {
    id:        dto.id,
    type:      normalizeType(dto.type),
    amount:    Number(dto.amountThb) || 0,
    status:    normalizeStatus(dto.status),
    createdAt: dto.createdAt,
    refCode:   dto.refNo ?? undefined,
    note:      dto.adminNote ?? undefined,
  };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

export default function TransferHistoryPage() {
  const [records, setRecords]   = useState<TransferRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [filter, setFilter]     = useState<"all" | TransferType>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch("/api/v1/transfers/history/");
        if (res.ok) {
          const data = (await res.json()) as TransferHistoryDto[];
          setRecords(data.map(mapTransfer));
        } else {
          setError("ไม่สามารถโหลดประวัติได้ กรุณาลองใหม่อีกครั้ง");
        }
      } catch {
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const filtered = filter === "all"
    ? records
    : records.filter((r) => r.type === filter);

  return (
    <div className="space-y-6 max-w-2xl">
      <MockAnnoOrigin from="R-36" />
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/wallet" className="text-gray-400 hover:text-gray-600 text-sm">← กลับ</Link>
        <h1 className="text-xl font-bold text-gray-900">ประวัติการเติม/ถอนแต้ม</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "deposit", "withdraw"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? "bg-[#FF663A] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {{ all: "ทั้งหมด", deposit: "เติมแต้ม", withdraw: "ถอนแต้ม" }[f]}
          </button>
        ))}
      </div>

      {/* Quick links */}
      <div className="flex gap-3">
        <Link
          href="/wallet/deposit"
          className="flex-1 bg-[#FFF1ED] border border-[#FFE0D6] rounded-xl px-4 py-3 text-sm font-medium text-[#D63B12] text-center hover:bg-[#FFE0D6] transition-colors"
        >
          ➕ เติมแต้ม
        </Link>
        <Link
          href="/wallet/withdraw"
          className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 text-center hover:bg-gray-100 transition-colors"
        >
          💸 ถอนแต้ม
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">กำลังโหลด...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-500 text-sm">⚠️ {error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">ยังไม่มีรายการ</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((rec) => (
            <div key={rec.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                  rec.type === "deposit" ? "bg-green-100" : "bg-orange-100"
                }`}>
                  {rec.type === "deposit" ? "📥" : "📤"}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800">
                      {rec.type === "deposit" ? "เติมแต้ม" : "ถอนแต้ม"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[rec.status]}`}>
                      {STATUS_LABEL[rec.status]}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400 mt-0.5">{formatDate(rec.createdAt)}</div>

                  {rec.refCode && (
                    <div className="text-xs text-gray-400 mt-0.5">รหัส: {rec.refCode}</div>
                  )}

                  {rec.note && rec.status === "rejected" && (
                    <div className="text-xs text-red-500 mt-1">เหตุผล: {rec.note}</div>
                  )}
                </div>

                {/* Amount */}
                <div className={`text-sm font-bold tabular-nums shrink-0 ${
                  rec.type === "deposit" ? "text-green-600" : "text-orange-600"
                }`}>
                  {rec.type === "deposit" ? "+" : "-"}
                  {rec.amount.toLocaleString()}
                  <span className="text-xs font-normal ml-0.5">
                    {rec.type === "deposit" ? "บาท" : "แต้ม"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
