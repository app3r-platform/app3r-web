"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { Listing, Offer } from "@/lib/types";

const STATUS_META: Record<Listing["status"], { label: string; color: string }> = {
  announced:        { label: "ประกาศ",          color: "bg-gray-100 text-gray-500" },
  receiving_offers: { label: "รับ Offer",        color: "bg-blue-50 text-blue-700" },
  offer_selected:   { label: "เลือก Offer แล้ว", color: "bg-brand-info/15 text-brand-info" },
  buyer_confirmed:  { label: "Buyer ยืนยัน",     color: "bg-cyan-900/50 text-cyan-300" },
  in_progress:      { label: "กำลังดำเนินการ",   color: "bg-yellow-50 text-yellow-700" },
  delivered:        { label: "ส่งแล้ว",          color: "bg-brand-success/15 text-brand-success" },
  inspection_period:{ label: "ช่วงตรวจสอบ",      color: "bg-admin-primary/15 text-admin-primary" },
  completed:        { label: "เสร็จสิ้น",        color: "bg-green-50 text-green-700" },
  cancelled:        { label: "ยกเลิก",           color: "bg-gray-100 text-gray-500" },
  disputed:         { label: "พิพาท",            color: "bg-red-50 text-red-700" },
};

const OFFER_STATUS_META: Record<Offer["status"], { label: string; color: string }> = {
  pending:   { label: "รอ",     color: "bg-yellow-50 text-yellow-700" },
  selected:  { label: "เลือก",  color: "bg-green-50 text-green-700" },
  rejected:  { label: "ปฏิเสธ", color: "bg-red-50 text-red-700" },
  withdrawn: { label: "ถอน",    color: "bg-gray-100 text-gray-500" },
};

interface ListingDetail extends Listing {
  sellerName?: string;
  applianceName?: string;
  transactionId?: string;
  viewCount?: number;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-200/60 last:border-0">
      <span className="text-xs text-gray-500 w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-100">{value}</span>
    </div>
  );
}

// mock fallback — ลบตอน Phase 4 (TD-06)
const MOCK_LISTING_DETAIL: ListingDetail = {
  id: "LST-001", sellerId: "WEEER-001", sellerType: "WeeeR", listingType: "used_appliance",
  applianceId: "APP-001", price: 12000,
  deliveryMethods: ["self_pickup", "shipping"],
  status: "receiving_offers",
  expiresAt: "2026-07-01T00:00:00Z",
  createdAt: "2026-05-01T09:00:00Z",
  updatedAt: "2026-05-20T10:00:00Z",
  sellerName: "ร้านซ่อมเอ", applianceName: "Samsung เครื่องซักผ้า 10kg", viewCount: 15,
} as unknown as ListingDetail;

const MOCK_LISTING_OFFERS: Offer[] = [
  { id: "OFR-001", listingId: "LST-001", buyerId: "WEEEU-001", buyerType: "WeeeU", offerPrice: 11000, deliveryMethod: "self_pickup", message: "ขอซื้อด้วยครับ", status: "pending", expiresAt: "2026-06-15T00:00:00Z", createdAt: "2026-05-10T11:00:00Z" },
  { id: "OFR-002", listingId: "LST-001", buyerId: "WEEER-002", buyerType: "WeeeR", offerPrice: 11500, deliveryMethod: "shipping", status: "pending", expiresAt: "2026-06-15T00:00:00Z", createdAt: "2026-05-11T09:00:00Z" },
] as unknown as Offer[];

