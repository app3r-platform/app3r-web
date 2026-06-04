"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

type Shop = {
  id: string;
  name: string;
  address: string;
  rating: number;
  review_count: number;
  distance_km: number | null;
  services: string[];
  open_hours: string;
  inspection_fee: number;
};

const MOCK_SHOPS: Shop[] = [
  {
    id: "mock-shop-001",
    name: "ร้านซ่อมดีเจริญ",
    address: "99/1 ถนนลาดพร้าว แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900",
    rating: 4.8,
    review_count: 320,
    distance_km: 2.5,
    services: ["เครื่องซักผ้า", "ตู้เย็น", "เครื่องปรับอากาศ"],
    open_hours: "จันทร์–เสาร์ 09:00–18:00",
    inspection_fee: 150,
  },
  {
    id: "mock-shop-002",
    name: "ไฟฟ้าเพชรบุรี",
    address: "45 ถนนเพชรบุรี แขวงถนนเพชรบุรี เขตราชเทวี กรุงเทพฯ 10400",
    rating: 4.5,
    review_count: 180,
    distance_km: 4.1,
    services: ["เครื่องซักผ้า", "เครื่องอบผ้า", "ไมโครเวฟ"],
    open_hours: "จันทร์–อาทิตย์ 08:00–19:00",
    inspection_fee: 100,
  },
  {
    id: "mock-shop-003",
    name: "ช่างบ้านงามวงศ์วาน",
    address: "12/3 ถนนงามวงศ์วาน อำเภอเมือง นนทบุรี 11000",
    rating: 4.6,
    review_count: 95,
    distance_km: 7.3,
    services: ["ตู้เย็น", "เครื่องปรับอากาศ", "เครื่องซักผ้า"],
    open_hours: "จันทร์–เสาร์ 09:00–17:00",
    inspection_fee: 120,
  },
];

export default function SelectShopPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetch("/api/v1/repair/shops?service=walk_in")
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setShops(d.items ?? []))
      .catch(() => { setShops(prev => prev.length > 0 ? prev : MOCK_SHOPS); })
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (shop: Shop) => {
    router.push(
      `/repair/new?service_type=walk_in&shop_id=${encodeURIComponent(shop.id)}&shop_name=${encodeURIComponent(shop.name)}`
    );
  };

  const filtered = shops.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/repair/new?service_type=walk_in" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">เลือกร้านซ่อม (Walk-in)</h1>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-green-800">🚶 Walk-in — นำเครื่องไปที่ร้านซ่อมเอง</p>
        <p className="text-xs text-green-600 mt-1">เลือกร้านที่สะดวก — จะได้รับ Receipt code หลังยืนยันคำขอ</p>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหาร้าน หรือที่อยู่..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {filtered.length === 0 && !error && (
        <div className="text-center py-10 space-y-3">
          <p className="text-4xl">🏪</p>
          <p className="text-gray-500 font-medium">ไม่พบร้านซ่อมที่ตรงกัน</p>
          {search && <p className="text-xs text-gray-400">ลองเปลี่ยนคำค้นหา</p>}
          {/* #4: ไม่พบร้าน → เปิดให้ร้านยื่นข้อเสนอแทน */}
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mt-2 text-left">
            <p className="text-sm font-semibold text-green-800">ไม่เจอร้านที่ต้องการ?</p>
            <p className="text-xs text-green-600 mt-1 mb-3">
              เปิดประกาศคำขอซ่อมให้ร้านซ่อม (WeeeR) ในพื้นที่ยื่นข้อเสนอเข้ามาแทน แล้วคุณเลือกที่ถูกใจ
            </p>
            <button
              type="button"
              onClick={() => router.push("/repair/new?service_type=walk_in&open_offer=1")}
              className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white text-sm font-semibold py-3 rounded-xl transition-colors"
            >
              📣 เปิดให้ร้านซ่อมยื่นข้อเสนอ
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(shop => (
          <div
            key={shop.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Shop header */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{shop.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">📍 {shop.address}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">⭐ {shop.rating.toFixed(1)}</p>
                  <p className="text-xs text-gray-400">{shop.review_count.toLocaleString()} รีวิว</p>
                </div>
              </div>
            </div>

            {/* Shop details */}
            <div className="px-5 py-3 space-y-2">
              {shop.distance_km !== null && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">ระยะทาง</span>
                  <span className="text-gray-700 font-medium">{shop.distance_km.toFixed(1)} กม.</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">เวลาทำการ</span>
                <span className="text-gray-700 font-medium">{shop.open_hours}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">ค่าตรวจ (พอยต์ทอง / Gold Point)</span>
                <span className="text-gray-700 font-medium">{shop.inspection_fee.toLocaleString()} พอยต์ทอง</span>
              </div>
              {shop.services.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {shop.services.map(s => (
                    <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Select button */}
            <div className="px-5 pb-4">
              <button
                onClick={() => handleSelect(shop)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                เลือกร้านนี้
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
