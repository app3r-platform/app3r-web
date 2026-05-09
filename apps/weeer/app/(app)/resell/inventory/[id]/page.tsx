"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { resellApi } from "../../_lib/api";
import type { UsedAppliance } from "../../_lib/types";
import { CONDITION_LABEL, CONDITION_COLOR, APPLIANCE_STATUS_LABEL, APPLIANCE_STATUS_COLOR } from "../../_lib/types";

export default function ResellInventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<UsedAppliance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    resellApi.inventoryGet(id)
      .then(setItem)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ ระบบขายมือสองกำลังพัฒนา — {error}</div>;
  if (!item) return null;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/resell/inventory" className="text-gray-400 hover:text-gray-600">←</Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{item.name}</h1>
          {item.sku && <p className="text-xs text-gray-400 font-mono">{item.sku}</p>}
        </div>
        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${APPLIANCE_STATUS_COLOR[item.status]}`}>
          {APPLIANCE_STATUS_LABEL[item.status]}
        </span>
      </div>

      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt={item.name} className="w-full max-h-48 object-cover rounded-xl border border-gray-100" />
      )}

      <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-xs text-gray-400">ยี่ห้อ / รุ่น</p><p className="font-medium">{[item.brand, item.model].filter(Boolean).join(" ") || "—"}</p></div>
        <div><p className="text-xs text-gray-400">หมวดหมู่</p><p className="font-medium">{item.category}</p></div>
        <div>
          <p className="text-xs text-gray-400">สภาพ</p>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${CONDITION_COLOR[item.condition]}`}>
            {CONDITION_LABEL[item.condition]}
          </span>
        </div>
        <div><p className="text-xs text-gray-400">แหล่งที่มา</p><p className="font-medium">{item.source?.type === "purchased" ? "ซื้อมา" : item.source?.type === "acquired" ? "ได้รับมา" : "กรอกเอง"}</p></div>
        <div><p className="text-xs text-gray-400">ราคาทุน</p><p className="font-bold text-gray-700">{item.costPrice.toLocaleString()} pts</p></div>
        <div><p className="text-xs text-gray-400">ราคาขายแนะนำ</p><p className="font-bold text-blue-700">{item.suggestedPrice.toLocaleString()} pts</p></div>
        {item.notes && <div className="col-span-2"><p className="text-xs text-gray-400">หมายเหตุ</p><p className="text-gray-700">{item.notes}</p></div>}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {item.status === "in_stock" && (
          <Link href={`/resell/listings/new?applianceId=${item.id}`}
            className="flex-1 text-center bg-green-700 hover:bg-green-800 text-white text-sm font-semibold py-3 rounded-xl transition-colors">
            📢 ประกาศขาย
          </Link>
        )}
      </div>
    </div>
  );
}
