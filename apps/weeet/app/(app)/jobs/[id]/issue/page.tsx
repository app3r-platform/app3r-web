"use client";
// Stub — พบปัญหาเพิ่ม (M7 branch from inspect)
// Phase 3 scaffold — DevNav route coverage
// TODO Phase 4: implement issue reporting flow
import { use } from "react";
import { useRouter } from "next/navigation";

export default function JobIssuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div className="px-4 pt-10 pb-20 flex flex-col items-center text-center gap-4">
      <p className="text-5xl">⚠️</p>
      <h1 className="font-bold text-white text-lg">พบปัญหาเพิ่มเติม</h1>
      <p className="text-sm text-gray-400 max-w-xs">
        [Stub] หน้านี้รอ implement Phase 4 — รายงานปัญหาเพิ่มเติมจากงาน {id}
      </p>
      <button
        onClick={() => router.back()}
        className="mt-4 text-weeet-primary underline text-sm"
      >
        ← กลับ
      </button>
    </div>
  );
}
