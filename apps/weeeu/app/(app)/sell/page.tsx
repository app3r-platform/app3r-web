"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listingsApi } from "@/lib/api/listings";
import { apiFetch } from "@/lib/api-client";
import type { Listing } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  announced: "ประกาศขาย",
  receiving_offers: "รับข้อเสนอ",
  offer_selected: "เลือกข้อเสนอแล้ว",
  buyer_confirmed: "ผู้ซื้อยืนยัน",
  in_progress: "กำลังดำเนินการ",
  delivered: "ส่งแล้ว",
  inspection_period: "ช่วงตรวจสอบ",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
  disputed: "มีข้อพิพาท",
  suspended: "ระงับ — แก้ไขได้ (R2/R3)", // R2/R3 SUSPENDED
};

const STATUS_COLOR: Record<string, string> = {
  announced: "bg-weeeu-surface text-weeeu-primary",
  receiving_offers: "bg-weeeu-surface text-weeeu-primary",
  offer_selected: "bg-weeeu-surface text-weeeu-dark",
  buyer_confirmed: "bg-orange-100 text-orange-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  delivered: "bg-teal-100 text-teal-700",
  inspection_period: "bg-cyan-100 text-cyan-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
  disputed: "bg-red-100 text-red-700",
  suspended: "bg-amber-100 text-amber-700", // R2/R3
};

const STATUS_TABS = [
  { value: "", label: "ทั้งหมด" },
  { value: "announced", label: "ประกาศขาย" },
  { value: "receiving_offers", label: "รับข้อเสนอ" },
  { value: "offer_selected", label: "เลือกแล้ว" },
  { value: "suspended", label: "ระงับ (R2/R3)" },
  { value: "completed", label: "เสร็จสิ้น" },
  { value: "cancelled", label: "ยกเลิก" },
];

type ListingTypeTab = "" | "used_appliance" | "scrap";

// Mock: SUSPENDED listings สำหรับ R2/R3 (Mockup)
const MOCK_SUSPENDED_LISTING: Listing = {
  id: "mock-suspended-001",
  sellerId: "current-user",
  sellerType: "WeeeU",
  listingType: "used_appliance",
  applianceId: "app-01",
  conditionGrade: "grade_B",
  workingParts: [],
  price: 5000,
  deliveryMethods: ["parcel"],
  status: "suspended" as Listing["status"],
  expiresAt: new Date(Date.now() - 86400000).toISOString(), // หมดอายุแล้ว
  createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  updatedAt: new Date(Date.now() - 86400000).toISOString(),
};

