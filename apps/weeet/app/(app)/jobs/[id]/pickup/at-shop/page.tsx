"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { pickupApi } from "@/lib/api";

export default function PickupAtShopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await pickupApi.atShop(id);
      router.replace(`/jobs/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pt-5 pb-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white text-lg"
        >
          ←
        </button>
        <div>
          <h1 className="text-white font-bold text-lg">เครื่องถึงร้านแล้ว</h1>
          <p className="text-xs text-gray-400">ยืนยันรับเครื่องเข้าร้านเพื่อซ่อม</p>
        </div>
      </div>

      {/* Confirm card */}
      <div className="bg-indigo-950/50 border border-indigo-800/60 rounded-xl p-5 space-y-3 text-center">
        <p className="text-4xl">🏪</p>
        <p className="text-indigo-300 font-semibold">นำเครื่องเข้าร้านเรียบร้อยแล้ว?</p>
        <p className="text-indigo-200 text-xs">
          กดยืนยันเพื่อเปลี่ยนสถานะเป็น{" "}
          <span className="font-semibold">เครื่องถึงร้าน</span>{" "}
          และเริ่มขั้นตอนการซ่อม
        </p>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors"
      >
        {loading ? "กำลังบันทึก..." : "🏪 ยืนยันเครื่องถึงร้านแล้ว"}
      </button>
    </div>
  );
}
