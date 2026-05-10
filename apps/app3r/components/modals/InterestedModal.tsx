"use client";

// ============================================================
// components/modals/InterestedModal.tsx — "สนใจ" CTA modal
// ============================================================
import { useEffect } from "react";

interface InterestedModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingTitle: string;
}

export default function InterestedModal({
  isOpen,
  onClose,
  listingTitle,
}: InterestedModalProps) {
  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">สนใจสินค้า</h2>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{listingTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 shrink-0 text-gray-400 hover:text-gray-700 transition text-xl leading-none"
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>

        {/* Info */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800">
          <p className="font-semibold mb-1">เข้าสู่ระบบ WeeeU เพื่อติดต่อผู้ขาย</p>
          <p className="text-purple-600">
            สมาชิก WeeeU สามารถดูข้อมูลผู้ขาย ยื่น Offer และติดตามสถานะผ่านระบบ Escrow ที่ปลอดภัย
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <a
            href="http://localhost:3002/login"
            className="block w-full bg-purple-700 text-white text-center py-3 rounded-xl font-semibold hover:bg-purple-800 transition"
          >
            เข้าสู่ระบบ WeeeU
          </a>
          <a
            href="http://localhost:3002/register"
            className="block w-full bg-white border border-purple-700 text-purple-700 text-center py-3 rounded-xl font-semibold hover:bg-purple-50 transition"
          >
            สมัครสมาชิกฟรี
          </a>
          <button
            onClick={onClose}
            className="block w-full text-gray-500 text-center py-2 text-sm hover:text-gray-700 transition"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