export default function SellPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState("");
  const [typeTab, setTypeTab] = useState<ListingTypeTab>("");

  // Mock R5: ยืนยันยกเลิกการเลือก
  const [cancellingSelection, setCancellingSelection] = useState<string | null>(null);
  // Mock R2/R3: repost / cancel suspended
  const [showMockSuspended, setShowMockSuspended] = useState(true);

  useEffect(() => {
    setLoading(true);
    listingsApi.mine({
      status: statusTab || undefined,
      listingType: typeTab || undefined,
    })
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [statusTab, typeTab]);

  // R5: Seller ถอนการเลือก offer (ยังไม่ยืนยัน)
  const handleUnselectOffer = async (listingId: string) => {
    if (!confirm("ถอนการเลือกข้อเสนอนี้? ผู้ยื่นจะได้รับพอยต์ทองคืน")) return;
    setCancellingSelection(listingId);
    try {
      const res = await apiFetch(`/api/v1/listings/${listingId}/unselect-offer/`, { method: "POST" });
      if (!res.ok) throw new Error();
      setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: "receiving_offers" } : l));
    } catch {
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setCancellingSelection(null);
    }
  };

  // R2/R3: ประกาศใหม่ v2 จาก SUSPENDED
  const handleRepostSuspended = (listingId: string) => {
    router.push(`/sell/${listingId}/edit?repost=true`);
  };

  // R2/R3: ยกเลิก listing SUSPENDED
  const handleCancelSuspended = async (listingId: string) => {
    if (!confirm("ยกเลิกประกาศนี้? พอยต์ทองค่าประกาศจะคืนให้คุณ")) return;
    try {
      const res = await apiFetch(`/api/v1/listings/${listingId}/cancel/`, { method: "POST" });
      if (!res.ok) throw new Error();
      setShowMockSuspended(false);
    } catch {
      // Mock: ซ่อน card ก็ได้
      setShowMockSuspended(false);
    }
  };

  const isScrapMode = typeTab === "scrap";

  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">ประกาศขายของฉัน</h1>
        <Link
          href="/sell/new"
          className="bg-weeeu-primary hover:bg-weeeu-dark text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          + ประกาศขาย
        </Link>
      </div>

      {/* Type toggle — ของมือสอง / ขายซาก */}
      <div className="grid grid-cols-3 gap-1.5 bg-gray-100 p-1 rounded-xl">
        {([
          { value: "" as ListingTypeTab, label: "ทั้งหมด", icon: "📦" },
          { value: "used_appliance" as ListingTypeTab, label: "ของมือสอง", icon: "📱" },
          { value: "scrap" as ListingTypeTab, label: "ขายซาก", icon: "♻️" },
        ] as const).map(t => (
          <button
            key={t.value}
            onClick={() => setTypeTab(t.value)}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              typeTab === t.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setStatusTab(t.value)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusTab === t.value
                ? "bg-weeeu-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* R2/R3 Mock: SUSPENDED listing */}
      {showMockSuspended && (statusTab === "" || statusTab === "suspended") && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-900">⏸ ประกาศระงับ (Mockup R2/R3)</p>
              <p className="text-xs text-amber-700 mt-0.5">เครื่องใช้ไฟฟ้า — เกรด B — 5,000 ฿</p>
              <p className="text-xs text-amber-600">สาเหตุ: หมดอายุโดยไม่มี offer (T1) / มี offer แต่ไม่เลือก (T2)</p>
            </div>
            <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
              ระงับ
            </span>
          </div>

          <div className="bg-white rounded-xl p-3 space-y-1">
            <p className="text-xs text-gray-600 font-medium">📋 พอยต์ทองค่าประกาศจะคืนถ้าคุณยกเลิก</p>
            <p className="text-xs text-gray-500">แก้ไข+ประกาศใหม่ = Listing v2 (พอยต์ทองถูก HOLD ใหม่)</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleRepostSuspended(MOCK_SUSPENDED_LISTING.id)}
              className="flex-1 bg-weeeu-primary hover:bg-weeeu-dark text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
            >
              ✏️ แก้ไข + ประกาศใหม่ v2
            </button>
            <button
              onClick={() => handleCancelSuspended(MOCK_SUSPENDED_LISTING.id)}
              className="flex-1 border border-red-200 text-red-500 text-xs font-semibold py-2.5 rounded-xl hover:bg-red-50 transition-colors"
            >
              ❌ ยกเลิก (รับ Point คืน)
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>
      ) : listings.length === 0 && !showMockSuspended ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">{isScrapMode ? "♻️" : "📦"}</p>
          <p className="text-gray-500 font-medium">
            {isScrapMode ? "ยังไม่มีประกาศขายซาก" : "ยังไม่มีประกาศขาย"}
          </p>
          <p className="text-sm text-gray-400">
            {isScrapMode ? "ขายซากเครื่องใช้ไฟฟ้าเก่าได้เงิน" : "เริ่มขายเครื่องใช้ไฟฟ้ามือสองได้เลย"}
          </p>
          <Link
            href="/sell/new"
            className="inline-block mt-2 bg-weeeu-primary hover:bg-weeeu-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            + ประกาศขายใหม่
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map(l => (
            <div key={l.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <Link href={`/sell/${l.id}`} className="block">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {l.listingType === "scrap" ? "♻️ ขายซาก / ชิ้นส่วน" : "📱 เครื่องใช้ไฟฟ้ามือสอง"}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(l.createdAt).toLocaleDateString("th-TH")}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[l.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {STATUS_LABEL[l.status] ?? l.status}
                    </span>
                    <p className="text-sm font-bold text-weeeu-primary">{l.price.toLocaleString()} ฿</p>
                  </div>
                </div>
              </Link>

              {/* R5: Seller ถอนการเลือก offer (ยังก่อน buyer_confirmed) */}
              {l.status === "offer_selected" && (
                <div className="mt-2 pt-2 border-t border-gray-50 space-y-2">
                  <p className="text-xs text-weeeu-dark font-medium">✅ คุณเลือกข้อเสนอแล้ว — รอผู้ซื้อยืนยัน Gold</p>
                  <div className="flex gap-2">
                    <Link
                      href={`/transactions/${l.id}`}
                      className="flex-1 text-center text-xs font-semibold text-weeeu-primary border border-weeeu-primary/30 py-2 rounded-xl hover:bg-weeeu-surface transition-colors"
                    >
                      📋 ดูธุรกรรม
                    </Link>
                    {/* R5: seller ถอนการเลือก */}
                    <button
                      onClick={() => handleUnselectOffer(l.id)}
                      disabled={cancellingSelection === l.id}
                      className="flex-1 text-xs text-red-500 border border-red-100 py-2 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      {cancellingSelection === l.id ? "กำลังถอน..." : "🔄 ถอนการเลือก (R5)"}
                    </button>
                  </div>
                </div>
              )}

              {(l.status === "announced" || l.status === "receiving_offers") && (
                <div className="mt-2 flex items-center gap-1.5">
                  <Link href={`/sell/${l.id}`} className="text-xs text-weeeu-primary font-medium">ดูรายละเอียด →</Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