export default function ListingDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [l, o] = await Promise.all([
        api.get<ListingDetail>(`/admin/listings/${id}/`),
        api.get<Offer[]>(`/admin/listings/${id}/offers/`).catch(() => [] as Offer[]),
      ]);
      setListing(l);
      setOffers(o);
      setError(null);
    } catch (e) {
      // API ไม่พร้อม → ใช้ mock fallback
      console.warn("[mock fallback]", e);
      setListing(MOCK_LISTING_DETAIL);
      setOffers(MOCK_LISTING_OFFERS);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar /><main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
    </div>
  );

  if (error || !listing) return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
          ระบบ Resell กำลังพัฒนา — {error ?? "ไม่พบข้อมูล"}
        </div>
        <Link href="/resell/listings" className="text-sm text-admin-primary hover:text-admin-dark">← Listings</Link>
      </main>
    </div>
  );

  const sm = STATUS_META[listing.status];
  const tm = listing.listingType === "used_appliance" ? "มือสอง" : "ซาก";

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">🛍️ Listing Detail</h1>
              <span className={`text-sm px-2.5 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300">{tm}</span>
            </div>
            <p className="text-gray-500 text-sm font-mono">{listing.id}</p>
          </div>
          <Link href="/resell/listings"
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
            ← Listings
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Listing info */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ข้อมูล Listing</h2>
            <InfoRow label="รหัสผู้ขาย" value={
              <span className="font-mono text-xs">{listing.sellerId}</span>
            } />
            <InfoRow label="ประเภทผู้ขาย" value={
              <span className={listing.sellerType === "WeeeU" ? "text-sky-400" : "text-green-600"}>
                {listing.sellerType}
              </span>
            } />
            {listing.sellerName && <InfoRow label="ชื่อผู้ขาย" value={listing.sellerName} />}
            <InfoRow label="ประเภท" value={tm} />
            <InfoRow label="ราคา" value={
              <span className="font-mono text-green-600 font-bold">{listing.price.toLocaleString()} ฿</span>
            } />
            <InfoRow label="วิธีจัดส่ง" value={listing.deliveryMethods.join(", ") || "—"} />
            {listing.viewCount != null && (
              <InfoRow label="จำนวนดู" value={`${listing.viewCount.toLocaleString()} ครั้ง`} />
            )}
          </section>

          {/* Appliance + warranty */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              เครื่องใช้ไฟฟ้า + Warranty
            </h2>
            {listing.applianceId ? (
              <InfoRow label="รหัสเครื่องใช้ไฟฟ้า" value={
                <span className="font-mono text-xs text-blue-400">{listing.applianceId}</span>
              } />
            ) : (
              <p className="text-sm text-gray-600">ไม่มี appliance linked</p>
            )}
            {listing.applianceName && (
              <InfoRow label="รุ่น" value={listing.applianceName} />
            )}
            {listing.warranty ? (
              <>
                <InfoRow label="ประกันต้นทาง" value={`${listing.warranty.sourceWarranty} เดือน`} />
                <InfoRow label="ประกันเพิ่มเติม" value={`${listing.warranty.additionalWarranty} เดือน`} />
              </>
            ) : (
              <p className="text-sm text-gray-600 mt-2">ไม่มีข้อมูล warranty</p>
            )}
          </section>

          {/* Timeline */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Timeline</h2>
            <InfoRow label="สร้างเมื่อ" value={new Date(listing.createdAt).toLocaleString("th-TH")} />
            <InfoRow label="อัพเดตล่าสุด" value={new Date(listing.updatedAt).toLocaleString("th-TH")} />
            <InfoRow label="หมดอายุ" value={new Date(listing.expiresAt).toLocaleString("th-TH")} />
            {listing.transactionId && (
              <InfoRow label="รหัสธุรกรรม" value={
                <span className="font-mono text-xs text-admin-primary">{listing.transactionId}</span>
              } />
            )}
          </section>

          {/* Dispute quick link */}
          {listing.status === "disputed" && (
            <section className="bg-white rounded-xl border border-red-900/40 p-5">
              <h2 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3">⚖️ มีข้อพิพาท</h2>
              <p className="text-sm text-gray-500 mb-3">Listing นี้อยู่ในสถานะ DISPUTED — ต้องรอ Admin ตัดสิน</p>
              <Link href="/resell/disputes"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-red-800 hover:bg-red-50 text-red-700 border border-red-200 rounded-lg transition-colors">
                ⚖️ ไปหน้า Disputes →
              </Link>
            </section>
          )}
        </div>

        {/* Offer history */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Offer History ({offers.length})
          </h2>
          {offers.length === 0 ? (
            <p className="text-sm text-gray-600">ยังไม่มี offers</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-200">
                  <th className="px-3 py-2">Offer ID</th>
                  <th className="px-3 py-2">Buyer</th>
                  <th className="px-3 py-2">ราคา Offer</th>
                  <th className="px-3 py-2">Delivery</th>
                  <th className="px-3 py-2">สถานะ</th>
                  <th className="px-3 py-2">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {offers.map(offer => {
                  const om = OFFER_STATUS_META[offer.status];
                  return (
                    <tr key={offer.id} className="hover:bg-gray-100/40">
                      <td className="px-3 py-2 font-mono text-xs text-gray-500">{offer.id.slice(0, 8)}…</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs font-medium ${offer.buyerType === "WeeeU" ? "text-sky-400" : "text-green-600"}`}>
                          {offer.buyerType}
                        </span>
                        <div className="text-xs text-gray-600 font-mono">{offer.buyerId.slice(0, 8)}…</div>
                      </td>
                      <td className="px-3 py-2 text-xs font-mono text-green-600">
                        {offer.offerPrice.toLocaleString()} ฿
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">{offer.deliveryMethod}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${om.color}`}>{om.label}</span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {new Date(offer.createdAt).toLocaleDateString("th-TH")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

      </main>
    </div>
  );
}
