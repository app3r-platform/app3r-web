"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { Listing, Offer } from "@/lib/types";

const STATUS_META: Record<Listing["status"], { label: string; color: string }> = {
  announced:        { label: "ประกาศ",          color: "bg-gray-800 text-gray-400" },
  receiving_offers: { label: "รับ Offer",        color: "bg-blue-900/50 text-blue-300" },
  offer_selected:   { label: "เลือก Offer แล้ว", color: "bg-indigo-900/50 text-indigo-300" },
  buyer_confirmed:  { label: "Buyer ยืนยัน",     color: "bg-cyan-900/50 text-cyan-300" },
  in_progress:      { label: "กำลังดำเนินการ",   color: "bg-yellow-900/50 text-yellow-400" },
  delivered:        { label: "ส่งแล้ว",          color: "bg-teal-900/50 text-teal-300" },
  inspection_period:{ label: "ช่วงตรวจสอบ",      color: "bg-purple-900/50 text-purple-300" },
  completed:        { label: "เสร็จสิ้น",        color: "bg-green-900/50 text-green-400" },
  cancelled:        { label: "ยกเลิก",           color: "bg-gray-800 text-gray-500" },
  disputed:         { label: "พิพาท",            color: "bg-red-900/50 text-red-400" },
};

const OFFER_STATUS_META: Record<Offer["status"], { label: string; color: string }> = {
  pending:   { label: "รอ",     color: "bg-yellow-900/50 text-yellow-400" },
  selected:  { label: "เลือก",  color: "bg-green-900/50 text-green-400" },
  rejected:  { label: "ปฏิเสธ", color: "bg-red-900/50 text-red-400" },
  withdrawn: { label: "ถอน",    color: "bg-gray-800 text-gray-500" },
};

interface ListingDetail extends Listing {
  sellerName?: string;
  applianceName?: string;
  transactionId?: string;
  viewCount?: number;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-800/60 last:border-0">
      <span className="text-xs text-gray-500 w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-100">{value}</span>
    </div>
  );
}

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
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  if (loading) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar /><main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
    </div>
  );

  if (error || !listing) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-4">
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400">
          ระบบ Resell กำลังพัฒนา — {error ?? "ไม่พบข้อมูล"}
        </div>
        <Link href="/resell/listings" className="text-sm text-blue-400 hover:text-blue-300">← Listings</Link>
      </main>
    </div>
  );

  const sm = STATUS_META[listing.status];
  const tm = listing.listingType === "used_appliance" ? "มือสอง" : "ซาก";

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
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
            <p className="text-gray-400 text-sm font-mono">{listing.id}</p>
          </div>
          <Link href="/resell/listings"
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            ← Listings
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Listing info */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ข้อมูล Listing</h2>
            <InfoRow label="Seller ID" value={
              <span className="font-mono text-xs">{listing.sellerId}</span>
            } />
            <InfoRow label="Seller Type" value={
              <span className={listing.sellerType === "WeeeU" ? "text-sky-400" : "text-green-400"}>
                {listing.sellerType}
              </span>
            } />
            {listing.sellerName && <InfoRow label="ชื่อ Seller" value={listing.sellerName} />}
            <InfoRow label="ประเภท" value={tm} />
            <InfoRow label="ราคา" value={
              <span className="font-mono text-green-400 font-bold">{listing.price.toLocaleString()} ฿</span>
            } />
            <InfoRow label="Delivery" value={listing.deliveryMethods.join(", ") || "—"} />
            {listing.viewCount != null && (
              <InfoRow label="จำนวนดู" value={`${listing.viewCount.toLocaleString()} ครั้ง`} />
            )}
          </section>

          {/* Appliance + warranty */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              เครื่องใช้ไฟฟ้า + Warranty
            </h2>
            {listing.applianceId ? (
              <InfoRow label="Appliance ID" value={
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
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Timeline</h2>
            <InfoRow label="สร้างเมื่อ" value={new Date(listing.createdAt).toLocaleString("th-TH")} />
            <InfoRow label="อัพเดตล่าสุด" value={new Date(listing.updatedAt).toLocaleString("th-TH")} />
            <InfoRow label="หมดอายุ" value={new Date(listing.expiresAt).toLocaleString("th-TH")} />
            {listing.transactionId && (
              <InfoRow label="Transaction ID" value={
                <span className="font-mono text-xs text-purple-400">{listing.transactionId}</span>
              } />
            )}
          </section>

          {/* Dispute quick link */}
          {listing.status === "disputed" && (
            <section className="bg-gray-900 rounded-xl border border-red-900/40 p-5">
              <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">⚖️ มีข้อพิพาท</h2>
              <p className="text-sm text-gray-400 mb-3">Listing นี้อยู่ในสถานะ DISPUTED — ต้องรอ Admin ตัดสิน</p>
              <Link href="/resell/disputes"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-red-800 hover:bg-red-700 text-white rounded-lg transition-colors">
                ⚖️ ไปหน้า Disputes →
              </Link>
            </section>
          )}
        </div>

        {/* Offer history */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Offer History ({offers.length})
          </h2>
          {offers.length === 0 ? (
            <p className="text-sm text-gray-600">ยังไม่มี offers</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
                  <th className="px-3 py-2">Offer ID</th>
                  <th className="px-3 py-2">Buyer</th>
                  <th className="px-3 py-2">ราคา Offer</th>
                  <th className="px-3 py-2">Delivery</th>
                  <th className="px-3 py-2">สถานะ</th>
                  <th className="px-3 py-2">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {offers.map(offer => {
                  const om = OFFER_STATUS_META[offer.status];
                  return (
                    <tr key={offer.id} className="hover:bg-gray-800/40">
                      <td className="px-3 py-2 font-mono text-xs text-gray-400">{offer.id.slice(0, 8)}…</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs font-medium ${offer.buyerType === "WeeeU" ? "text-sky-400" : "text-green-400"}`}>
                          {offer.buyerType}
                        </span>
                        <div className="text-xs text-gray-600 font-mono">{offer.buyerId.slice(0, 8)}…</div>
                      </td>
                      <td className="px-3 py-2 text-xs font-mono text-green-400">
                        {offer.offerPrice.toLocaleString()} ฿
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400">{offer.deliveryMethod}</td>
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
