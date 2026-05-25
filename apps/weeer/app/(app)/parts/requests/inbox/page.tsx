"use client";

// ── D-6 Parts Request Inbox (WeeeR) ────────────────────────────────────────────
// ดู broadcast requests จากร้านอื่น — GET /api/v1/parts/requests/inbox

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { D6PartsRequest } from "../../_lib/d6-types";
import { D6_REQUESTS_MOCK, URGENCY_LABEL, URGENCY_COLOR } from "../../_lib/d6-types";

function TimeLeft({ expiresAt }: { expiresAt: string }) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return <span className="text-xs text-red-500">หมดอายุ</span>;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return <span className="text-xs text-amber-600">⏳ เหลือ {h}h {m}m</span>;
}

export default function RequestsInboxPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<D6PartsRequest[]>([]);
  const [quoting, setQuoting] = useState<string | null>(null);
  const [quoteForm, setQuoteForm] = useState({ price: "", qty: "1", notes: "" });
  const [quoteDone, setQuoteDone] = useState<string | null>(null);

  useEffect(() => {
    // Mock: use seed data + any stored
    const stored: D6PartsRequest[] = JSON.parse(
      localStorage.getItem("d6_inbox_requests") ?? "null"
    ) ?? D6_REQUESTS_MOCK;
    // filter: open + not expired + not own
    const valid = stored.filter(
      (r) => r.status === "open" && new Date(r.expiresAt).getTime() > Date.now()
    );
    setRequests(valid);
  }, []);

  const handleSubmitQuote = (req: D6PartsRequest) => {
    if (!quoteForm.price) return;
    setTimeout(() => {
      setQuoteDone(req.id);
      setQuoting(null);
    }, 600);
  };

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500">← กลับ</button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Inbox คำขอซื้ออะไหล่</h1>
            <p className="text-xs text-gray-500">ร้านอื่นต้องการอะไหล่จากคุณ</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/parts/requests/new")}
          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium"
        >
          + ขอซื้อ
        </button>
      </div>

      {/* Stats */}
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-sm text-green-700">
        📢 {requests.length} คำขอที่รอคำเสนอราคา
      </div>

      {requests.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">ไม่มีคำขอในขณะนี้</p>
        </div>
      )}

      {/* Request cards */}
      {requests.map((req) => {
        const isQuoting = quoting === req.id;
        const isDone = quoteDone === req.id;

        return (
          <div key={req.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 space-y-2">
              {/* Urgency + time */}
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${URGENCY_COLOR[req.urgency]}`}>
                  {URGENCY_LABEL[req.urgency]}
                </span>
                <TimeLeft expiresAt={req.expiresAt} />
              </div>

              {/* Part info */}
              <div>
                <p className="font-semibold text-gray-800">{req.partName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {req.applianceBrand} {req.applianceModel}
                  {req.partNumber && <span className="ml-1 text-gray-400">· {req.partNumber}</span>}
                </p>
              </div>

              {/* Meta */}
              <div className="flex gap-3 text-xs text-gray-500">
                <span>📦 ต้องการ {req.qtyNeeded} ชิ้น</span>
                {req.maxPricePerUnit && <span>💰 ไม่เกิน ฿{req.maxPricePerUnit.toLocaleString()}/ชิ้น</span>}
                <span>🏪 {req.requesterName}</span>
              </div>

              {req.quoteCount !== undefined && req.quoteCount > 0 && (
                <p className="text-xs text-blue-600">💬 {req.quoteCount} ใบเสนอราคา</p>
              )}
            </div>

            {/* Quote section */}
            {isDone ? (
              <div className="px-4 py-3 bg-green-50 border-t border-green-200">
                <p className="text-sm text-green-700 font-medium">✅ ส่งใบเสนอราคาแล้ว</p>
              </div>
            ) : isQuoting ? (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-3">
                <p className="text-xs font-medium text-gray-600">ส่งใบเสนอราคา</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-0.5 block">ราคา/ชิ้น (฿) *</label>
                    <input
                      type="number"
                      value={quoteForm.price}
                      onChange={(e) => setQuoteForm((p) => ({ ...p, price: e.target.value }))}
                      placeholder="฿0"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-green-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-0.5 block">จำนวนที่มี</label>
                    <input
                      type="number"
                      min={1}
                      value={quoteForm.qty}
                      onChange={(e) => setQuoteForm((p) => ({ ...p, qty: e.target.value }))}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-green-400"
                    />
                  </div>
                </div>
                <input
                  value={quoteForm.notes}
                  onChange={(e) => setQuoteForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="หมายเหตุ (ถ้ามี)"
                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-green-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSubmitQuote(req)}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-medium"
                  >
                    ส่งใบเสนอราคา
                  </button>
                  <button
                    onClick={() => setQuoting(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 border-t border-gray-100">
                <button
                  onClick={() => setQuoting(req.id)}
                  className="w-full py-2 border border-green-500 text-green-600 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors"
                >
                  💬 เสนอราคา
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
