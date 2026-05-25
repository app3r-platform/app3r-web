"use client";

// ── OrderStageStepper — Gen 80 (5-stage: ordered→confirmed→shipped→received) ─

import type { OrderStage } from "../../app/(app)/parts/_lib/types";

// Gen 80: 5 stages (เพิ่ม confirmed ระหว่าง ordered และ shipped)
const STEPS: { key: OrderStage; label: string; icon: string }[] = [
  { key: "ordered",   label: "สั่งซื้อ",    icon: "🛒" },
  { key: "confirmed", label: "ผู้ขายรับ",   icon: "☑️" },
  { key: "shipped",   label: "จัดส่ง",      icon: "📦" },
  { key: "received",  label: "รับของ",      icon: "✅" },
];

interface OrderStageStepperProps {
  stage: OrderStage;
}

const STAGE_ORDER: Record<OrderStage, number> = {
  ordered: 0, confirmed: 1, shipped: 2, received: 3, cancelled: -1,
};

export function OrderStageStepper({ stage }: OrderStageStepperProps) {
  const current = STAGE_ORDER[stage];
  const isCancelled = stage === "cancelled";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-xs font-medium bg-red-50 rounded-xl px-3 py-2">
        <span>🚫</span><span>ยกเลิกแล้ว</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0 overflow-x-auto">
      {STEPS.map((step, i) => {
        const done = STAGE_ORDER[step.key] < current;
        const active = step.key === stage;
        return (
          <div key={step.key} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-0.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                done ? "bg-green-500 text-white" :
                active ? "bg-green-100 ring-2 ring-green-500 text-green-700" :
                "bg-gray-100 text-gray-400"
              }`}>
                {done ? "✓" : step.icon}
              </div>
              <span className={`text-xs mt-0.5 whitespace-nowrap ${done || active ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-6 mx-1 mb-4 transition-colors ${STAGE_ORDER[step.key] < current ? "bg-green-500" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
