"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { resellApi } from "../../_lib/api";
import type { UsedAppliance } from "../../_lib/types";

const DELIVERY_OPTIONS = ["ส่ง Kerry", "ส่ง Flash", "รับเอง", "ส่งเอง (ช่างไปส่ง)"];

export default function ResellListingsNewPage() {
  const router = useRouter();
  // Read preselected applianceId from URL without useSearchParams (avoids Suspense requirement)
  const preselectedId = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("applianceId") ?? ""
    : "";

  const [inventory, setInventory] = useState<UsedAppliance[]>([]);
  const [loadingInv, setLoadingInv] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [applianceId, setApplianceId] = useState(preselectedId);
  const [price, setPrice] = useState("");
  const [deliveryMethods, setDeliveryMethods] = useState<string[]>(["รับเอง"]);
  const [sourceWarranty, setSourceWarranty] = useState("0");
  const [additionalWarranty, setAdditionalWarranty] = useState("0");
  const [description, setDescription] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("14");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    resellApi.inventoryList({ status: "in_stock" })
      .then(setInventory)
      .catch(() => setInventory([]))
      .finally(() => setLoadingInv(false));
  }, []);

  function toggleDelivery(method: string) {
    setDeliveryMethods(prev =>
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!applianceId) e.appliance = "กรุณาเลือกสินค้า";
    if (!price || Number(price) <= 0) e.price = "กรุณากรอกราคา";
    if (deliveryMethods.length === 0) e.delivery = "กรุณาเลือกวิธีจัดส่ง";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    setError("");
    try {
      const expiresAt = new Date(Date.now() + Number(expiresInDays) * 86400000).toISOString();
      const created = await resellApi.listingsCreate({
        applianceId,
        price: Number(price),
        deliveryMethods,
        warranty: {
          sourceWarranty: Number(sourceWarranty),
          additionalWarranty: Number(additionalWarranty),
        },
        description: description.trim() || undefined,
        expiresAt,
      });
      router.push(`/resell/listings/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/resell/listings" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">ประกาศขายสินค้า</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-100 rounded-2xl p-5">

        {/* Select appliance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            สินค้าที่จะขาย <span className="text-red-500">*</span>
          </label>
          {loadingInv ? (
            <div className="text-xs text-gray-400">กำลังโหลดสินค้า…</div>
          ) : inventory.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              ไม่มีสินค้าในสต๊อก — <Link href="/resell/inventory/new" className="underline">เพิ่มสินค้าก่อน</Link>
            </div>
          ) : (
            <select value={applianceId} onChange={e => { setApplianceId(e.target.value); setFormErrors(f => ({ ...f, appliance: "" })); }}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${formErrors.appliance ? "border-red-400" : "border-gray-200"}`}>
              <option value="">-- เลือกสินค้า --</option>
              {inventory.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {inv.name}{inv.brand ? ` (${inv.brand})` : ""}
                </option>
              ))}
            </select>
          )}
          {formErrors.appliance && <p className="text-xs text-red-500 mt-1">{formErrors.appliance}</p>}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ราคาขาย (pts) <span className="text-red-500">*</span>
          </label>
          <input type="number" min={0} value={price}
            onChange={e => { setPrice(e.target.value); setFormErrors(f => ({ ...f, price: "" })); }}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${formErrors.price ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.price && <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>}
        </div>

        {/* Delivery methods */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">วิธีจัดส่ง <span className="text-red-500">*</span></p>
          <div className="flex flex-wrap gap-2">
            {DELIVERY_OPTIONS.map(m => (
              <label key={m}
                className={`px-3 py-2 rounded-xl border-2 cursor-pointer text-xs font-medium transition-all
                  ${deliveryMethods.includes(m) ? "border-green-300 bg-green-50 text-green-800" : "border-gray-100 text-gray-600"}`}>
                <input type="checkbox" className="sr-only" checked={deliveryMethods.includes(m)} onChange={() => toggleDelivery(m)} />
                {m}
              </label>
            ))}
          </div>
          {formErrors.delivery && <p className="text-xs text-red-500 mt-1">{formErrors.delivery}</p>}
        </div>

        {/* Warranty */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">การรับประกัน (เดือน)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">ประกันต้นทาง</label>
              <input type="number" min={0} value={sourceWarranty} onChange={e => setSourceWarranty(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ประกันเพิ่มเติม</label>
              <input type="number" min={0} value={additionalWarranty} onChange={e => setAdditionalWarranty(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>
        </div>

        {/* Expires in */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมดอายุประกาศใน (วัน)</label>
          <select value={expiresInDays} onChange={e => setExpiresInDays(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
            <option value="7">7 วัน</option>
            <option value="14">14 วัน</option>
            <option value="30">30 วัน</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดเพิ่มเติม</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            rows={3} placeholder="สภาพ อาการ จุดเด่น ข้อบกพร่อง ฯลฯ"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting || inventory.length === 0}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
          {submitting ? "กำลังบันทึก…" : "📢 ประกาศขาย"}
        </button>
      </form>
    </div>
  );
}
