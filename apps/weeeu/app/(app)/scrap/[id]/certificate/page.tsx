"use client";

import { use, useState } from "react";
import Link from "next/link";
import { MockAnnoOrigin, MockAnnoXApp } from "@/components/shared/MockAnnoBar";

const MOCK_CERT = {
  number: "EW-2026-001234",
  date: "25 พ.ค. 2569",
  item: "เครื่องซักผ้า Samsung",
  shop: "ร้านรับซากดีเจริญ",
};

export default function ScrapCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [shared, setShared] = useState(false);

  const handleDownload = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `ใบรับรอง E-Waste ${MOCK_CERT.number}`,
        text: `ใบรับรองการทิ้งซาก ${MOCK_CERT.item} — ${MOCK_CERT.date}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* §5 Origin + §8 Cross-app annotations */}
        <MockAnnoOrigin text="◀ มาจาก: U-33 · /scrap/[id] (S4: เลือก dispose → E-Waste cert ออกแล้ว) หรือ push notification" />
        <MockAnnoXApp screenLabel="U-32: E-Waste cert (S4)">
          <p>• <strong>Admin :3000</strong> [A-11] ออกใบรับรอง E-Waste ก่อน WeeeU เห็นหน้านี้
            <a href="http://localhost:3000/scrap/certificates/EW-2026-001234" className="underline ml-1">/scrap/certificates/[id]</a>
          </p>
          <p>• <strong>WeeeR :3001</strong> [R-28e] R-28e ตัดสินใจ dispose → ส่ง Admin ออก cert
            <a href="http://localhost:3001/scrap/jobs/SJ001/dispose" className="underline ml-1">/scrap/jobs/[id]/dispose</a>
          </p>
        </MockAnnoXApp>

        {/* Back link */}
        <Link href={`/scrap/${id}`} className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1">
          ← กลับรายละเอียดซาก
        </Link>

        {/* Header */}
        <h1 className="text-xl font-bold text-weeeu-dark">ใบรับรอง E-Waste ♻️</h1>

        {/* Certificate card */}
        <div className="bg-white rounded-2xl border-2 border-green-400 shadow-sm p-6 space-y-4">
          {/* Certificate badge */}
          <div className="flex flex-col items-center text-center space-y-2 pb-4 border-b border-green-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">♻️</span>
            </div>
            <p className="text-base font-bold text-green-700">ใบรับรองการทิ้งซากอิเล็กทรอนิกส์</p>
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
              ผ่านมาตรฐาน E-Waste Thailand
            </span>
          </div>

          {/* Certificate details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">เลขที่ใบรับรอง</p>
              <p className="text-sm font-mono font-bold text-weeeu-dark">{MOCK_CERT.number}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">วันที่</p>
              <p className="text-sm text-gray-700">{MOCK_CERT.date}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">รายการซาก</p>
              <p className="text-sm text-gray-700">{MOCK_CERT.item}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">ร้านรับซาก</p>
              <p className="text-sm font-medium text-weeeu-dark">{MOCK_CERT.shop}</p>
            </div>
          </div>

          {/* QR mockup */}
          <div className="flex justify-center pt-2">
            <div className="w-24 h-24 bg-white border-2 border-green-300 rounded-xl flex items-center justify-center p-1.5">
              <svg viewBox="0 0 50 50" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <rect width="50" height="50" fill="white"/>
                <rect x="2" y="2" width="16" height="16" fill="none" stroke="#16a34a" strokeWidth="2.5"/>
                <rect x="6" y="6" width="8" height="8" fill="#16a34a"/>
                <rect x="32" y="2" width="16" height="16" fill="none" stroke="#16a34a" strokeWidth="2.5"/>
                <rect x="36" y="6" width="8" height="8" fill="#16a34a"/>
                <rect x="2" y="32" width="16" height="16" fill="none" stroke="#16a34a" strokeWidth="2.5"/>
                <rect x="6" y="36" width="8" height="8" fill="#16a34a"/>
                <rect x="22" y="2" width="2" height="2" fill="#16a34a"/>
                <rect x="26" y="6" width="2" height="2" fill="#16a34a"/>
                <rect x="24" y="10" width="2" height="2" fill="#16a34a"/>
                <rect x="28" y="14" width="2" height="2" fill="#16a34a"/>
                <rect x="22" y="22" width="2" height="2" fill="#16a34a"/>
                <rect x="26" y="22" width="2" height="2" fill="#16a34a"/>
                <rect x="30" y="26" width="2" height="2" fill="#16a34a"/>
                <rect x="34" y="30" width="2" height="2" fill="#16a34a"/>
                <rect x="38" y="34" width="2" height="2" fill="#16a34a"/>
                <rect x="22" y="38" width="2" height="2" fill="#16a34a"/>
                <rect x="26" y="34" width="2" height="2" fill="#16a34a"/>
              </svg>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 text-center">สแกน QR เพื่อตรวจสอบใบรับรอง (Mockup)</p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleDownload}
            className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            ⬇️ ดาวน์โหลด / พิมพ์ (Mockup)
          </button>
          <button
            onClick={handleShare}
            className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {shared ? "✅ คัดลอกลิงก์แล้ว" : "แชร์ใบรับรอง"}
          </button>
        </div>
      </div>
    </div>
  );
}
