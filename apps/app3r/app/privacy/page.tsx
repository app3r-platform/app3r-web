import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'นโยบายความเป็นส่วนตัว — App3R',
  description: 'นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคลของแพลตฟอร์ม App3R',
};

// Placeholder route — เนื้อหาฉบับเต็มจะมาผ่าน CMS (C13)
// มีไว้เพื่อให้ลิงก์จาก WeeeR (register) และ WeeeU ที่ชี้มา /privacy ไม่ 404
export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-website-brand-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">นโยบายความเป็นส่วนตัว</span>
      </nav>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-website-brand-700 mb-6">
        นโยบายความเป็นส่วนตัว
      </h1>

      <div className="bg-website-brand-50 border border-website-brand-200 rounded-2xl p-8 text-gray-700 leading-relaxed">
        <p>เนื้อหาฉบับเต็มจะมาผ่าน CMS (C13)</p>
      </div>
    </div>
  );
}
