"use client";

import { useState } from "react";
import { moderationApi } from "@/lib/api/moderation";

/**
 * ReportButton — D82 ปุ่มรายงาน (report) ประกาศที่ไม่เหมาะสม (W-Round-1 Wave 2)
 * ต่อ endpoint จริง: POST /api/v1/admin/moderation
 * ส่ง contentType='listing' · contentRefId=listingId · mediaType='text'
 */
export function ReportButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleReport = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await moderationApi.report({
        contentType: "listing",
        contentRefId: listingId,
        listingId,
        mediaType: "text",
      });
      if (res.status === 201) {
        setDone(true);
        setOpen(false);
      } else if (res.status === 401) {
        setError("กรุณาเข้าสู่ระบบ (login) ก่อนรายงาน");
      } else {
        setError("รายงานไม่สำเร็จ กรุณาลองใหม่");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ (connection)");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <p className="text-xs text-gray-500 text-center py-2">
        ✅ รายงานแล้ว — ทีมงานจะตรวจสอบประกาศนี้
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-gray-400 hover:text-red-500 text-xs py-1.5 transition-colors"
        >
          🚩 รายงานประกาศนี้ (report)
        </button>
      ) : (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-2.5">
          <p className="text-xs text-red-700">
            ยืนยันรายงานประกาศนี้ว่าไม่เหมาะสม? ทีมงานจะตรวจสอบ (moderation)
          </p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReport}
              disabled={submitting}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-semibold py-2 rounded-lg text-xs transition-colors"
            >
              {submitting ? "กำลังส่ง..." : "ยืนยันรายงาน"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError("");
              }}
              disabled={submitting}
              className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-2 rounded-lg text-xs transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
